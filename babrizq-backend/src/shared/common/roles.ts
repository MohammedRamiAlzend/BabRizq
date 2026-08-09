/**
 * Platform roles — the single source of truth for RBAC.
 *
 * Mirrors the six role apps (`customer`, `store_owner`, `back_office`,
 * `delivery`, `marketer`, `admin`). Stored as strings in the DB (SQLite has
 * no enums); validated by DTOs at the boundary.
 */
export const ROLES = [
  'customer',
  'store_owner',
  'back_office',
  'delivery',
  'marketer',
  'admin',
] as const;

export type Role = (typeof ROLES)[number];

/** Roles that can self-register through the public API. */
export const PUBLIC_REGISTRATION_ROLES: readonly Role[] = ['customer', 'store_owner'];
