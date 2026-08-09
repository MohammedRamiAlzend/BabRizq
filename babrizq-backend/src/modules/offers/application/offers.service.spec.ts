/**
 * Unit tests for OffersService — the best-discount engine (no stacking),
 * ownership enforcement, and offer validation rules.
 */
import { OffersService } from './offers.service';
import { PrismaService } from '../../prisma/prisma.service';

const prisma = {
  store: { findUnique: jest.fn() },
  product: { findFirst: jest.fn() },
  offer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: { aggregate: jest.fn(), findFirst: jest.fn() },
} as unknown as PrismaService;

const service = new OffersService(prisma);

const offerRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'offer-1',
  storeId: 'store-techzone',
  productId: null,
  titleEn: 'Storewide -10%',
  titleAr: 'تخفيض 10%',
  discountType: 'percent',
  discountValue: 10,
  validFrom: null,
  validTo: null,
  status: 'active',
  redemptionCount: 0,
  createdAt: new Date('2026-08-09T10:00:00Z'),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('OffersService.bestDiscount', () => {
  const items = [
    { productId: 'prod-a', unitPrice: 100, qty: 2 }, // line 200
    { productId: 'prod-b', unitPrice: 50, qty: 1 }, // line 50
  ];

  it('returns zero when there are no offers', () => {
    expect(service.bestDiscount([], items)).toEqual({ discount: 0, offerId: null });
  });

  it('applies a store-wide percentage to the subtotal', () => {
    const offers = [
      offerRow({ id: 'o1', productId: null, discountType: 'percent', discountValue: 10 }),
    ];
    expect(service.bestDiscount(offers, items)).toEqual({ discount: 25, offerId: 'o1' });
  });

  it('applies a product fixed offer to its own line only', () => {
    const offers = [
      offerRow({ id: 'o2', productId: 'prod-a', discountType: 'fixed', discountValue: 150 }),
    ];
    expect(service.bestDiscount(offers, items)).toEqual({ discount: 150, offerId: 'o2' });
  });

  it('picks the single best offer (no stacking)', () => {
    const offers = [
      offerRow({ id: 'o3', productId: null, discountType: 'percent', discountValue: 10 }), // 25
      offerRow({ id: 'o4', productId: 'prod-a', discountType: 'fixed', discountValue: 150 }), // 150
      offerRow({ id: 'o5', productId: 'prod-b', discountType: 'percent', discountValue: 50 }), // 25
    ];
    expect(service.bestDiscount(offers, items)).toEqual({ discount: 150, offerId: 'o4' });
  });

  it('caps a fixed discount at the line total', () => {
    const offers = [
      offerRow({ id: 'o6', productId: 'prod-b', discountType: 'fixed', discountValue: 500 }),
    ];
    expect(service.bestDiscount(offers, items)).toEqual({ discount: 50, offerId: 'o6' });
  });
});

describe('OffersService.createOffer', () => {
  it('rejects a product that does not belong to the store', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createOffer('owner-1', 'store-techzone', {
        nameEn: 'x',
        nameAr: 'ي',
        productId: 'prod-x',
        discountType: 'fixed',
        discountValue: 10,
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
  });

  it('rejects percent discounts above 100', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });

    await expect(
      service.createOffer('owner-1', 'store-techzone', {
        nameEn: 'x',
        nameAr: 'ي',
        discountType: 'percent',
        discountValue: 120,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_DISCOUNT_VALUE' });
  });

  it('rejects an end date before the start date', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });

    await expect(
      service.createOffer('owner-1', 'store-techzone', {
        nameEn: 'x',
        nameAr: 'ي',
        discountType: 'fixed',
        discountValue: 10,
        startDate: '2026-09-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_OFFER_WINDOW' });
  });

  it('creates a store-wide offer with a zero redemption count', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.offer.create as jest.Mock).mockResolvedValue(offerRow());

    const view = await service.createOffer('owner-1', 'store-techzone', {
      nameEn: 'Storewide -10%',
      nameAr: 'تخفيض 10%',
      discountType: 'percent',
      discountValue: 10,
    });

    expect(view).toMatchObject({
      id: 'offer-1',
      type: 'store',
      isActive: true,
      redemptionCount: 0,
    });
  });
});

describe('OffersService.activeOffers', () => {
  it('queries active offers for the store (window enforced in SQL)', async () => {
    (prisma.offer.findMany as jest.Mock).mockResolvedValue([]);
    await service.activeOffers('store-techzone');
    expect(prisma.offer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: 'store-techzone',
          status: 'active',
        }),
      }),
    );
  });
});
