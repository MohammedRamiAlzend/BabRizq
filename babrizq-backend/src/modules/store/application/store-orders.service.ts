/**
 * Store-orders application service — the store owner's order list and status
 * advancement.
 *
 * Status transitions are strict one-step-forward on the canonical 6-step
 * flow (see `shared/common/orders/order-status.ts`), so the store-owner and
 * back-office views always agree on an order's lifecycle.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { assertForwardTransition, isOrderStatus } from '../../../shared/common/orders/order-status';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreOrderView, toStoreOrderView } from './store.mapper';
import { resolveOwnedStore } from './store-context';

@Injectable()
export class StoreOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/orders — paginated order list (search + status filter). */
  async listOrders(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; search?: string; status?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const where: Prisma.OrderWhereInput = {
      storeId: store.id,
      ...(query.status && isOrderStatus(query.status) ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search } },
              { customerNameEn: { contains: query.search } },
              { customerNameAr: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [orders, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return buildPaginated(
      orders.map((order) => toStoreOrderView(order)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /**
   * PUT /store/orders/:id/status — advance exactly one step.
   * Errors: INVALID_STATUS_TRANSITION (422), ORDER_ALREADY_DELIVERED (409).
   */
  async advanceOrderStatus(
    ownerUserId: string,
    storeId: string | undefined,
    orderId: string,
    nextStatus: string,
  ): Promise<StoreOrderView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: store.id },
      include: { items: true },
    });
    if (!order) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found in this store');
    }

    assertForwardTransition(order.status, nextStatus);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: { items: true },
    });
    return toStoreOrderView(updated);
  }
}
