/**
 * Settings entity — domain model (admin).
 *
 * Extracted from the legacy `entities/adminData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Platform-wide configuration managed by the
 * admin (`GET/PUT /api/admin/settings`).
 */
export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
  maintenanceMode: boolean;
}
