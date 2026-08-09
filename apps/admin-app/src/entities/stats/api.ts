/**
 * Platform stats entity — mock API (admin).
 *
 * Simulates `GET /api/admin/overview` from
 * `docs/needed-endpoints-from-backend.md`. Seed data is copied verbatim from
 * the legacy monolith.
 */
import { PlatformStats } from './model';

/** In-memory platform KPIs. TODO(migration): replaced by `GET /api/admin/overview`. */
export const platformStats: PlatformStats = {
  totalUsers: 1248,
  totalStores: 86,
  platformRevenue: 245800,
  activeMarketers: 134,
};

/** Simulates `GET /api/admin/overview`. */
export async function getPlatformStats(): Promise<PlatformStats> {
  return new Promise(resolve => setTimeout(() => resolve(platformStats), 100));
}
