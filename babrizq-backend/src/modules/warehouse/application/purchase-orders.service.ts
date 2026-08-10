/**
 * Purchase-orders application service — the warehouse's inbound rail
 * (per `plans/03` §3): create PO → receive → auto `StockMovement.in` →
 * FIFO cost layer → inventory asset on the ledger.
 *
 * A receive is one atomic transaction: it validates the ordered quantities
 * (never receive more than ordered), bumps `product.stock`, records the
 * `StockMovement`, creates the FIFO layer, and posts DR Inventory /
 * CR Supplier Payable to the ledger — keyed on a per-receive id so a
 * retried request can never double-post.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerPostingService } from '../../accounting/application/ledger-posting.service';
import { ACCOUNT_CODES, round2 } from '../../accounting/application/account-codes';
import { resolveOwnedStore } from '../../store/application/store-context';

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface ReceiveItemInput {
  productId: string;
  quantity: number;
}

const PO_ITEM_SELECT = {
  id: true,
  productId: true,
  quantity: true,
  receivedQuantity: true,
  unitCost: true,
  product: { select: { id: true, nameEn: true, nameAr: true, sku: true } },
} satisfies Prisma.PurchaseOrderItemSelect;

const PO_INCLUDE = {
  supplier: { select: { id: true, nameEn: true, nameAr: true } },
  items: { select: PO_ITEM_SELECT },
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerPostingService,
  ) {}

  /** POST /store/purchase-orders — create a PO against a supplier. */
  async createPurchaseOrder(
    ownerUserId: string,
    storeId: string | undefined,
    input: {
      supplierId: string;
      expectedAt?: string | null;
      notes?: string | null;
      items: PurchaseOrderItemInput[];
    },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    if (!input.items || input.items.length === 0) {
      throw ApiError.badRequest('PO_ITEMS_REQUIRED', 'A purchase order needs at least one item');
    }

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: input.supplierId },
      select: { id: true, storeId: true },
    });
    if (!supplier || supplier.storeId !== store.id) {
      throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Supplier not found in this store');
    }

    // Every line must be a product of this store.
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const ownedProducts = await this.prisma.product.count({
      where: { id: { in: productIds }, storeId: store.id },
    });
    if (ownedProducts !== productIds.length) {
      throw ApiError.badRequest('PRODUCT_NOT_IN_STORE', 'All PO lines must reference this store products');
    }
    for (const item of input.items) {
      if (item.quantity <= 0 || item.unitCost < 0) {
        throw ApiError.badRequest('PO_INVALID_LINE', 'Quantity must be > 0 and unit cost ≥ 0');
      }
    }

    const poNumber = await this.nextPoNumber(store.id);
    const totalAmount = round2(
      input.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
    );

    const created = await this.prisma.purchaseOrder.create({
      data: {
        storeId: store.id,
        poNumber,
        supplierId: supplier.id,
        status: 'ordered',
        orderedAt: new Date(),
        expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
        notes: input.notes ?? null,
        totalAmount,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: PO_INCLUDE,
    });

    return this.toView(created);
  }

  /** GET /store/purchase-orders — paginated list (status filter). */
  async listPurchaseOrders(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; status?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const where: Prisma.PurchaseOrderWhereInput = {
      storeId: store.id,
      ...(query.status ? { status: query.status } : {}),
    };
    const [orders, totalItems] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: PO_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return buildPaginated(
      orders.map((po) => this.toView(po)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** GET /store/purchase-orders/:id — full detail with lines. */
  async getPurchaseOrder(
    ownerUserId: string,
    storeId: string | undefined,
    purchaseOrderId: string,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: PO_INCLUDE,
    });
    if (!po || po.storeId !== store.id) {
      throw ApiError.notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found in this store');
    }
    return this.toView(po);
  }

  /**
   * POST /store/purchase-orders/:id/receive — record incoming goods.
   *
   * For each requested line: validates against the remaining quantity,
   * bumps stock, writes a `StockMovement` (type `in`), creates the FIFO
   * layer, and posts the inventory purchase to the ledger. Partial
   * receives are supported (`status` → `partial` until fully received).
   */
  async receivePurchaseOrder(
    ownerUserId: string,
    storeId: string | undefined,
    purchaseOrderId: string,
    input: { items: ReceiveItemInput[] },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: PO_INCLUDE,
    });
    if (!po || po.storeId !== store.id) {
      throw ApiError.notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found in this store');
    }
    if (po.status === 'received' || po.status === 'cancelled') {
      throw ApiError.conflict(
        'PO_NOT_RECEIVABLE',
        `Purchase order is ${po.status} and cannot be received`,
      );
    }

    // Build a receive map keyed by productId; validate requested quantities.
    const request = new Map(input.items.map((i) => [i.productId, i.quantity]));
    const lines = po.items.map((item) => {
      const wanted = request.get(item.productId) ?? 0;
      if (wanted < 0) {
        throw ApiError.badRequest('PO_RECEIVE_NEGATIVE', 'Received quantity cannot be negative');
      }
      const remaining = item.quantity - item.receivedQuantity;
      if (wanted > remaining) {
        throw ApiError.badRequest(
          'PO_RECEIVE_EXCEEDS',
          `Receiving ${wanted} of "${item.product.nameEn}" exceeds the remaining ${remaining} on order`,
        );
      }
      return { item, wanted, remaining };
    });
    if (lines.every((l) => l.wanted === 0)) {
      throw ApiError.badRequest('PO_RECEIVE_EMPTY', 'Nothing to receive on this purchase order');
    }

    // Receipt numbering counts prior receipts so a retried request maps to
    // the same (sourceType, sourceId) → the ledger guard stays idempotent.
    const priorReceipts = await this.prisma.journalEntry.count({
      where: { storeId: store.id, sourceType: 'purchase_receipt', sourceId: { startsWith: `${po.id}:` } },
    });
    const receiptId = `${po.id}:R${priorReceipts + 1}`;
    let inventoryValue = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const { item, wanted } of lines) {
        if (wanted === 0) continue;
        inventoryValue += wanted * item.unitCost;

        // Weighted-average unit cost across all layers (after stock bump).
        const newCost = await this.weightedCost(item.unitCost, wanted, item.productId, tx);

        // Stock in + FIFO layer + movement, atomically.
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: { increment: wanted } },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: wanted },
            cost: newCost,
          },
        });
        await tx.inventoryBatch.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            quantity: wanted,
            unitCost: item.unitCost,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            supplierId: po.supplierId,
            type: 'in',
            quantity: wanted,
            unitCost: item.unitCost,
            referenceId: receiptId,
            reason: `Purchase order ${po.poNumber} receive`,
            reasonAr: `استلام أمر شراء ${po.poNumber}`,
          },
        });
      }

      // All lines fully received (including lines skipped by this request)?
      const allReceived = lines.every(
        (l) => l.item.receivedQuantity + l.wanted >= l.item.quantity,
      );
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: allReceived ? 'received' : 'partial',
          receivedAt: allReceived ? new Date() : null,
        },
      });

      // DR Inventory / CR Supplier Payable — idempotent per receipt id.
      await this.ledger.postSourceEntry(
        store.id,
        'purchase_receipt',
        receiptId,
        {
          memoEn: `Purchase receipt ${po.poNumber}`,
          memoAr: `إيصال استلام ${po.poNumber}`,
          lines: [
            { code: ACCOUNT_CODES.INVENTORY, debit: round2(inventoryValue), credit: 0, descriptionEn: `Goods received (${po.poNumber})`, descriptionAr: `بضاعة مستلمة (${po.poNumber})` },
            { code: ACCOUNT_CODES.SUPPLIER_PAYABLE, debit: 0, credit: round2(inventoryValue), descriptionEn: `Supplier payable (${po.poNumber})`, descriptionAr: `مستحق للمورد (${po.poNumber})` },
          ],
        },
        tx,
      );
    });

    return this.getPurchaseOrder(ownerUserId, storeId, purchaseOrderId);
  }

  /** POST /store/purchase-orders/:id/cancel — cancel an ordered PO. */
  async cancelPurchaseOrder(
    ownerUserId: string,
    storeId: string | undefined,
    purchaseOrderId: string,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { id: true, storeId: true, status: true },
    });
    if (!po || po.storeId !== store.id) {
      throw ApiError.notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found in this store');
    }
    if (po.status === 'received' || po.status === 'cancelled') {
      throw ApiError.conflict('PO_NOT_CANCELLABLE', `Purchase order is ${po.status} and cannot be cancelled`);
    }
    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { status: 'cancelled' },
      include: PO_INCLUDE,
    });
    return this.toView(updated);
  }

  // ------------------------------------------------------------------

  private toView(po: {
    id: string;
    poNumber: string;
    status: string;
    expectedAt: Date | null;
    orderedAt: Date | null;
    receivedAt: Date | null;
    notes: string | null;
    totalAmount: number;
    createdAt: Date;
    supplier: { id: string; nameEn: string; nameAr: string };
    items: {
      productId: string;
      quantity: number;
      receivedQuantity: number;
      unitCost: number;
      product: { id: string; nameEn: string; nameAr: string; sku: string | null };
    }[];
  }) {
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      expectedAt: po.expectedAt?.toISOString() ?? null,
      orderedAt: po.orderedAt?.toISOString() ?? null,
      receivedAt: po.receivedAt?.toISOString() ?? null,
      notes: po.notes,
      totalAmount: po.totalAmount,
      createdAt: po.createdAt.toISOString(),
      supplier: { id: po.supplier.id, nameEn: po.supplier.nameEn, nameAr: po.supplier.nameAr },
      items: po.items.map((item) => ({
        productId: item.productId,
        nameEn: item.product.nameEn,
        nameAr: item.product.nameAr,
        sku: item.product.sku,
        quantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        unitCost: item.unitCost,
      })),
    };
  }

  private async weightedCost(
    newUnitCost: number,
    newQty: number,
    productId: string,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const current = await tx.product.findUnique({
      where: { id: productId },
      select: { cost: true, stock: true },
    });
    const oldStock = Math.max(0, (current?.stock ?? 0) - newQty);
    const oldCost = current?.cost ?? newUnitCost;
    if (oldStock <= 0) return round2(newUnitCost);
    const total = oldStock * oldCost + newQty * newUnitCost;
    return round2(total / (oldStock + newQty));
  }

  /** Sequential per-store PO number `PO-YYYY-NNNN`. */
  private async nextPoNumber(storeId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.purchaseOrder.findFirst({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    });
    const match = /(\d+)$/.exec(last?.poNumber ?? '');
    const next = match ? Number(match[1]) + 1 : 1;
    return `PO-${year}-${String(next).padStart(4, '0')}`;
  }
}
