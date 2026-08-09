/**
 * Admin mapper — converts Prisma rows into the shapes the admin app's
 * `needed-endpoints-from-backend` docs define (PlatformUser,
 * PlatformSettings). `PlatformUser.name` maps from the DB's `nameEn`, and
 * `joinedDate` is the account's creation date (YYYY-MM-DD).
 */
import { PlatformSetting, User } from '@prisma/client';

/** PlatformUser shape from `_shared.md`. */
export interface PlatformUserView {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  joinedDate: string; // YYYY-MM-DD
}

/** PlatformSettings shape from `_shared.md`. */
export interface PlatformSettingsView {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
  maintenanceMode: boolean;
}

/** Maps a User row → the documented PlatformUser view (password never leaves the service). */
export function toPlatformUserView(user: User): PlatformUserView {
  return {
    id: user.id,
    name: user.nameEn,
    nameAr: user.nameAr,
    email: user.email,
    role: user.role,
    status: user.status as 'active' | 'suspended',
    joinedDate: user.createdAt.toISOString().slice(0, 10),
  };
}

/** Maps the singleton PlatformSetting row → the documented settings view. */
export function toPlatformSettingsView(
  settings: PlatformSetting,
): PlatformSettingsView {
  return {
    platformName: settings.platformName,
    supportEmail: settings.supportEmail,
    defaultCurrency: settings.defaultCurrency,
    commissionRate: settings.commissionRate,
    maintenanceMode: settings.maintenanceMode,
  };
}
