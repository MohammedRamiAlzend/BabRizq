/**
 * Platform stats entity — mock API (admin).
 *
 * Simulates `GET /api/admin/overview` from
 * `docs/needed-endpoints-from-backend.md`. Seed data is copied verbatim from
 * the legacy monolith.
 */
import { PlatformStats } from './model';
import { api } from '@/shared/lib/api';

/** In-memory platform KPIs. TODO(migration): replaced by `GET /api/admin/overview`. */
export const platformStats: PlatformStats = {
  totalUsers: 1248,
  totalStores: 86,
  platformRevenue: 245800,
  activeMarketers: 134,
};

/** GET /admin/overview — platform KPIs (users, stores, revenue, marketers). */
export async function getPlatformStats(): Promise<PlatformStats> {
  return api.get<PlatformStats>('/admin/overview');
}
