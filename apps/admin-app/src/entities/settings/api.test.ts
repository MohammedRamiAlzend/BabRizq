import { describe, expect, it } from 'vitest';
import { DEFAULT_PLATFORM_SETTINGS, getPlatformSettings, updatePlatformSettings } from './api';

describe('settings API (admin)', () => {
  it('returns the default platform settings', async () => {
    const settings = await getPlatformSettings();
    expect(settings).toEqual(DEFAULT_PLATFORM_SETTINGS);
  });

  it('defaults use SAR and a sane commission rate', async () => {
    const settings = await getPlatformSettings();
    expect(settings.defaultCurrency).toBe('SAR');
    expect(settings.commissionRate).toBeGreaterThan(0);
    expect(settings.commissionRate).toBeLessThan(100);
    expect(settings.maintenanceMode).toBe(false);
  });

  it('updates the platform settings', async () => {
    await updatePlatformSettings({ ...DEFAULT_PLATFORM_SETTINGS, maintenanceMode: true, commissionRate: 6 });
    const settings = await getPlatformSettings();
    expect(settings.maintenanceMode).toBe(true);
    expect(settings.commissionRate).toBe(6);
  });
});
