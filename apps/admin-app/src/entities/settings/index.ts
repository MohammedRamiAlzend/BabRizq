/**
 * Settings entity — public API (admin).
 *
 * @see ./model — the `PlatformSettings` contract
 * @see ./api — mock endpoints (replace with real API at migration time)
 */
export type { PlatformSettings } from './model';
export { DEFAULT_PLATFORM_SETTINGS, getPlatformSettings, updatePlatformSettings } from './api';
