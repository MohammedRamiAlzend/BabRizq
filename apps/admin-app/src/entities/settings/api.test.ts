/**
 * Settings API tests (admin) — real backend calls through the shared client,
 * with `fetch` stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlatformSettings, updatePlatformSettings } from './api';

/** Builds the standard backend response envelope. */
const envelope = <T>(value: T) => ({
  isSuccess: true,
  isError: false,
  errors: [],
  topError: null,
  value,
});

/** A fetch Response-like object. */
const okResponse = (value: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => value }) as Response;

/** A valid backend PlatformSettings row. */
const settingsDto = (over: Record<string, unknown> = {}) => ({
  platformName: 'Bab Rizq',
  supportEmail: 'support@babrizq.com',
  defaultCurrency: 'SAR',
  commissionRate: 5.5,
  maintenanceMode: false,
  ...over,
});

describe('settings API (admin) — real backend calls', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET /admin/settings returns the platform settings', async () => {
    fetchMock.mockResolvedValue(okResponse(envelope(settingsDto())));

    const settings = await getPlatformSettings();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/settings'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(settings.defaultCurrency).toBe('SAR');
    expect(settings.commissionRate).toBeGreaterThan(0);
    expect(settings.commissionRate).toBeLessThan(100);
    expect(settings.maintenanceMode).toBe(false);
  });

  it('PUT /admin/settings persists changes and returns the saved row', async () => {
    fetchMock.mockResolvedValue(okResponse(envelope(settingsDto({ maintenanceMode: true, commissionRate: 6 }))));

    const settings = await updatePlatformSettings({
      platformName: 'Bab Rizq',
      supportEmail: 'support@babrizq.com',
      defaultCurrency: 'SAR',
      commissionRate: 6,
      maintenanceMode: true,
    });

    expect(settings.maintenanceMode).toBe(true);
    expect(settings.commissionRate).toBe(6);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/settings'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          platformName: 'Bab Rizq',
          supportEmail: 'support@babrizq.com',
          defaultCurrency: 'SAR',
          commissionRate: 6,
          maintenanceMode: true,
        }),
      })
    );
  });
});
