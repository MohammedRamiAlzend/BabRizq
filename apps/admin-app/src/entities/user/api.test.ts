/**
 * User API tests (admin) — the entity functions now call the real backend
 * through the shared API client, so `fetch` is stubbed and the tests assert
 * the envelope unwrapping and the URL/method/body sent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUsers, roleLabels, updateUserRole, updateUserStatus } from './api';

/** Builds the standard backend response envelope. */
const envelope = <T>(value: T) => ({
  isSuccess: true,
  isError: false,
  errors: [],
  topError: null,
  value,
});

/** A fetch Response-like object. */
const okResponse = (value: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => value }) as Response;

/** A valid backend user row (PlatformUserView). */
const userDto = (over: Record<string, string> = {}) => ({
  id: '1',
  name: 'System Admin',
  nameAr: 'مدير النظام',
  email: 'admin@babrizq.com',
  role: 'admin',
  status: 'active',
  joinedDate: '2024-01-01',
  ...over,
});

describe('user API (admin) — real backend calls', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET /admin/users returns mapped users across roles', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        envelope([
          userDto(),
          userDto({ id: '2', name: 'Ahmed Al-Rashid', role: 'store_owner' }),
          userDto({ id: '5', name: 'Youssef Ali', role: 'delivery' }),
        ])
      )
    );

    const users = await getUsers();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(users).toHaveLength(3);
    expect(users[0].role).toBe('admin');
    expect(users[1].role).toBe('store_owner');
    expect(users[2].role).toBe('delivery');
    for (const user of users) {
      expect(roleLabels[user.role].en).toBeTruthy();
      expect(roleLabels[user.role].ar).toBeTruthy();
    }
  });

  it('PUT /admin/users/:id/role sends the new role and returns the user', async () => {
    fetchMock.mockResolvedValue(okResponse(envelope(userDto({ id: '6', role: 'marketer' }))));

    const updated = await updateUserRole('6', 'marketer');

    expect(updated.id).toBe('6');
    expect(updated.role).toBe('marketer');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users/6/role'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ role: 'marketer' }),
      })
    );
  });

  it('PUT /admin/users/:id/status suspends a user', async () => {
    fetchMock.mockResolvedValue(okResponse(envelope(userDto({ id: '3', status: 'suspended' }))));

    const suspended = await updateUserStatus('3', 'suspended');

    expect(suspended.status).toBe('suspended');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users/3/status'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ status: 'suspended' }) })
    );
  });

  it('propagates backend errors as rejections', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        {
          isSuccess: false,
          isError: true,
          errors: ['User not found'],
          topError: { code: 'USER_NOT_FOUND', message: 'User not found' },
          value: null,
        },
        404
      )
    );

    await expect(updateUserRole('nope', 'admin')).rejects.toThrow('User not found');
  });
});
