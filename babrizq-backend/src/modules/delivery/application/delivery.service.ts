/**
 * Delivery application service — the driver's assigned orders, status
 * advancement, and proof-of-delivery uploads.
 *
 * Every mutation is scoped to the authenticated driver (`assignedDriverId`),
 * and status moves are validated against the canonical forward-only flow
 * (assigned → picked_up → in_transit → delivered). Marking an order
 * delivered frees the driver (available = true, no active order) and fires a
 * `delivery_confirmed` notification to the customer.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { assertForwardTransition } from '../../../shared/common/orders/order-status';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService, UploadedFileData } from '../../storage/storage.types';
import { DeliveryOrderView, toDeliveryOrderView } from './delivery.mapper';

const ORDER_INCLUDE = {
  items: true,
  store: { include: { settings: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * GET /delivery/orders — the driver's orders.
   * `statuses` restricts the list (e.g. active statuses for the Orders page,
   * `delivered` for history, omitted for the overview).
   */
  async listOrders(
    driverId: string,
    statuses?: string[],
  ): Promise<DeliveryOrderView[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        assignedDriverId: driverId,
        ...(statuses && statuses.length > 0 ? { status: { in: statuses } } : {}),
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => toDeliveryOrderView(order));
  }

  /** GET /delivery/orders/:id — a single order assigned to the driver. */
  async getOrder(driverId: string, orderId: string): Promise<DeliveryOrderView> {
    return toDeliveryOrderView(await this.loadOwnOrder(driverId, orderId));
  }

  /**
   * PUT /delivery/orders/:id/status — move the order exactly one step
   * forward. Delivering frees the driver and notifies the customer.
   */
  async updateStatus(
    driverId: string,
    orderId: string,
    nextStatus: string,
  ): Promise<DeliveryOrderView> {
    const order = await this.loadOwnOrder(driverId, orderId);
    assertForwardTransition(order.status, nextStatus);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: ORDER_INCLUDE,
      });

      if (nextStatus === 'delivered') {
        // The driver is free again; let the customer know.
        await tx.user.update({
          where: { id: driverId },
          data: {
            driverProfile: {
              update: { available: true, activeOrderId: null },
            },
          },
        });
        if (order.customerUserId) {
          await tx.notification.create({
            data: {
              recipientUserId: order.customerUserId,
              type: 'delivery_confirmed',
              titleEn: 'Order delivered',
              titleAr: 'تم تسليم الطلب',
              bodyEn: `Order ${order.orderNumber} has been delivered.`,
              bodyAr: `تم تسليم الطلب ${order.orderNumber}.`,
              orderId: order.id,
            },
          });
        }
      }
      return result;
    });

    return toDeliveryOrderView(updated);
  }

  /**
   * PUT /delivery/orders/:id/proof — persist an uploaded proof-of-delivery
   * image against the order and return its public URL.
   */
  async uploadProof(
    driverId: string,
    orderId: string,
    file: UploadedFileData,
  ): Promise<{ proofUrl: string }> {
    await this.loadOwnOrder(driverId, orderId);

    const stored = await this.storage.save(file, 'proof-of-delivery');
    await this.prisma.order.update({
      where: { id: orderId },
      data: { proofOfDeliveryUrl: stored.url },
    });
    return { proofUrl: stored.url };
  }

  /** Loads an order only if it is assigned to this driver (ORDER_NOT_FOUND otherwise). */
  private async loadOwnOrder(driverId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, assignedDriverId: driverId },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw ApiError.notFound(
        'ORDER_NOT_FOUND',
        'Order not found or not assigned to this driver',
      );
    }
    return order;
  }
}
