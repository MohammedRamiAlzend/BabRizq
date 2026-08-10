/**
 * Unit tests for PurchaseOrdersService — create validation, receive quantity
 * guards (never more than ordered), cancel state rules, and PO numbering.
 */
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerPostingService } from '../../accounting/application/ledger-posting.service';
import { PurchaseOrdersService } from './purchase-orders.service';

const prisma = {
  store: { findUnique: jest.fn() },
  supplier: { findUnique: jest.fn() },
  product: {
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  purchaseOrder: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  purchaseOrderItem: { update: jest.fn() },
  inventoryBatch: { create: jest.fn() },
  stockMovement: { create: jest.fn() },
  journalEntry: { count: jest.fn() },
  $transaction: jest.fn(),
} as unknown as PrismaService;

const ledger = {
  postSourceEntry: jest.fn().mockResolvedValue(undefined),
} as unknown as LedgerPostingService;

const service = new PurchaseOrdersService(prisma, ledger);

beforeEach(() => jest.resetAllMocks());

describe('PurchaseOrdersService.createPurchaseOrder', () => {
  it('rejects an empty item list', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    await expect(
      service.createPurchaseOrder('owner-1', 'store-techzone', {
        supplierId: 'sup-1',
        items: [],
      }),
    ).rejects.toMatchObject({ code: 'PO_ITEMS_REQUIRED' });
  });

  it('rejects a supplier that is not in this store', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({
      id: 'sup-other',
      storeId: 'store-other',
    });
    await expect(
      service.createPurchaseOrder('owner-1', 'store-techzone', {
        supplierId: 'sup-other',
        items: [{ productId: 'p1', quantity: 5, unitCost: 10 }],
      }),
    ).rejects.toMatchObject({ code: 'SUPPLIER_NOT_FOUND' });
  });

  it('rejects a line referencing another store product', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({
      id: 'sup-1',
      storeId: 'store-techzone',
    });
    (prisma.product.count as jest.Mock).mockResolvedValue(1); // 2 requested, 1 owned
    await expect(
      service.createPurchaseOrder('owner-1', 'store-techzone', {
        supplierId: 'sup-1',
        items: [
          { productId: 'p1', quantity: 5, unitCost: 10 },
          { productId: 'p2', quantity: 3, unitCost: 8 },
        ],
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_IN_STORE' });
  });

  it('creates the PO with a sequential number and total snapshot', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({
      id: 'sup-1',
      storeId: 'store-techzone',
    });
    (prisma.product.count as jest.Mock).mockResolvedValue(2);
    (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue({
      poNumber: 'PO-2026-0003',
    });
    (prisma.purchaseOrder.create as jest.Mock).mockImplementation((args) =>
      Promise.resolve({
        id: 'po-1',
        poNumber: 'PO-2026-0004',
        status: 'ordered',
        expectedAt: null,
        orderedAt: new Date(),
        receivedAt: null,
        notes: null,
        totalAmount: 5 * 10 + 3 * 8,
        createdAt: new Date(),
        supplier: { id: 'sup-1', nameEn: 'S', nameAr: 'م' },
        items: [
          { productId: 'p1', quantity: 5, receivedQuantity: 0, unitCost: 10, product: { id: 'p1', nameEn: 'P1', nameAr: 'ص1', sku: null } },
          { productId: 'p2', quantity: 3, receivedQuantity: 0, unitCost: 8, product: { id: 'p2', nameEn: 'P2', nameAr: 'ص2', sku: null } },
        ],
      }),
    );

    const result = await service.createPurchaseOrder('owner-1', 'store-techzone', {
      supplierId: 'sup-1',
      items: [
        { productId: 'p1', quantity: 5, unitCost: 10 },
        { productId: 'p2', quantity: 3, unitCost: 8 },
      ],
    });
    expect(result.poNumber).toBe('PO-2026-0004');
    expect(result.totalAmount).toBe(74);
    expect(prisma.purchaseOrder.create).toHaveBeenCalledTimes(1);
  });
});

describe('PurchaseOrdersService.receivePurchaseOrder', () => {
  const poFixture = {
    id: 'po-1',
    poNumber: 'PO-2026-0001',
    status: 'ordered',
    storeId: 'store-techzone',
    supplierId: 'sup-1',
    items: [
      { id: 'line-1', productId: 'prod-a', quantity: 20, receivedQuantity: 0, unitCost: 100, product: { id: 'prod-a', nameEn: 'Product A', nameAr: 'أ', sku: 'A' } },
    ],
  };

  it('rejects receiving more than the remaining quantity', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(poFixture);
    await expect(
      service.receivePurchaseOrder('owner-1', 'store-techzone', 'po-1', {
        items: [{ productId: 'prod-a', quantity: 25 }],
      }),
    ).rejects.toMatchObject({ code: 'PO_RECEIVE_EXCEEDS' });
  });

  it('rejects receiving on an already-received order', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
      ...poFixture,
      status: 'received',
    });
    await expect(
      service.receivePurchaseOrder('owner-1', 'store-techzone', 'po-1', {
        items: [{ productId: 'prod-a', quantity: 5 }],
      }),
    ).rejects.toMatchObject({ code: 'PO_NOT_RECEIVABLE' });
  });

  it('rejects an empty receive', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(poFixture);
    await expect(
      service.receivePurchaseOrder('owner-1', 'store-techzone', 'po-1', {
        items: [{ productId: 'prod-a', quantity: 0 }],
      }),
    ).rejects.toMatchObject({ code: 'PO_RECEIVE_EMPTY' });
  });

  it('receives, posts the inventory ledger entry, and marks the PO received', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    const receivedPo = {
      id: 'po-1',
      poNumber: 'PO-2026-0001',
      status: 'received',
      storeId: 'store-techzone',
      supplierId: 'sup-1',
      expectedAt: null,
      orderedAt: new Date(),
      receivedAt: new Date(),
      notes: null,
      totalAmount: 2000,
      createdAt: new Date(),
      supplier: { id: 'sup-1', nameEn: 'Supplier A', nameAr: 'مورد' },
      items: [
        { productId: 'prod-a', quantity: 20, receivedQuantity: 20, unitCost: 100, product: { id: 'prod-a', nameEn: 'Product A', nameAr: 'أ', sku: 'A' } },
      ],
    };
    (prisma.journalEntry.count as jest.Mock).mockResolvedValue(0);
    (prisma.purchaseOrder.findUnique as jest.Mock)
      .mockResolvedValueOnce(poFixture) // first call inside receive
      .mockResolvedValueOnce(receivedPo); // getPurchaseOrder re-read
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
    (prisma.purchaseOrderItem.update as jest.Mock).mockResolvedValue(undefined);
    (prisma.product.update as jest.Mock).mockResolvedValue(undefined);
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-a',
      cost: 100,
      stock: 40,
    });
    (prisma.inventoryBatch.create as jest.Mock).mockResolvedValue(undefined);
    (prisma.stockMovement.create as jest.Mock).mockResolvedValue(undefined);

    const result = await service.receivePurchaseOrder('owner-1', 'store-techzone', 'po-1', {
      items: [{ productId: 'prod-a', quantity: 20 }],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(ledger.postSourceEntry).toHaveBeenCalledWith(
      'store-techzone',
      'purchase_receipt',
      'po-1:R1',
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({ debit: 2000, credit: 0 }),
          expect.objectContaining({ credit: 2000, debit: 0 }),
        ]),
      }),
      prisma,
    );
    expect(result.status).toBe('received');
  });
});

describe('PurchaseOrdersService.cancelPurchaseOrder', () => {
  it('cancels an ordered PO', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
      id: 'po-1',
      storeId: 'store-techzone',
      status: 'ordered',
    });
    (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({
      id: 'po-1',
      poNumber: 'PO-2026-0001',
      status: 'cancelled',
      expectedAt: null,
      orderedAt: new Date(),
      receivedAt: null,
      notes: null,
      totalAmount: 0,
      createdAt: new Date(),
      supplier: { id: 'sup-1', nameEn: 'S', nameAr: 'م' },
      items: [],
    });
    const result = await service.cancelPurchaseOrder('owner-1', 'store-techzone', 'po-1');
    expect(result.status).toBe('cancelled');
  });

  it('rejects cancelling a received PO', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store-techzone',
      ownerUserId: 'owner-1',
    });
    (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
      id: 'po-1',
      storeId: 'store-techzone',
      status: 'received',
    });
    await expect(
      service.cancelPurchaseOrder('owner-1', 'store-techzone', 'po-1'),
    ).rejects.toMatchObject({ code: 'PO_NOT_CANCELLABLE' });
  });
});

