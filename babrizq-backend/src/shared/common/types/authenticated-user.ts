/**
 * Authenticated identity types.
 *
 * The JWT payload mirrors the claims the frontend mock JWT already produces
 * (`nameidentifier` = user GUID, `role`, `name`, `email` — see
 * `apps/customer-app/src/features/auth/model/authContext.tsx`) so swapping the
 * frontend's mock auth for the real API is a drop-in change.
 */
import { Role } from '../roles';

export interface JwtPayload {
  /** User GUID — `nameidentifier` in the frontend mock. */
  sub: string;
  email: string;
  role: Role;
  nameEn: string;
  nameAr: string;
  status: 'active' | 'suspended';
  /** Unix timestamp (seconds). */
  iat: number;
  exp: number;
}

/** The `req.user` object after JWT validation. */
export type AuthenticatedUser = Pick<JwtPayload, 'sub' | 'email' | 'role' | 'nameEn' | 'nameAr' | 'status'>;
