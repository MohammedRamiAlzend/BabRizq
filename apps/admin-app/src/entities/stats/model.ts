/**
 * Platform stats entity — domain model (admin).
 *
 * Extracted from the legacy `entities/adminData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). High-level platform KPIs shown on the admin
 * overview (`GET /api/admin/overview`).
 */
export interface PlatformStats {
  totalUsers: number;
  totalStores: number;
  platformRevenue: number;
  activeMarketers: number;
}
