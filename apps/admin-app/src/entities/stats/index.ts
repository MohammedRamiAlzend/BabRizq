/**
 * Platform stats entity — public API (admin).
 *
 * @see ./model — the `PlatformStats` contract
 * @see ./api — mock endpoints (replace with real API at migration time)
 */
export type { PlatformStats } from './model';
export { platformStats, getPlatformStats } from './api';
