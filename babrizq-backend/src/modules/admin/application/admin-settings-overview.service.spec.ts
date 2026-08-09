/**
 * Unit tests for AdminSettingsService + AdminOverviewService — the
 * platform-settings singleton behavior and the commission-based revenue KPI.
 */
import { AdminSettingsService } from './admin-settings.service';
import { AdminOverviewService } from './admin-overview.service';
import { PrismaService } from '../../prisma/prisma.service';

const settingsRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  platformName: 'Bab Rizq',
  supportEmail: 'support@babrizq.com',
  defaultCurrency: 'SAR',
  commissionRate: 5.5,
  maintenanceMode: false,
  updatedAt: new Date('2026-08-09T00:00:00Z'),
  ...overrides,
});

const prisma = {
  platformSetting: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  user: { count: jest.fn() },
  store: { count: jest.fn() },
  order: { findMany: jest.fn() },
} as unknown as PrismaService;

const settingsService = new AdminSettingsService(prisma);
const overviewService = new AdminOverviewService(prisma);

beforeEach(() => jest.clearAllMocks());

describe('AdminSettingsService', () => {
  it('creates the singleton row with defaults when it is missing', async () => {
    (prisma.platformSetting.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.platformSetting.create as jest.Mock).mockResolvedValue(settingsRow());

    const result = await settingsService.getSettings();

    expect(prisma.platformSetting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 1,
        platformName: 'Bab Rizq',
        commissionRate: 5.5,
      }),
    });
    expect(result).toEqual({
      platformName: 'Bab Rizq',
      supportEmail: 'support@babrizq.com',
      defaultCurrency: 'SAR',
      commissionRate: 5.5,
      maintenanceMode: false,
    });
  });

  it('returns the existing row when present', async () => {
    (prisma.platformSetting.findUnique as jest.Mock).mockResolvedValue(
      settingsRow(),
    );

    const result = await settingsService.getSettings();

    expect(prisma.platformSetting.create).not.toHaveBeenCalled();
    expect(result.platformName).toBe('Bab Rizq');
  });

  it('updates only the provided fields via upsert', async () => {
    (prisma.platformSetting.upsert as jest.Mock).mockResolvedValue(
      settingsRow({ commissionRate: 8, maintenanceMode: true }),
    );

    const result = await settingsService.updateSettings({
      commissionRate: 8,
      maintenanceMode: true,
    });

    expect(prisma.platformSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        update: { commissionRate: 8, maintenanceMode: true },
      }),
    );
    expect(result.commissionRate).toBe(8);
    expect(result.maintenanceMode).toBe(true);
  });
});

describe('AdminOverviewService', () => {
  it('computes platform revenue as the commission share of delivered orders', async () => {
    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(1248) // totalUsers
      .mockResolvedValueOnce(3); // activeMarketers
    (prisma.store.count as jest.Mock).mockResolvedValue(2);
    (prisma.order.findMany as jest.Mock).mockResolvedValue([
      { total: 690 },
      { total: 310 },
    ]);
    (prisma.platformSetting.findUnique as jest.Mock).mockResolvedValue(
      settingsRow({ commissionRate: 5.5 }),
    );

    const result = await overviewService.getOverview();

    expect(result.totalUsers).toBe(1248);
    expect(result.totalStores).toBe(2);
    // (690 + 310) × 5.5% = 55
    expect(result.platformRevenue).toBe(55);
    expect(result.activeMarketers).toBe(3);
  });
});
