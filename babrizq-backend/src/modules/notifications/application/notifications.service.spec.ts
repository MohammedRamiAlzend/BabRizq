/**
 * Unit tests for NotificationsService — pagination, ownership, and the
 * read / mark-read flows.
 */
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

const prisma = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaService;

const service = new NotificationsService(prisma);

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  type: 'new_order',
  titleEn: 'New order',
  titleAr: 'طلب جديد',
  bodyEn: 'body',
  bodyAr: 'نص',
  isRead: false,
  orderId: null,
  timestamp: new Date('2026-08-09T10:00:00Z'),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('NotificationsService.listForUser', () => {
  it('returns only the user’s notifications, paginated', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([row()]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(1);

    const page = await service.listForUser('u1', { page: 1, pageSize: 20 });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientUserId: 'u1' } }),
    );
    expect(page.totalItems).toBe(1);
    expect(page.items[0]).toMatchObject({ id: 'n1', isRead: false });
  });

  it('filters unread when requested', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(0);

    await service.listForUser('u1', { page: 1, pageSize: 20, unreadOnly: true });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientUserId: 'u1', isRead: false } }),
    );
  });
});

describe('NotificationsService.markRead', () => {
  it('rejects notifications that do not belong to the user', async () => {
    (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    await expect(service.markRead('u1', 'n9')).rejects.toMatchObject({
      code: 'NOTIFICATION_NOT_FOUND',
    });
  });

  it('marks an owned notification as read', async () => {
    (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    await expect(service.markRead('u1', 'n1')).resolves.toEqual({ isRead: true });
  });
});

describe('NotificationsService.unreadCount + markAllRead', () => {
  it('returns the unread count', async () => {
    (prisma.notification.count as jest.Mock).mockResolvedValue(3);
    await expect(service.unreadCount('u1')).resolves.toEqual({ unreadCount: 3 });
  });

  it('marks all unread as read and reports how many were updated', async () => {
    (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    await expect(service.markAllRead('u1')).resolves.toEqual({ updated: 2 });
  });
});

describe('NotificationsService.create', () => {
  it('creates a row with the default prisma client', async () => {
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
    await service.create('u1', {
      type: 'payout',
      titleEn: 'Withdrawal',
      titleAr: 'سحب',
      bodyEn: 'body',
      bodyAr: 'نص',
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientUserId: 'u1',
        type: 'payout',
        orderId: null,
      }),
    });
  });
});
