/**
 * User entity — domain model (admin).
 *
 * Extracted from the legacy `entities/adminData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). The admin manages every platform account:
 * roles and activation status across all roles
 * (`GET/POST /api/admin/users`, `PUT /api/admin/users/{id}/role`,
 * `PUT /api/admin/users/{id}/status`, `DELETE /api/admin/users/{id}`).
 */

/** Every role that exists on the Bab Rizq platform. */
export type PlatformUserRole =
  | 'admin'
  | 'store_owner'
  | 'marketer'
  | 'back_office'
  | 'delivery'
  | 'customer';

/** A platform account. */
export interface PlatformUser {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: PlatformUserRole;
  status: 'active' | 'suspended';
  joinedDate: string;
}
