/**
 * Unit tests for OrdersService — checkout money math, stock guards,
 * transaction rollback, cart clearing, and order ownership.
 */
import { OrdersService } from './orders.service';
import { OrderNumberService } from './order-number.service';
import { PrismaService } from '../../prisma/prisma.service';

/** Cart: 2 × headphones @ 299, store with taxRate 15 / deliveryFee 15. */
const cartFixture = {
  id: 'cart-1',
  customerUserId: 'customer-1',
  updatedAt: new Date(),
  items: [
    {
      cartId: 'cart-1',
      productId: 'prod-headphones',
      quantity: 2,
      product: {
        id: 'prod-headphones',
        storeId: 'store-techzone',
        nameEn: 'Premium Wireless Headphones',
        nameAr: 'سماعات لاسلكية فاخرة',
        price: 299,
        stock: 45,
        store: {
          id: 'store-techzone',
          settings: { taxRate: 15, deliveryFee: 15, estimatedDeliveryDays: 2 },
        },
      },
    },
  ],
};

const createOrderDto = {
  fullName: 'Sara Mansour',
  phone: '+966 50 000 0005',
  deliveryAddress: '45 King Fahd Rd, Riyadh',
  paymentMethod: 'cash',
};

const prisma = {
  cart: { findUnique: jest.fn() },
  product: { updateMany: jest.fn() },
  order: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  cartItem: { deleteMany: jest.fn() },
  $transaction: jest.fn(),
} as unknown as PrismaService;

const orderNumbers = {
  nextOrderNumber: jest.fn().mockResolvedValue('#BRQ-1043'),
} as unknown as OrderNumberService;

const service = new OrdersService(prisma, orderNumbers);

beforeEach(() => jest.clearAllMocks());

describe('OrdersService.createOrder', () => {
  it('places an order with correct money math and clears the cart', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(cartFixture);
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(prisma),
    );
    (prisma.product.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.order.create as jest.Mock).mockResolvedValue({
      id: 'order-1',
      orderNumber: '#BRQ-1043',
      status: 'pending',
      createdAt: new Date('2026-08-09T10:00:00Z'),
      items: [
        { nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة', qty: 2, price: 299 },
      ],
    });

    const order = await service.createOrder('customer-1', createOrderDto);

    expect(order).toMatchObject({
      orderId: 'order-1',
      orderNumber: '#BRQ-1043',
      status: 'pending',
      currency: 'SAR',
      estimatedDeliveryDays: 2,
      total: 702.7, // 598 subtotal + 15 delivery + 89.7 tax (15%)
    });
    expect(order.items).toEqual([
      { nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة', qty: 2, price: 299 },
    ]);

    // Stock decremented exactly once per item, cart cleared.
    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'prod-headphones', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'cart-1' },
    });
  });

  it('rejects an empty cart with CART_EMPTY', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      service.createOrder('customer-1', createOrderDto),
    ).rejects.toMatchObject({ code: 'CART_EMPTY' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects quantities above stock before the transaction', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue({
      ...cartFixture,
      items: [{ ...cartFixture.items[0], quantity: 999 }],
    });
    await expect(
      service.createOrder('customer-1', createOrderDto),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rolls back when a concurrent sale drains the stock', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(cartFixture);
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(prisma),
    );
    (prisma.product.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(
      service.createOrder('customer-1', createOrderDto),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect(prisma.order.create).not.toHaveBeenCalled();
  });
});

describe('OrdersService.getOrder', () => {
  it('returns the detail view for the customer own order', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({
      id: 'order-1',
      orderNumber: '#BRQ-1043',
      status: 'pending',
      createdAt: new Date('2026-08-09T10:00:00Z'),
      customerNameEn: 'Sara Mansour',
      customerPhone: '+966 50 000 0005',
      addressEn: '45 King Fahd Rd, Riyadh',
      subtotal: 598,
      deliveryFee: 15,
      tax: 89.7,
      total: 702.7,
      currency: 'SAR',
      notes: null,
      items: [{ productId: 'prod-headphones', nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة', qty: 2, price: 299 }],
      store: { settings: { estimatedDeliveryDays: 2 } },
    });

    const detail = await service.getOrder('customer-1', 'order-1');

    expect(detail).toMatchObject({
      orderId: 'order-1',
      fullName: 'Sara Mansour',
      date: '2026-08-09',
      estimatedDeliveryDays: 2,
      total: 702.7,
    });
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1', customerUserId: 'customer-1' } }),
    );
  });

  it('hides other customers orders with ORDER_NOT_FOUND', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.getOrder('customer-1', 'order-1')).rejects.toMatchObject(
      { code: 'ORDER_NOT_FOUND' },
    );
  });
});

describe('OrdersService.listOrders', () => {
  it('returns paginated history with item counts', async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'order-1',
        orderNumber: '#BRQ-1043',
        status: 'pending',
        createdAt: new Date('2026-08-09T10:00:00Z'),
        total: 702.7,
        currency: 'SAR',
        items: [{ qty: 2 }, { qty: 1 }],
      },
    ]);
    (prisma.order.count as jest.Mock).mockResolvedValue(1);

    const page = await service.listOrders('customer-1', { page: 1, pageSize: 10 });

    expect(page).toMatchObject({
      items: [{ orderId: 'order-1', itemCount: 3, date: '2026-08-09' }],
      totalItems: 1,
      totalPages: 1,
    });
  });
});
