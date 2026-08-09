/**
 * Unit tests for MarketerService — balance computation, link generation,
 * withdrawal guards, and the performance timeline shape.
 */
import { MarketerService } from './marketer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/application/notifications.service';

const linkRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'link-1',
  url: 'https://babrizq.app/s/s1?ref=marketer-1',
  marketerUserId: 'marketer-1',
  storeId: 's1',
  productId: null,
  targetNameEn: 'TechZone',
  targetNameAr: 'تك زون',
  type: 'store',
  clicks: 100,
  conversions: 10,
  earned: 50,
  createdAt: new Date('2026-07-01T00:00:00Z'),
  ...overrides,
});

const prisma = {
  affiliateLink: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  store: { findUnique: jest.fn(), findMany: jest.fn() },
  product: { findUnique: jest.fn(), findMany: jest.fn() },
  withdrawalRequest: { findMany: jest.fn(), create: jest.fn() },
  marketerSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
} as unknown as PrismaService;

const notifications = {
  create: jest.fn().mockResolvedValue(undefined),
} as unknown as NotificationsService;

const service = new MarketerService(prisma, notifications);

beforeEach(() => jest.clearAllMocks());

describe('MarketerService.overview', () => {
  it('computes balance = total earned − reserved (non-rejected) withdrawals', async () => {
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([
      linkRow({ earned: 1305, clicks: 1243, conversions: 87 }),
      linkRow({ id: 'link-2', earned: 782, clicks: 856, conversions: 34 }),
      linkRow({ id: 'link-3', earned: 378, clicks: 432, conversions: 21 }),
    ]);
    (prisma.withdrawalRequest.findMany as jest.Mock).mockResolvedValue([
      { status: 'paid', amount: 500 },
      { status: 'pending', amount: 200 },
      { status: 'rejected', amount: 100 }, // rejected is not reserved
    ]);

    const result = await service.overview('marketer-1');

    expect(result.totalEarned).toBe(2465);
    expect(result.balance).toBe(2465 - 700);
    expect(result.totalClicks).toBe(1243 + 856 + 432);
    expect(result.totalConversions).toBe(87 + 34 + 21);
    // Top 3 links are ordered by earned descending.
    expect(result.topLinks.map((l) => l.earned)).toEqual([1305, 782, 378]);
  });
});

describe('MarketerService.generateLink', () => {
  it('returns the existing link when one already targets the store', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 's1',
      nameEn: 'TechZone',
      nameAr: 'تك زون',
    });
    (prisma.affiliateLink.findFirst as jest.Mock).mockResolvedValue(linkRow());

    const result = await service.generateLink('marketer-1', {
      targetId: 's1',
      targetType: 'store',
    });

    expect(result.id).toBe('link-1');
    expect(prisma.affiliateLink.create).not.toHaveBeenCalled();
  });

  it('creates a new zero-stat link for a fresh product target', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      nameEn: 'Headphones',
      nameAr: 'سماعات',
    });
    (prisma.affiliateLink.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.affiliateLink.create as jest.Mock).mockResolvedValue(
      linkRow({
        id: 'link-new',
        productId: 'p1',
        storeId: null,
        type: 'product',
        clicks: 0,
        conversions: 0,
        earned: 0,
        targetNameEn: 'Headphones',
        targetNameAr: 'سماعات',
      }),
    );

    const result = await service.generateLink('marketer-1', {
      targetId: 'p1',
      targetType: 'product',
    });

    expect(prisma.affiliateLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          marketerUserId: 'marketer-1',
          productId: 'p1',
          type: 'product',
          url: expect.stringContaining('/p/p1?ref='),
        }),
      }),
    );
    expect(result.clicks).toBe(0);
  });

  it('throws TARGET_NOT_FOUND for an unknown store', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateLink('marketer-1', { targetId: 'nope', targetType: 'store' }),
    ).rejects.toMatchObject({ code: 'TARGET_NOT_FOUND' });
  });
});

