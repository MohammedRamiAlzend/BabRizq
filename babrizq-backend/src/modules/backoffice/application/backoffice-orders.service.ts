/**
 * Back-office orders service — platform-wide order management.
 *
 * - List/detail return `FullOrder` (with store addresses, driver names,
 *   proof-of-delivery flag, and — on detail — per-item stock warnings).
 * - `assignDriver` moves a pending/processing order to `assigned`, marks the
 *   driver busy, records the active order, and writes a `driver_update`
 *   notification for the driver.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { FullOrderView, toFullOrderView } from './backoffice.mapper';

const ORDER_INCLUDE = {
  items: true,
  store: { include: { settings: true } },
  driver: true,
} satisfies Prisma.OrderInclude;

/** Statuses from which a driver can be assigned (orders.md). */
const ASSIGNABLE_STATUSES = ['pending', 'processing'];

@Injectable()
export class BackofficeOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** GET /backoffice/orders — paginated, searchable, status-filterable. */
  async listOrders(query: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
  }) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search } },
              { customerNameEn: { contains: query.search } },
              { customerNameAr: { contains: query.search } },
              { store: { nameEn: { contains: query.search } } },
              { store: { nameAr: { contains: query.search } } },
            ],
          }
        : {}),
    };

    const [orders, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return buildPaginated(
      orders.map((order) => toFullOrderView(order)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** GET /backoffice/orders/:id — full detail incl. stock warnings. */
  async getOrder(orderId: string): Promise<FullOrderView> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }
    return toFullOrderView(order, await this.stockWarnings(order));
  }

  /**
   * PUT /backoffice/orders/:id/assign-driver — assign an available driver.
   * Errors: ORDER_NOT_FOUND (404), DRIVER_NOT_FOUND (404),
   * DRIVER_NOT_AVAILABLE (409), INVALID_ORDER_STATUS (422).
   */
  async assignDriver(
    orderId: string,
    driverId: string,
  ): Promise<FullOrderView> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }
    if (!ASSIGNABLE_STATUSES.includes(order.status)) {
      throw new ApiError(
        'INVALID_ORDER_STATUS',
        422,
        'Only pending or processing orders can be assigned to a driver',
      );
    }

    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      include: { driverProfile: true },
    });
    if (!driver || driver.role !== 'delivery') {
      throw ApiError.notFound('DRIVER_NOT_FOUND', 'Driver not found');
    }
    const available = driver.driverProfile?.available ?? driver.isAvailable;
    if (!available) {
      throw ApiError.conflict('DRIVER_NOT_AVAILABLE', 'This driver is not available');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: driverId },
        data: {
          driverProfile: {
            update: { available: false, activeOrderId: order.id },
          },
        },
      });
      // Notify the driver (delivery app) and the customer, atomically.
      await this.notifications.create(
        driverId,
        {
          type: 'driver_update',
          titleEn: 'New delivery assigned',
          titleAr: 'تسليم جديد',
          bodyEn: `Order ${order.orderNumber} has been assigned to you.`,
          bodyAr: `تم تعيين الطلب ${order.orderNumber} إليك.`,
          orderId: order.id,
        },
        tx,
      );
      if (order.customerUserId) {
        await this.notifications.create(
          order.customerUserId,
          {
            type: 'order_status',
            titleEn: 'Driver assigned',
            titleAr: 'تم تعيين السائق',
            bodyEn: `A driver has been assigned to order ${order.orderNumber}.`,
            bodyAr: `تم تعيين سائق للطلب ${order.orderNumber}.`,
            orderId: order.id,
          },
          tx,
        );
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'assigned', assignedDriverId: driverId },
        include: ORDER_INCLUDE,
      });
    });

    return toFullOrderView(updated);
  }

  /** Computes stock warnings for the shipment-detail view (shipments.md). */
  private async stockWarnings(
    order: Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>,
  ): Promise<FullOrderView['stockWarnings']> {
    const productIds = order.items
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);
    if (productIds.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    });
    const stockByProduct = new Map(products.map((p) => [p.id, p.stock]));

    const warnings: NonNullable<FullOrderView['stockWarnings']> = [];
    for (const item of order.items) {
      if (!item.productId) continue;
      const available = stockByProduct.get(item.productId) ?? 0;
      if (available < item.qty) {
        warnings.push({
          itemNameEn: item.nameEn,
          itemNameAr: item.nameAr,
          requestedQty: item.qty,
          availableQty: available,
        });
      }
    }
    return warnings;
  }
}
