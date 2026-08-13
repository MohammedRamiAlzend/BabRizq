/**
 * Admin users service — platform account management (`users.md`).
 *
 * Documented error codes:
 *   USER_NOT_FOUND (404) · EMAIL_ALREADY_EXISTS (409) · INVALID_ROLE (422) ·
 *   CANNOT_DELETE_SELF (400) — plus CANNOT_SUSPEND_SELF (400) so an admin
 *   cannot lock themselves out, and USER_HAS_RELATED_DATA (409) when the
 *   account owns data (e.g. stores) that prevents deletion.
 *
 * Creating a user without a `password` generates a random one, which is
 * returned once as `tempPassword` so the admin can hand it over (the invite
 * email pipeline lands in the integrations phase).
 */
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { ROLES } from '../../../shared/common/roles';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformUserView, toPlatformUserView } from './admin.mapper';

/** Generates a 12-character, URL-safe temporary password. */
const generatePassword = (): string => randomBytes(9).toString('base64url');

/** AdminProfile shape (admin-app profile.md). */
export interface AdminProfileView {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: 'admin';
  joinedDate: string;
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** GET /admin/users — paginated, searchable by name/email, role-filterable. */
  async listUsers(query: {
    page: number;
    pageSize: number;
    search?: string;
    role?: string;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search } },
              { nameAr: { contains: query.search } },
              { email: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [users, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginated(
      users.map(toPlatformUserView),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /**
   * POST /admin/users — creates a platform account with any role.
   * Returns the created PlatformUser plus `tempPassword` when one was
   * generated (i.e. the caller did not supply a password).
   */
  async createUser(
    actorId: string,
    dto: {
      name: string;
      nameAr: string;
      email: string;
      role: string;
      password?: string;
      phone?: string;
    },
  ): Promise<PlatformUserView & { tempPassword?: string }> {
    this.assertValidRole(dto.role);

    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw ApiError.conflict('EMAIL_ALREADY_EXISTS', 'Email is already in use');
    }

    const password = dto.password ?? generatePassword();
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        nameEn: dto.name,
        nameAr: dto.nameAr,
        phone: dto.phone ?? null,
        role: dto.role,
      },
    });
    this.logger.log(`Admin ${actorId} created user ${user.id} (${email}, ${dto.role})`);

    return dto.password
      ? toPlatformUserView(user)
      : { ...toPlatformUserView(user), tempPassword: password };
  }

  /** PUT /admin/users/:id/role — role change with INVALID_ROLE validation. */
  async updateRole(
    userId: string,
    role: string,
  ): Promise<PlatformUserView> {
    this.assertValidRole(role);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return toPlatformUserView(updated);
  }

  /** PUT /admin/users/:id/status — activate/suspend (self-suspend blocked). */
  async updateStatus(
    userId: string,
    status: 'active' | 'suspended',
    actorId: string,
  ): Promise<PlatformUserView> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }
    if (userId === actorId && status === 'suspended') {
      throw ApiError.badRequest(
        'CANNOT_SUSPEND_SELF',
        'An admin cannot suspend their own account',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    return toPlatformUserView(updated);
  }

  // ---- My account (profile.md) ----

  /** GET /admin/me — the current admin's profile. */
  async getMe(actorId: string): Promise<AdminProfileView> {
    const user = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }
    return this.toProfileView(user);
  }

  /** PUT /admin/me — partial profile update (name / nameAr / email). */
  async updateMe(
    actorId: string,
    dto: { name?: string; nameAr?: string; email?: string },
  ): Promise<AdminProfileView> {
    if (dto.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (clash && clash.id !== actorId) {
        throw ApiError.conflict('EMAIL_ALREADY_EXISTS', 'Email is already in use');
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.nameEn = dto.name;
    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr;
    if (dto.email !== undefined) data.email = dto.email;

    const updated = await this.prisma.user.update({
      where: { id: actorId },
      data,
    });
    return this.toProfileView(updated);
  }

  /**
   * POST /admin/me/change-password — verifies the current password first.
   * Error codes per profile.md: WRONG_CURRENT_PASSWORD (401),
   * PASSWORDS_DO_NOT_MATCH (422), PASSWORD_TOO_SHORT (422).
   */
  async changePassword(
    actorId: string,
    dto: { currentPassword: string; newPassword: string; confirmPassword: string },
  ): Promise<null> {
    const user = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new ApiError('WRONG_CURRENT_PASSWORD', 401, 'Current password is incorrect');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ApiError('PASSWORDS_DO_NOT_MATCH', 422, 'New password and confirmation do not match');
    }
    if (dto.newPassword.length < 8) {
      throw new ApiError('PASSWORD_TOO_SHORT', 422, 'New password must be at least 8 characters');
    }
    await this.prisma.user.update({
      where: { id: actorId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return null;
  }

  private toProfileView(user: {
    id: string;
    nameEn: string;
    nameAr: string;
    email: string;
    role: string;
    createdAt: Date;
  }): AdminProfileView {
    return {
      id: user.id,
      name: user.nameEn,
      nameAr: user.nameAr,
      email: user.email,
      role: user.role as AdminProfileView['role'],
      joinedDate: user.createdAt.toISOString(),
    };
  }

  /** DELETE /admin/users/:id — self-deletion blocked; FK-guarded delete. */
  async deleteUser(userId: string, actorId: string): Promise<null> {    if (userId === actorId) {
      throw ApiError.badRequest(
        'CANNOT_DELETE_SELF',
        'An admin cannot delete their own account',
      );
    }
    if (!(await this.prisma.user.findUnique({ where: { id: userId } }))) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }

    try {
      await this.prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      // P2003 = foreign-key constraint (e.g. the user owns a store).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw ApiError.conflict(
          'USER_HAS_RELATED_DATA',
          'This user owns stores or other related data and cannot be deleted',
        );
      }
      throw error;
    }
    this.logger.log(`Admin ${actorId} deleted user ${userId}`);
    return null;
  }

  private assertValidRole(role: string): void {
    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      throw new ApiError('INVALID_ROLE', 422, `Unknown role: ${role}`);
    }
  }
}