describe('MarketerService.withdraw', () => {
  it('creates a request with the bank IBAN when payout method is bank', async () => {
    (prisma.marketerSettings.findUnique as jest.Mock).mockResolvedValue({
      payoutMethod: 'bank',
    });
    // Balance check path (overview → aggregates + withdrawals).
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([
      linkRow({ earned: 500 }),
    ]);
    (prisma.withdrawalRequest.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.withdrawalRequest.create as jest.Mock).mockResolvedValue({
      id: 'wd-1',
      status: 'pending',
      estimatedDays: 2,
    });

    const result = await service.withdraw('marketer-1', {
      amount: 100,
      bankIban: 'SA0380000000608010167519',
    });

    expect(prisma.withdrawalRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 100, bankIban: 'SA0380000000608010167519' }),
      }),
    );
    expect(result).toEqual({ requestId: 'wd-1', status: 'pending', estimatedDays: 2 });
  });

  it('requires an IBAN for bank payouts', async () => {
    (prisma.marketerSettings.findUnique as jest.Mock).mockResolvedValue({
      payoutMethod: 'bank',
    });

    await expect(
      service.withdraw('marketer-1', { amount: 100 }),
    ).rejects.toMatchObject({ code: 'BANK_IBAN_REQUIRED' });
    expect(prisma.withdrawalRequest.create).not.toHaveBeenCalled();
  });

  it('requires a wallet id for wallet payouts', async () => {
    (prisma.marketerSettings.findUnique as jest.Mock).mockResolvedValue({
      payoutMethod: 'wallet',
    });

    await expect(
      service.withdraw('marketer-1', { amount: 100 }),
    ).rejects.toMatchObject({ code: 'WALLET_ID_REQUIRED' });
  });

  it('rejects amounts larger than the available balance', async () => {
    (prisma.marketerSettings.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([
      linkRow({ earned: 50 }),
    ]);
    (prisma.withdrawalRequest.findMany as jest.Mock).mockResolvedValue([]);

    await expect(
      service.withdraw('marketer-1', { amount: 999, bankIban: 'SA0380000000608010167519' }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
  });
});

describe('MarketerService.performance', () => {
  it('builds a 7-bucket weekly timeline that sums to the link totals', async () => {
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([
      linkRow({ clicks: 100, conversions: 10 }),
    ]);

    const result = await service.performance('marketer-1', { period: 'weekly' });

    expect(result.timeline).toHaveLength(7);
    expect(result.timeline.reduce((s, b) => s + b.clicks, 0)).toBe(100);
    expect(result.timeline.reduce((s, b) => s + b.conversions, 0)).toBe(10);
    expect(result.timeline[0]).toEqual(
      expect.objectContaining({
        label: expect.any(String),
        labelAr: expect.any(String),
      }),
    );
  });

  it('builds a 4-bucket monthly timeline', async () => {
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([
      linkRow({ clicks: 40, conversions: 4 }),
    ]);

    const result = await service.performance('marketer-1', { period: 'monthly' });

    expect(result.timeline).toHaveLength(4);
    expect(result.timeline.reduce((s, b) => s + b.clicks, 0)).toBe(40);
  });

  it('computes the conversion rate from the aggregates', async () => {
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([
      linkRow({ clicks: 100, conversions: 10 }),
    ]);

    const result = await service.performance('marketer-1', { period: 'weekly' });

    expect(result.conversionRate).toBe(10);
    expect(result.totalEarned).toBe(50);
    expect(result.byLink).toHaveLength(1);
    expect(result.byLink[0]).toEqual(
      expect.objectContaining({ linkId: 'link-1', clicks: 100, conversions: 10 }),
    );
  });

  it('throws LINK_NOT_FOUND when filtering by an unknown link id', async () => {
    (prisma.affiliateLink.findMany as jest.Mock).mockResolvedValue([]);

    await expect(
      service.performance('marketer-1', { period: 'weekly', linkId: 'nope' }),
    ).rejects.toMatchObject({ code: 'LINK_NOT_FOUND' });
  });
});

describe('MarketerService.updateSettings', () => {
  it('requires an IBAN when switching the payout method to bank', async () => {
    (prisma.marketerSettings.findUnique as jest.Mock).mockResolvedValue({
      payoutMethod: 'wallet',
      walletId: 'wallet-1',
      bankIban: null,
    });

    await expect(
      service.updateSettings('marketer-1', { payoutMethod: 'bank' }),
    ).rejects.toMatchObject({ code: 'BANK_IBAN_REQUIRED' });
    expect(prisma.marketerSettings.upsert).not.toHaveBeenCalled();
  });

  it('upserts partial notification preferences', async () => {
    (prisma.marketerSettings.findUnique as jest.Mock).mockResolvedValue({
      payoutMethod: 'bank',
      bankIban: 'SA0380000000608010167519',
      walletId: null,
      notifyNewConversion: true,
      notifyPayoutProcessed: true,
      notifyPromotions: false,
    });
    (prisma.marketerSettings.upsert as jest.Mock).mockResolvedValue({
      payoutMethod: 'bank',
      bankIban: 'SA0380000000608010167519',
      walletId: null,
      notifyNewConversion: false,
      notifyPayoutProcessed: true,
      notifyPromotions: true,
    });

    const result = await service.updateSettings('marketer-1', {
      notifications: { newConversion: false, promotions: true },
    });

    expect(result.notifications).toEqual({
      newConversion: false,
      payoutProcessed: true,
      promotions: true,
    });
  });
});
