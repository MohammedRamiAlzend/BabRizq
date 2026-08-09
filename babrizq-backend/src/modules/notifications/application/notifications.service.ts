/**
 * Notifications application service — the platform's single writer for
 * `Notification` rows and the read API surfaced to every role app
 * (`GET /notifications`, unread count, mark read / read-all).
 *
 * Domain services that need to notify a user call `create(...)`, optionally
 * passing their Prisma transaction so the notification commits atomically
 * with the business event that produced it (e.g. an order placement).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';

/** Notification types — the single source of truth for the `type` column. */
export const NOTIFICATION_TYPES = [
  'new_order', // store owner: a customer placed an order
  'order_status', // customer: their order moved to a new status
  'driver_update', // driver: dispatch / assignment info
  'delivery_confirmed', // customer + store owner: order delivered
  'payout', // marketer: withdrawal lifecycle
  'low_stock', // store owner: a product is running low
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreateNotificationInput {
  type: NotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  orderId?: string | null;
}

export interface NotificationView {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  isRead: boolean;
  orderId: string | null;
  timestamp: string;
}

const VIEW_SELECT = {
  id: true,
  type: true,
  titleEn: true,
  titleAr: true,
  bodyEn: true,
  bodyAr: true,
  isRead: true,
  orderId: true,
  timestamp: true,
} satisfies Prisma.NotificationSelect;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates a notification for one recipient (inside a caller tx when given). */
  async create(
    recipientUserId: string,
    input: CreateNotificationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.notification.create({
      data: {
        recipientUserId,
        type: input.type,
        titleEn: input.titleEn,
        titleAr: input.titleAr,
        bodyEn: input.bodyEn,
        bodyAr: input.bodyAr,
        orderId: input.orderId ?? null,
      },
    });
  }

  /** GET /notifications — paginated, own notifications only, optional unread filter. */
  async listForUser(
    userId: string,
    query: { page: number; pageSize: number; unreadOnly?: boolean },
  ) {
    const where: Prisma.NotificationWhereInput = {
      recipientUserId: userId,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [rows, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: VIEW_SELECT,
        orderBy: { timestamp: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginated(
      rows.map((row) => this.toView(row)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** GET /notifications/unread-count — badge number for the app header. */
  async unreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { recipientUserId: userId, isRead: false },
    });
    return { unreadCount };
  }

  /** POST /notifications/:id/read — ownership enforced (404 for other users). */
  async markRead(userId: string, notificationId: string): Promise<{ isRead: boolean }> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientUserId: userId },
      data: { isRead: true },
    });
    if (result.count === 0) {
      throw ApiError.notFound(
        'NOTIFICATION_NOT_FOUND',
        'Notification not found or does not belong to this user',
      );
    }
    return { isRead: true };
  }

  /** POST /notifications/read-all — marks every unread notification as read. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientUserId: userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  private toView(row: Prisma.NotificationGetPayload<{ select: typeof VIEW_SELECT }>): NotificationView {
    return {
      id: row.id,
      type: row.type,
      titleEn: row.titleEn,
      titleAr: row.titleAr,
      bodyEn: row.bodyEn,
      bodyAr: row.bodyAr,
      isRead: row.isRead,
      orderId: row.orderId,
      timestamp: row.timestamp.toISOString(),
    };
  }
}
