/**
 * Settings entity — mock API (admin).
 *
 * Simulates the settings endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/PUT /api/admin/settings`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { PlatformSettings } from './model';
import { api } from '@/shared/lib/api';

/** Default platform configuration. TODO(migration): replaced by `GET /api/admin/settings`. */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'Bab Rizq',
  supportEmail: 'support@babrizq.com',
  defaultCurrency: 'SAR',
  commissionRate: 5.5,
  maintenanceMode: false,
};

/** GET /admin/settings — the singleton platform configuration. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  return api.get<PlatformSettings>('/admin/settings');
}

/** PUT /admin/settings — persist platform-wide configuration. */
export async function updatePlatformSettings(settings: PlatformSettings): Promise<PlatformSettings> {
  return api.put<PlatformSettings>('/admin/settings', settings);
}
