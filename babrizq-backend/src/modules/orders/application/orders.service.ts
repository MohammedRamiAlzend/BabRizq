/**
 * Orders application service — checkout + order history for the customer app.
 *
 * Checkout is one interactive Prisma transaction: validate stock → snapshot
 * item prices → decrement stock atomically → create the order → clear the
 * cart. If anything fails (including a concurrent oversell) the whole
 * transaction rolls back.
 *
 * Note: the order model is single-store, so a cart spanning multiple stores
 * is rejected with `CART_MULTI_STORE` (the storefront demo carts one store).
 */
import { Injectable } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderNumberService } from './order-number.service';
import { CreateOrderDto } from '../presentation/dto/orders.dto';

/** Rounding helper for money (SAR): two decimals. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface OrderCreatedView {
  orderId: string;
  orderNumber: string;
  status: 'pending';
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  currency: string;
  estimatedDeliveryDays: number;
  createdAt: string;
}

export interface OrderListItemView {
  orderId: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
}

export interface OrderDetailView {
  orderId: string;
  orderNumber: string;
  date: string;
  status: string;
  fullName: string;
  phone: string;
  deliveryAddress: string;
  items: { productId: string | null; nameEn: string; nameAr: string; qty: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  currency: string;
  estimatedDeliveryDays: number;
  notes?: string;
  createdAt: string;
}

/** Cart row with the product relations checkout needs. */
const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: { store: { include: { settings: true } } },
      },
    },
  },
} satisfies Prisma.CartInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderNumbers: OrderNumberService,
  ) {}

  /** POST /customer/orders — place an order from the current cart. */
  async createOrder(
    customerUserId: string,
    dto: CreateOrderDto,
  ): Promise<OrderCreatedView> {
    const cart = await this.prisma.cart.findUnique({
      where: { customerUserId },
      include: CART_INCLUDE,
    });
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('CART_EMPTY', 'Your cart is empty');
    }

    // ---- Validate products, stock and store homogeneity ----
    const storeId = cart.items[0].product.storeId;
    for (const item of cart.items) {
      if (!item.product) {
        throw ApiError.notFound('PRODUCT_NOT_FOUND', 'A product in your cart no longer exists');
      }
      if (item.product.storeId !== storeId) {
        throw ApiError.badRequest(
          'CART_MULTI_STORE',
          'Checkout supports one store at a time',
        );
      }
      if (item.quantity > item.product.stock) {
        throw ApiError.conflict(
          'INSUFFICIENT_STOCK',
          `Only ${item.product.stock} units of "${item.product.nameEn}" are available`,
        );
      }
    }

    const store = cart.items[0].product.store;
    const settings = store.settings;

    const subtotal = round2(
      cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    );
    const deliveryFee = settings?.deliveryFee ?? 0;
    const tax = round2(subtotal * ((settings?.taxRate ?? 0) / 100));
    const total = round2(subtotal + deliveryFee + tax);
    const orderNumber = await this.orderNumbers.nextOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      // Atomically decrement stock — a 0-row update means stock dropped below
      // the requested quantity (concurrent sale), so fail and roll back.
      for (const item of cart.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw ApiError.conflict(
            'INSUFFICIENT_STOCK',
            `Only ${item.product.stock} units of "${item.product.nameEn}" are available`,
          );
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerUserId,
          storeId,
          status: 'pending',
          customerNameEn: dto.fullName,
          customerNameAr: dto.fullName,
          customerPhone: dto.phone,
          addressEn: dto.deliveryAddress,
          addressAr: dto.deliveryAddress,
          paymentMethod: dto.paymentMethod ?? 'cash',
          notes: dto.notes ?? null,
          subtotal,
          deliveryFee,
          tax,
          total,
          currency: 'SAR',
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              nameEn: item.product.nameEn,
              nameAr: item.product.nameAr,
              qty: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'pending',
      items: order.items.map((item) => ({
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        qty: item.qty,
        price: item.price,
      })),
      total,
      currency: 'SAR',
      estimatedDeliveryDays: settings?.estimatedDeliveryDays ?? 2,
      createdAt: order.createdAt.toISOString(),
    };
  }

  /** GET /customer/orders — paginated order history. */
  async listOrders(
    customerUserId: string,
    query: { page: number; pageSize: number; status?: string },
  ) {
    const where: Prisma.OrderWhereInput = {
      customerUserId,
      ...(query.status ? { status: query.status } : {}),
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

    const items: OrderListItemView[] = orders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString().slice(0, 10),
      status: order.status,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
    }));

    return buildPaginated(items, totalItems, query.page, query.pageSize);
  }

  /** GET /customer/orders/:orderId — full order detail (ownership enforced). */
  async getOrder(customerUserId: string, orderId: string): Promise<OrderDetailView> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerUserId },
      include: { items: true, store: { include: { settings: true } } },
    });
    if (!order) {
      throw ApiError.notFound(
        'ORDER_NOT_FOUND',
        'Order not found or does not belong to this customer',
      );
    }

    return this.toDetailView(order);
  }

  /** Maps an order row (with items + store settings) to the contract view. */
  private toDetailView(
    order: Order & {
      items: { productId: string | null; nameEn: string; nameAr: string; qty: number; price: number }[];
      store: { settings: { estimatedDeliveryDays: number } | null };
    },
  ): OrderDetailView {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString().slice(0, 10),
      status: order.status,
      fullName: order.customerNameEn,
      phone: order.customerPhone,
      deliveryAddress: order.addressEn,
      items: order.items.map((item) => ({
        productId: item.productId,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        qty: item.qty,
        price: item.price,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      estimatedDeliveryDays: order.store.settings?.estimatedDeliveryDays ?? 2,
      notes: order.notes ?? undefined,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
