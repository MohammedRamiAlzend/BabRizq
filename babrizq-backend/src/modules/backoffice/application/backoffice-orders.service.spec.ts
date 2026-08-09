/**
 * Unit tests for BackofficeOrdersService — driver assignment rules,
 * side effects (driver busy + notification), and error paths.
 */
import { BackofficeOrdersService } from './backoffice-orders.service';
import { PrismaService } from '../../prisma/prisma.service';

const prisma = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  user: { findUnique: jest.fn(), update: jest.fn() },
  product: { findMany: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
} as unknown as PrismaService;

const service = new BackofficeOrdersService(prisma);

const orderRow = (status: string) => ({
  id: 'order-1',
  orderNumber: '#BRQ-1042',
  createdAt: new Date('2026-08-09T10:00:00Z'),
  customerNameEn: 'Sara',
  customerNameAr: 'سارة',
  addressEn: 'Riyadh',
  addressAr: 'الرياض',
  customerPhone: '+966 50 000 0005',
  total: 732,
  currency: 'SAR',
  status,
  assignedDriverId: null,
  proofOfDeliveryUrl: null,
  items: [{ productId: 'prod-1', nameEn: 'Headphones', nameAr: 'سماعات', qty: 2, price: 299 }],
  store: { nameEn: 'TechZone', nameAr: 'تك زون', settings: { addressEn: 'Riyadh', addressAr: 'الرياض' } },
  driver: null,
});

const driverRow = (available: boolean, overrides: Record<string, unknown> = {}) => ({
  id: 'driver-1',
  role: 'delivery',
  nameEn: 'Yusuf',
  nameAr: 'يوسف',
  phone: '+966 55 123 4567',
  isAvailable: available,
  driverProfile: { phone: null, available, activeOrderId: null },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('BackofficeOrdersService.assignDriver', () => {
  it('assigns an available driver, marks them busy, notifies, and advances the order', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderRow('pending'));
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(driverRow(true));
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
    (prisma.user.update as jest.Mock).mockResolvedValue(driverRow(false));
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
    (prisma.order.update as jest.Mock).mockResolvedValue(
      orderRow('assigned'),
    );

    const view = await service.assignDriver('order-1', 'driver-1');

    expect(view.status).toBe('assigned');
    // Driver side effects inside the transaction.
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          driverProfile: {
            update: { available: false, activeOrderId: 'order-1' },
          },
        }),
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: 'driver-1',
          type: 'driver_update',
          orderId: 'order-1',
        }),
      }),
    );
  });

  it('rejects assigning to an unavailable driver (DRIVER_NOT_AVAILABLE)', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderRow('pending'));
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(driverRow(false));

    await expect(service.assignDriver('order-1', 'driver-1')).rejects.toMatchObject(
      { code: 'DRIVER_NOT_AVAILABLE' },
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects non-driver users (DRIVER_NOT_FOUND)', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderRow('pending'));
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u9',
      role: 'customer',
      driverProfile: null,
    });

    await expect(service.assignDriver('order-1', 'u9')).rejects.toMatchObject({
      code: 'DRIVER_NOT_FOUND',
    });
  });

  it('rejects orders that are not pending/processing (INVALID_ORDER_STATUS, 422)', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderRow('in_transit'));

    await expect(service.assignDriver('order-1', 'driver-1')).rejects.toMatchObject(
      { code: 'INVALID_ORDER_STATUS' },
    );
  });

  it('rejects missing orders (ORDER_NOT_FOUND)', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.assignDriver('order-1', 'driver-1')).rejects.toMatchObject(
      { code: 'ORDER_NOT_FOUND' },
    );
  });
});
