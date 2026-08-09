import { describe, expect, it } from 'vitest';
import { INITIAL_NOTIFICATIONS, getNotifications, markNotificationsRead } from './api';

describe('notification API (back office)', () => {
  it('returns all notifications', async () => {
    const notifications = await getNotifications();
    expect(notifications).toHaveLength(INITIAL_NOTIFICATIONS.length);
  });

  it('starts with both read and unread notifications', async () => {
    const notifications = await getNotifications();
    expect(notifications.some(n => n.isRead)).toBe(true);
    expect(notifications.some(n => !n.isRead)).toBe(true);
  });

  it('marks selected notifications as read', async () => {
    const notifications = await getNotifications();
    const unread = notifications.filter(n => !n.isRead);
    expect(unread.length).toBeGreaterThan(0);

    await markNotificationsRead([unread[0].id, unread[1].id]);

    const after = await getNotifications();
    const targetIds = new Set([unread[0].id, unread[1].id]);
    for (const notification of after) {
      if (targetIds.has(notification.id)) {
        expect(notification.isRead).toBe(true);
      }
    }
  });
});
