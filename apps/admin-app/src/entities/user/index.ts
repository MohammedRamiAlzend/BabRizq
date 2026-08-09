/**
 * User entity — public API (admin).
 *
 * @see ./model — the `PlatformUser` / `PlatformUserRole` contracts
 * @see ./api — mock endpoints (replace with real API at migration time)
 */
export type { PlatformUser, PlatformUserRole } from './model';
export { platformUsers, roleLabels, getUsers, updateUserRole, updateUserStatus } from './api';
