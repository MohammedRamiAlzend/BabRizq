/**
 * Settings entity — mock API (admin).
 *
 * Simulates the settings endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/PUT /api/admin/settings`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { PlatformSettings } from './model';

/** Default platform configuration. TODO(migration): replaced by `GET /api/admin/settings`. */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'Bab Rizq',
  supportEmail: 'support@babrizq.com',
  defaultCurrency: 'SAR',
  commissionRate: 5.5,
  maintenanceMode: false,
};

/** Simulates `GET /api/admin/settings`. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  return new Promise(resolve => setTimeout(() => resolve(DEFAULT_PLATFORM_SETTINGS), 100));
}

/** Simulates `PUT /api/admin/settings`. */
export async function updatePlatformSettings(settings: PlatformSettings): Promise<PlatformSettings> {
  return new Promise(resolve =>
    setTimeout(() => {
      Object.assign(DEFAULT_PLATFORM_SETTINGS, settings);
      resolve(DEFAULT_PLATFORM_SETTINGS);
    }, 100)
  );
}
