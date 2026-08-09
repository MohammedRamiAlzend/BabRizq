/**
 * Unit tests for StoreOrdersService — ownership enforcement and the
 * forward-only status transition rules.
 */
import { StoreOrdersService } from './store-orders.service';
import { PrismaService } from '../../prisma/prisma.service';

const prisma = {
  store: { findUnique: jest.fn() },
  order: {
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaService;

const service = new StoreOrdersService(prisma);

const ownedStore = { id: 'store-techzone', ownerUserId: 'owner-1' };

const orderRow = (status: string) => ({
  id: 'order-1',
  orderNumber: '#BRQ-1042',
  createdAt: new Date('2026-08-09T10:00:00Z'),
  customerNameEn: 'Sara',
  customerNameAr: 'سارة',
  addressEn: 'Riyadh',
  total: 732,
  currency: 'SAR',
  status,
  items: [{ nameEn: 'Headphones', nameAr: 'سماعات', qty: 2, price: 299 }],
});

beforeEach(() => jest.clearAllMocks());

describe('StoreOrdersService.advanceOrderStatus', () => {
  it('advances an order one canonical step and returns the updated view', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(orderRow('pending'));
    (prisma.order.update as jest.Mock).mockResolvedValue(orderRow('processing'));

    const view = await service.advanceOrderStatus('owner-1', 'store-techzone', 'order-1', 'processing');

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'processing' },
      include: { items: true },
    });
    expect(view.status).toBe('processing');
  });

  it('rejects a skipped step (pending → delivered)', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(orderRow('pending'));

    await expect(
      service.advanceOrderStatus('owner-1', 'store-techzone', 'order-1', 'delivered'),
    ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('rejects advancing a delivered order', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(orderRow('delivered'));

    await expect(
      service.advanceOrderStatus('owner-1', 'store-techzone', 'order-1', 'processing'),
    ).rejects.toMatchObject({ code: 'ORDER_ALREADY_DELIVERED' });
  });

  it('hides other stores orders as ORDER_NOT_FOUND', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.advanceOrderStatus('owner-1', 'store-techzone', 'order-1', 'processing'),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
  });

  it('rejects a store the user does not own', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'someone-else',
    });

    await expect(
      service.advanceOrderStatus('owner-1', 'store-techzone', 'order-1', 'processing'),
    ).rejects.toMatchObject({ code: 'STORE_NOT_OWNED' });
  });
});
