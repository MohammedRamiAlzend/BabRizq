import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles. Used together with the global
 * `RolesGuard`.
 *
 * @example @Roles('store_owner', 'admin')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
