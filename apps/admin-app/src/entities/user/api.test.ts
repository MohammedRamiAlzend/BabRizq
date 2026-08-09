import { describe, expect, it } from 'vitest';
import { platformUsers, roleLabels, getUsers, updateUserRole, updateUserStatus } from './api';

describe('user API (admin)', () => {
  it('returns all platform users', async () => {
    const users = await getUsers();
    expect(users).toHaveLength(platformUsers.length);
  });

  it('users cover every platform role', async () => {
    const users = await getUsers();
    const roles = new Set(users.map(u => u.role));
    expect(roles.has('admin')).toBe(true);
    expect(roles.has('store_owner')).toBe(true);
    expect(roles.has('marketer')).toBe(true);
    expect(roles.has('back_office')).toBe(true);
    expect(roles.has('delivery')).toBe(true);
    expect(roles.has('customer')).toBe(true);
  });

  it('role labels exist for every role', async () => {
    const users = await getUsers();
    for (const user of users) {
      const label = roleLabels[user.role];
      expect(label.en).toBeTruthy();
      expect(label.ar).toBeTruthy();
    }
  });

  it('updates a user role', async () => {
    const updated = await updateUserRole('6', 'marketer');
    expect(updated.id).toBe('6');
    expect(updated.role).toBe('marketer');
  });

  it('suspends and reactivates a user', async () => {
    const suspended = await updateUserStatus('3', 'suspended');
    expect(suspended.status).toBe('suspended');
    const reactivated = await updateUserStatus('3', 'active');
    expect(reactivated.status).toBe('active');
  });

  it('rejects updates for unknown users', async () => {
    await expect(updateUserRole('nope', 'admin')).rejects.toThrow('User not found');
  });
});
