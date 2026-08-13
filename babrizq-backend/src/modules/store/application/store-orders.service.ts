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
import { NotificationsService } from '../../notifications/application/notifications.service';
import { StorageService } from '../../storage/storage.types';
import { StoreOrderView, toStoreOrderView } from './store.mapper';
import { resolveOwnedStore } from './store-context';

@Injectable()
export class StoreOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

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

    // Keep the customer in the loop when the store moves the order forward.
    if (updated.customerUserId) {
      await this.notifications.create(updated.customerUserId, {
        type: 'order_status',
        titleEn: 'Order status updated',
        titleAr: 'تحديث حالة الطلب',
        bodyEn: `Order ${updated.orderNumber} is now ${nextStatus.replace('_', ' ')}.`,
        bodyAr: `أصبحت حالة الطلب ${updated.orderNumber}: ${nextStatus.replace('_', ' ')}.`,
        orderId: updated.id,
      });
    }
    return toStoreOrderView(updated);
  }

  /**
   * GET /store/orders/:id/receipt — generates a printable HTML receipt
   * (order number, date, customer, line items + totals) via the storage
   * abstraction and returns its URL (orders.md).
   */
  async getReceipt(
    ownerUserId: string,
    storeId: string | undefined,
    orderId: string,
  ): Promise<{ receiptUrl: string }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: store.id },
      include: { items: true, store: { select: { nameEn: true } } },
    });
    if (!order) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found in this store');
    }

    const html = this.buildReceiptHtml(order);
    const stored = await this.storage.save(
      {
        originalname: `receipt-${order.orderNumber}.html`,
        mimetype: 'text/html',
        size: Buffer.byteLength(html),
        buffer: Buffer.from(html, 'utf8'),
      },
      'receipts',
    );
    return { receiptUrl: stored.url };
  }

  /** Printable HTML receipt — print-to-PDF friendly layout. */
  private buildReceiptHtml(order: {
    orderNumber: string;
    orderDate: Date;
    customerNameEn: string;
    customerNameAr: string;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    tax: number;
    total: number;
    currency: string;
    store: { nameEn: string } | null;
    items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  }): string {
    const money = (value: number) => `${value.toFixed(2)} ${order.currency}`;
    const rows = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.nameEn}<br/><span class="ar">${item.nameAr}</span></td>
          <td class="num">${item.qty}</td>
          <td class="num">${money(item.price)}</td>
          <td class="num">${money(item.price * item.qty)}</td>
        </tr>`,
      )
      .join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Receipt ${order.orderNumber}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 640px; margin: 24px auto; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #666; }
  .ar { direction: rtl; display: inline-block; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
  .num { text-align: right; }
  .totals { margin-top: 16px; width: 100%; }
  .totals td { border: none; padding: 4px 8px; }
  .totals .grand { font-weight: bold; font-size: 16px; }
</style>
</head>
<body>
  <h1>${order.store?.nameEn ?? 'Bab Rizq'}</h1>
  <p class="muted">Receipt ${order.orderNumber}</p>
  <p class="muted">Date: ${order.orderDate.toISOString()}</p>
  <p class="muted">Customer: ${order.customerNameEn} (${order.customerNameAr})</p>
  <table>
    <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td class="num">${money(order.subtotal)}</td></tr>
    <tr><td>Discount</td><td class="num">-${money(order.discount)}</td></tr>
    <tr><td>Delivery</td><td class="num">${money(order.deliveryFee)}</td></tr>
    <tr><td>Tax</td><td class="num">${money(order.tax)}</td></tr>
    <tr class="grand"><td>Total</td><td class="num">${money(order.total)}</td></tr>
  </table>
</body>
</html>`;
  }
}
