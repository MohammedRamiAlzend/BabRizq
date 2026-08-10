/**
 * Stock application service — adjustments, stocktakes, FIFO valuation, and
 * low-stock alerts (per `plans/03` §3: "Stock-out / adjustments with
 * reasons, stocktakes", "Low-stock alerts", "Stock valuation report").
 *
 * Valuation reads the FIFO layers (`InventoryBatch`) as the source of truth:
 * `value = Σ remaining units × layer unit cost`. When a product has no
 * layers yet (legacy data), it falls back to `stock × (cost ?? price)` so
 * the balance-sheet number never silently zeroes.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { LedgerPostingService } from '../../accounting/application/ledger-posting.service';
import { ACCOUNT_CODES, round2 } from '../../accounting/application/account-codes';
import { resolveOwnedStore } from '../../store/application/store-context';
import { FifoCostService } from './fifo-cost.service';

export interface AdjustStockInput {
  productId: string;
  quantity: number; // signed: + in, − out
  reason?: string | null;
  reasonAr?: string | null;
}

export interface StocktakeItemInput {
  productId: string;
  countedQuantity: number;
}

export interface StockValuationRow {
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string | null;
  stock: number;
  unitCost: number;
  value: number;
}

export interface LowStockAlertRow {
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string | null;
  stock: number;
  threshold: number;
}

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly ledger: LedgerPostingService,
  ) {}

  /**
   * POST /store/stock/movements — adjust stock with a reason.
   * Posts DR/CR Inventory vs Other Expense so the books reflect shrinkage
   * and overage immediately (one ledger entry per movement, idempotent).
   */
  async adjustStock(
    ownerUserId: string,
    storeId: string | undefined,
    input: AdjustStockInput,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, storeId: true, nameEn: true, nameAr: true, stock: true, cost: true },
    });
    if (!product || product.storeId !== store.id) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found in this store');
    }
    if (input.quantity === 0) {
      throw ApiError.badRequest('ZERO_ADJUSTMENT', 'Adjustment quantity cannot be zero');
    }
    const newStock = product.stock + input.quantity;
    if (newStock < 0) {
      throw ApiError.badRequest(
        'NEGATIVE_STOCK',
        `Adjustment would leave "${product.nameEn}" at ${newStock} units`,
      );
    }

    const movementId = `sm_${randomUUID()}`;
    const unitCost = product.cost ?? 0;
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock },
      });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: input.quantity > 0 ? 'in' : 'out',
          quantity: Math.abs(input.quantity),
          unitCost,
          referenceId: movementId,
          reason: input.reason ?? 'Manual adjustment',
          reasonAr: input.reasonAr ?? 'تسوية يدوية',
        },
      });

      // Inventory moves against Other Expense (shrinkage/overage).
      const value = round2(Math.abs(input.quantity) * unitCost);
        const lines =
        input.quantity > 0
          ? [
              { code: ACCOUNT_CODES.INVENTORY, debit: value, credit: 0, descriptionEn: 'Stock overage', descriptionAr: 'زيادة مخزون' },
              { code: ACCOUNT_CODES.OTHER_EXPENSE, debit: 0, credit: value, descriptionEn: 'Stock overage', descriptionAr: 'زيادة مخزون' },
            ]
          : [
              { code: ACCOUNT_CODES.OTHER_EXPENSE, debit: value, credit: 0, descriptionEn: 'Stock shrinkage', descriptionAr: 'نقص مخزون' },
              { code: ACCOUNT_CODES.INVENTORY, debit: 0, credit: value, descriptionEn: 'Stock shrinkage', descriptionAr: 'نقص مخزون' },
            ];
      await this.ledger.postSourceEntry(
        store.id,
        'stock_adjustment',
        movementId,
        {
          memoEn: `Stock adjustment: ${product.nameEn}`,
          memoAr: `تسوية مخزون: ${product.nameAr}`,
          lines,
        },
        tx,
      );
      await this.checkAndAlertLowStock(store.id, [product.id], tx);
    });

    return {
      productId: product.id,
      stock: newStock,
      movementId,
    };
  }

  /** POST /store/stock/stocktakes — open a stocktake (snapshot + variance). */
  async createStocktake(
    ownerUserId: string,
    storeId: string | undefined,
    input: { notes?: string | null; items: StocktakeItemInput[] },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    if (!input.items || input.items.length === 0) {
      throw ApiError.badRequest('STOCKTAKE_ITEMS_REQUIRED', 'A stocktake needs at least one item');
    }
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
      select: { id: true, stock: true },
    });
    if (products.length !== productIds.length) {
      throw ApiError.badRequest('PRODUCT_NOT_IN_STORE', 'All stocktake items must be products of this store');
    }
    const stockById = new Map(products.map((p) => [p.id, p.stock]));

    const created = await this.prisma.stockTake.create({
      data: {
        storeId: store.id,
        status: 'open',
        notes: input.notes ?? null,
        items: {
          create: input.items.map((i) => {
            const system = stockById.get(i.productId) ?? 0;
            return {
              productId: i.productId,
              countedQuantity: i.countedQuantity,
              systemQuantity: system,
              variance: i.countedQuantity - system,
            };
          }),
        },
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            countedQuantity: true,
            systemQuantity: true,
            variance: true,
            product: { select: { id: true, nameEn: true, nameAr: true, sku: true } },
          },
        },
      },
    });
    return this.toStocktakeView(created);
  }

  /** GET /store/stock/stocktakes — paginated list. */
  async listStocktakes(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const [stocktakes, totalItems] = await Promise.all([
      this.prisma.stockTake.findMany({
        where: { storeId: store.id },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              countedQuantity: true,
              systemQuantity: true,
              variance: true,
              product: { select: { id: true, nameEn: true, nameAr: true, sku: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.stockTake.count({ where: { storeId: store.id } }),
    ]);
    return buildPaginated(
      stocktakes.map((s) => this.toStocktakeView(s)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /**
   * POST /store/stock/stocktakes/:id/complete — apply the counted quantities.
   * Variances become `StockMovement` rows and one ledger entry (Inventory vs
   * Other Expense) for the net value change.
   */
  async completeStocktake(
    ownerUserId: string,
    storeId: string | undefined,
    stocktakeId: string,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const stocktake = await this.prisma.stockTake.findUnique({
      where: { id: stocktakeId },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variance: true,
            product: { select: { id: true, nameEn: true, nameAr: true, cost: true } },
          },
        },
      },
    });
    if (!stocktake || stocktake.storeId !== store.id) {
      throw ApiError.notFound('STOCKTAKE_NOT_FOUND', 'Stocktake not found in this store');
    }
    if (stocktake.status !== 'open') {
      throw ApiError.conflict('STOCKTAKE_NOT_OPEN', `Stocktake is already ${stocktake.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      let netValue = 0;
      for (const item of stocktake.items) {
        const variance = item.variance;
        if (variance === 0) continue;
        netValue += variance * (item.product.cost ?? 0);

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: variance } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: variance > 0 ? 'in' : 'out',
            quantity: Math.abs(variance),
            unitCost: item.product.cost ?? 0,
            referenceId: stocktake.id,
            reason: `Stocktake ${stocktake.id.slice(0, 8)}`,
            reasonAr: `جرد مخزون ${stocktake.id.slice(0, 8)}`,
          },
        });
      }

      const value = round2(Math.abs(netValue));
      if (value > 0) {
        const lines =
          netValue > 0
            ? [
                { code: ACCOUNT_CODES.INVENTORY, debit: value, credit: 0, descriptionEn: 'Stocktake variance (gain)', descriptionAr: 'فرق جرد (زيادة)' },
                { code: ACCOUNT_CODES.OTHER_EXPENSE, debit: 0, credit: value, descriptionEn: 'Stocktake variance (gain)', descriptionAr: 'فرق جرد (زيادة)' },
              ]
            : [
                { code: ACCOUNT_CODES.OTHER_EXPENSE, debit: value, credit: 0, descriptionEn: 'Stocktake variance (loss)', descriptionAr: 'فرق جرد (نقص)' },
                { code: ACCOUNT_CODES.INVENTORY, debit: 0, credit: value, descriptionEn: 'Stocktake variance (loss)', descriptionAr: 'فرق جرد (نقص)' },
              ];
        await this.ledger.postSourceEntry(
          store.id,
          'stocktake',
          stocktake.id,
          { memoEn: 'Stocktake variance', memoAr: 'فرق الجرد', lines },
          tx,
        );
      }

      await tx.stockTake.update({
        where: { id: stocktake.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      const changedIds = stocktake.items.map((i) => i.productId);
      await this.checkAndAlertLowStock(store.id, changedIds, tx);
    });

    return this.getStocktake(ownerUserId, storeId, stocktakeId);
  }

  /** GET /store/stock/valuation — FIFO inventory value per product + total. */
  async getValuation(ownerUserId: string, storeId: string | undefined) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const batches = await this.prisma.inventoryBatch.findMany({
      where: { storeId: store.id, quantity: { gt: 0 } },
      select: { productId: true, quantity: true, unitCost: true },
    });
    const batchValue = new Map<string, number>();
    const batchQty = new Map<string, number>();
    for (const b of batches) {
      batchValue.set(b.productId, (batchValue.get(b.productId) ?? 0) + b.quantity * b.unitCost);
      batchQty.set(b.productId, (batchQty.get(b.productId) ?? 0) + b.quantity);
    }

    const products = await this.prisma.product.findMany({
      where: { storeId: store.id },
      select: { id: true, nameEn: true, nameAr: true, sku: true, stock: true, cost: true, price: true },
      orderBy: { createdAt: 'asc' },
    });

    const rows: StockValuationRow[] = products.map((p) => {
      const fromBatches = batchValue.get(p.id);
      const value =
        fromBatches !== undefined
          ? round2(fromBatches)
          : round2(p.stock * (p.cost ?? p.price ?? 0));
      return {
        productId: p.id,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        sku: p.sku,
        stock: p.stock,
        unitCost: fromBatches !== undefined && batchQty.get(p.id)! > 0
          ? round2(fromBatches / batchQty.get(p.id)!)
          : p.cost ?? 0,
        value,
      };
    });

    const total = round2(rows.reduce((sum, r) => sum + r.value, 0));
    return { items: rows, total };
  }

  /** GET /store/stock/alerts — products at/below their low-stock threshold. */
  async getLowStockAlerts(ownerUserId: string, storeId: string | undefined) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const settings = await this.prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: { lowStockThreshold: true },
    });
    const defaultThreshold = settings?.lowStockThreshold ?? 10;

    const products = await this.prisma.product.findMany({
      where: { storeId: store.id, status: 'active' },
      select: { id: true, nameEn: true, nameAr: true, sku: true, stock: true, lowStockThreshold: true },
      orderBy: { stock: 'asc' },
    });

    const alerts: LowStockAlertRow[] = products
      .filter((p) => p.stock <= (p.lowStockThreshold ?? defaultThreshold))
      .map((p) => ({
        productId: p.id,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        sku: p.sku,
        stock: p.stock,
        threshold: p.lowStockThreshold ?? defaultThreshold,
      }));

    return { items: alerts, total: alerts.length };
  }

  /**
   * Internal — notifies the store owner once per low-stock episode (guarded
   * by `lowStockAlertedAt`) and clears the flag when restocked above the
   * threshold. Called after any stock-affecting event inside its tx.
   */
  async checkAndAlertLowStock(
    storeId: string,
    productIds: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (productIds.length === 0) return;
    const [store, settings, products] = await Promise.all([
      tx.store.findUnique({ where: { id: storeId }, select: { ownerUserId: true } }),
      tx.storeSettings.findUnique({ where: { storeId }, select: { lowStockThreshold: true } }),
      tx.product.findMany({
        where: { id: { in: [...new Set(productIds)] }, storeId },
        select: { id: true, nameEn: true, nameAr: true, stock: true, lowStockThreshold: true, lowStockAlertedAt: true },
      }),
    ]);
    if (!store) return;
    const threshold = settings?.lowStockThreshold ?? 10;

    for (const product of products) {
      const effective = product.lowStockThreshold ?? threshold;
      if (product.stock <= effective) {
        if (!product.lowStockAlertedAt) {
          await tx.product.update({
            where: { id: product.id },
            data: { lowStockAlertedAt: new Date() },
          });
          await this.notifications.create(
            store.ownerUserId,
            {
              type: 'low_stock',
              titleEn: 'Low stock',
              titleAr: 'مخزون منخفض',
              bodyEn: `"${product.nameEn}" is down to ${product.stock} units (threshold ${effective}).`,
              bodyAr: `"${product.nameAr}" وصل المخزون إلى ${product.stock} وحدة (الحد ${effective}).`,
            },
            tx,
          );
        }
      } else if (product.lowStockAlertedAt) {
        await tx.product.update({
          where: { id: product.id },
          data: { lowStockAlertedAt: null },
        });
      }
    }
  }

  // ------------------------------------------------------------------

  private async getStocktake(
    ownerUserId: string,
    storeId: string | undefined,
    stocktakeId: string,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const stocktake = await this.prisma.stockTake.findUnique({
      where: { id: stocktakeId },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            countedQuantity: true,
            systemQuantity: true,
            variance: true,
            product: { select: { id: true, nameEn: true, nameAr: true, sku: true } },
          },
        },
      },
    });
    if (!stocktake || stocktake.storeId !== store.id) {
      throw ApiError.notFound('STOCKTAKE_NOT_FOUND', 'Stocktake not found in this store');
    }
    return this.toStocktakeView(stocktake);
  }

  private toStocktakeView(stocktake: {
    id: string;
    status: string;
    notes: string | null;
    completedAt: Date | null;
    createdAt: Date;
    items: {
      id: string;
      productId: string;
      countedQuantity: number;
      systemQuantity: number;
      variance: number;
      product: { id: string; nameEn: string; nameAr: string; sku: string | null };
    }[];
  }) {
    return {
      id: stocktake.id,
      status: stocktake.status,
      notes: stocktake.notes,
      completedAt: stocktake.completedAt?.toISOString() ?? null,
      createdAt: stocktake.createdAt.toISOString(),
      totalVariance: stocktake.items.reduce((sum, i) => sum + i.variance, 0),
      items: stocktake.items.map((i) => ({
        productId: i.productId,
        nameEn: i.product.nameEn,
        nameAr: i.product.nameAr,
        sku: i.product.sku,
        countedQuantity: i.countedQuantity,
        systemQuantity: i.systemQuantity,
        variance: i.variance,
      })),
    };
  }
}
