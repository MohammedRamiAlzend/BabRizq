/**
 * Unit tests for DeliveryService — driver-scoped lists, forward-only status
 * moves with delivery side effects, and proof uploads.
 */
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.types';

const orderRow = (status: string, overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  orderNumber: '#BRQ-1040',
  createdAt: new Date('2026-08-09T10:00:00Z'),
  customerUserId: 'customer-1',
  customerNameEn: 'Omar',
  customerNameAr: 'عمر',
  addressEn: 'Riyadh',
  addressAr: 'الرياض',
  customerPhone: '+966 50 333 4444',
  total: 913,
  status,
  assignedDriverId: 'driver-1',
  proofOfDeliveryUrl: null,
  items: [{ productId: 'prod-1', nameEn: 'Headphones', nameAr: 'سماعات', qty: 1, price: 299 }],
  store: {
    nameEn: 'TechZone',
    nameAr: 'تك زون',
    settings: { addressEn: 'Riyadh', addressAr: 'الرياض' },
  },
  ...overrides,
});

const prisma = {
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: { update: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
} as unknown as PrismaService;

const storage = {
  driver: 'local',
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as StorageService;

const service = new DeliveryService(prisma, storage);

beforeEach(() => jest.clearAllMocks());

describe('DeliveryService.listOrders', () => {
  it('scopes to the driver and applies the status filter', async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValue([
      orderRow('in_transit'),
    ]);

    await service.listOrders('driver-1', ['assigned', 'picked_up', 'in_transit']);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignedDriverId: 'driver-1', status: { in: ['assigned', 'picked_up', 'in_transit'] } },
      }),
    );
  });

  it('returns everything when no status filter is given', async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
    await service.listOrders('driver-1');
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assignedDriverId: 'driver-1' } }),
    );
  });
});

describe('DeliveryService.updateStatus', () => {
  it('advances forward (in_transit → delivered), frees the driver, and notifies the customer', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(
      orderRow('in_transit', { customerUserId: 'customer-1' }),
    );
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
    (prisma.order.update as jest.Mock).mockResolvedValue(orderRow('delivered'));

    const view = await service.updateStatus('driver-1', 'order-1', 'delivered');

    expect(view.status).toBe('delivered');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          driverProfile: {
            update: { available: true, activeOrderId: null },
          },
        }),
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: 'customer-1',
          type: 'delivery_confirmed',
          orderId: 'order-1',
        }),
      }),
    );
  });

  it('rejects skipped steps (assigned → delivered)', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(orderRow('assigned'));

    await expect(
      service.updateStatus('driver-1', 'order-1', 'delivered'),
    ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('rejects orders not assigned to this driver', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateStatus('driver-1', 'order-9', 'picked_up'),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
  });
});

describe('DeliveryService.uploadProof', () => {
  it('stores the file and persists the URL on the order', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(orderRow('in_transit'));
    (storage.save as jest.Mock).mockResolvedValue({
      key: 'proof-of-delivery/uuid.jpg',
      url: '/uploads/proof-of-delivery/uuid.jpg',
    });
    (prisma.order.update as jest.Mock).mockResolvedValue(orderRow('delivered'));

    const result = await service.uploadProof('driver-1', 'order-1', {
      originalname: 'proof.jpg',
      mimetype: 'image/jpeg',
      size: 100,
      buffer: Buffer.from('img'),
    });

    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'proof.jpg' }),
      'proof-of-delivery',
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { proofOfDeliveryUrl: '/uploads/proof-of-delivery/uuid.jpg' },
    });
    expect(result).toEqual({ proofUrl: '/uploads/proof-of-delivery/uuid.jpg' });
  });

  it('rejects proof uploads for orders not assigned to the driver', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(
      service.uploadProof('driver-1', 'order-9', {
        originalname: 'p.jpg',
        mimetype: 'image/jpeg',
        size: 1,
        buffer: Buffer.from('x'),
      }),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
    expect(storage.save).not.toHaveBeenCalled();
  });
});
