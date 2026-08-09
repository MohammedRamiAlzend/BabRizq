/**
 * Unit tests for AdminUsersService — role/email validation, generated
 * temporary passwords, self-protection guards, and the FK-guarded delete.
 */
import { Prisma } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../../prisma/prisma.service';

const userRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'a@b.com',
  passwordHash: 'hash',
  nameEn: 'Ahmed',
  nameAr: 'أحمد',
  phone: null,
  role: 'customer',
  status: 'active',
  isAvailable: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const prisma = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaService;

const service = new AdminUsersService(prisma);

beforeEach(() => jest.clearAllMocks());

describe('AdminUsersService.createUser', () => {
  it('rejects unknown roles with INVALID_ROLE (422)', async () => {
    await expect(
      service.createUser('actor-1', {
        name: 'X',
        nameAr: 'إكس',
        email: 'x@babrizq.com',
        role: 'superuser',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE', status: 422 });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email with EMAIL_ALREADY_EXISTS', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(userRow());

    await expect(
      service.createUser('actor-1', {
        name: 'X',
        nameAr: 'إكس',
        email: 'A@B.COM',
        role: 'customer',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });
  });

  it('creates the user and returns a generated temporary password when none is supplied', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(userRow());

    const result = await service.createUser('actor-1', {
      name: 'Ahmed',
      nameAr: 'أحمد',
      email: 'ahmed@babrizq.com',
      role: 'store_owner',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'ahmed@babrizq.com',
        role: 'store_owner',
        nameEn: 'Ahmed',
        passwordHash: expect.stringMatching(/^\$2/), // bcrypt hash
      }),
    });
    expect(result.tempPassword).toBeDefined();
    expect(result.tempPassword!.length).toBeGreaterThanOrEqual(8);
  });

  it('does not return a temp password when the caller supplied one', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue(userRow());

    const result = await service.createUser('actor-1', {
      name: 'Ahmed',
      nameAr: 'أحمد',
      email: 'ahmed@babrizq.com',
      role: 'customer',
      password: 'SuperSecret123',
    });

    expect(result.tempPassword).toBeUndefined();
  });
});

describe('AdminUsersService.updateRole', () => {
  it('rejects unknown roles and missing users', async () => {
    await expect(
      service.updateRole('u1', 'bogus'),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE' });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      service.updateRole('u1', 'marketer'),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('updates the role and returns the PlatformUser view', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(userRow());
    (prisma.user.update as jest.Mock).mockResolvedValue(
      userRow({ role: 'marketer' }),
    );

    const result = await service.updateRole('u1', 'marketer');

    expect(result.role).toBe('marketer');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'marketer' },
    });
  });
});

describe('AdminUsersService.updateStatus', () => {
  it('blocks an admin from suspending their own account', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      userRow({ id: 'actor-1', role: 'admin' }),
    );

    await expect(
      service.updateStatus('actor-1', 'suspended', 'actor-1'),
    ).rejects.toMatchObject({ code: 'CANNOT_SUSPEND_SELF' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('allows suspending another user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(userRow());
    (prisma.user.update as jest.Mock).mockResolvedValue(
      userRow({ status: 'suspended' }),
    );

    const result = await service.updateStatus('u1', 'suspended', 'actor-1');

    expect(result.status).toBe('suspended');
  });
});

describe('AdminUsersService.deleteUser', () => {
  it('blocks self-deletion with CANNOT_DELETE_SELF', async () => {
    await expect(
      service.deleteUser('actor-1', 'actor-1'),
    ).rejects.toMatchObject({ code: 'CANNOT_DELETE_SELF' });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('throws USER_NOT_FOUND for unknown users', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.deleteUser('u99', 'actor-1'),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('maps a foreign-key violation to USER_HAS_RELATED_DATA', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(userRow());
    (prisma.user.delete as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('fk failure', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.deleteUser('u1', 'actor-1'),
    ).rejects.toMatchObject({ code: 'USER_HAS_RELATED_DATA', status: 409 });
  });

  it('deletes the user and returns null', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(userRow());
    (prisma.user.delete as jest.Mock).mockResolvedValue(userRow());

    const result = await service.deleteUser('u1', 'actor-1');

    expect(result).toBeNull();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
