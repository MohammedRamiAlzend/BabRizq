/**
 * Store-warehouse application service — inventory levels, stock movements,
 * and supplier management (store-owner `warehouse.md`).
 *
 * Stock adjustments update the product row AND append a StockMovement row so
 * the movements log stays a full audit trail. Suppliers can be deleted only
 * when no movement references them (a supplier with history is unlinked
 * instead — the StockMovement FK is SetNull).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from './store-context';

/** InventoryItem shape (warehouse.md). */
export interface InventoryItemView {
  id: string;
  nameEn: string;
  nameAr: string;
  stock: number;
  sku?: string;
}

/** StockMovement shape (warehouse.md). */
export interface StockMovementView {
  id: string;
  productId: string;
  productNameEn: string;
  productNameAr: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reasonAr: string;
  date: string; // YYYY-MM-DD
  supplierId?: string;
  supplierNameEn?: string;
  supplierNameAr?: string;
}

/** Supplier shape (warehouse.md). */
export interface SupplierView {
  id: string;
  nameEn: string;
  nameAr: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: number;
}

@Injectable()
export class StoreWarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/warehouse/inventory — paginated stock levels, filterable. */
  async listInventory(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; search?: string; filter?: 'all' | 'low' | 'out' },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const settings = await this.prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: { lowStockThreshold: true },
    });
    const threshold = settings?.lowStockThreshold ?? 5;

    const where: Prisma.ProductWhereInput = {
      storeId: store.id,
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search } },
              { nameAr: { contains: query.search } },
            ],
          }
        : {}),
    };
    if (query.filter === 'low') where.stock = { lte: threshold };
    if (query.filter === 'out') where.stock = 0;

    const [rows, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: { id: true, nameEn: true, nameAr: true, stock: true, sku: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginated(
      rows.map((row): InventoryItemView => {
        const view: InventoryItemView = {
          id: row.id,
          nameEn: row.nameEn,
          nameAr: row.nameAr,
          stock: row.stock,
        };
        if (row.sku) view.sku = row.sku;
        return view;
      }),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /**
   * PUT /store/warehouse/inventory/:productId/adjust — restock (delta > 0)
   * or remove stock (delta < 0). Errors: STOCK_CANNOT_BE_NEGATIVE (422).
   */
  async adjustInventory(
    ownerUserId: string,
    storeId: string | undefined,
    productId: string,
    delta: number,
    note?: string,
  ): Promise<InventoryItemView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: { id: true, nameEn: true, nameAr: true, stock: true, sku: true },
    });
    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found in this store');
    }
    if (delta === 0) {
      throw ApiError.badRequest('INVALID_DELTA', 'delta must not be zero');
    }

    const nextStock = product.stock + delta;
    if (nextStock < 0) {
      throw new ApiError(
        'STOCK_CANNOT_BE_NEGATIVE',
        422,
        `Adjusting by ${delta} would leave ${nextStock} units (negative stock is not allowed)`,
      );
    }

    const [updated, movement] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: product.id },
        data: { stock: nextStock },
        select: { id: true, nameEn: true, nameAr: true, stock: true, sku: true },
      }),
      this.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: delta > 0 ? 'in' : 'out',
          quantity: Math.abs(delta),
          reason: note ?? (delta > 0 ? 'Stock restocked' : 'Stock removed'),
          reasonAr: note ?? (delta > 0 ? 'إضافة مخزون' : 'خصم مخزون'),
        },
      }),
    ]);

    const view: InventoryItemView = {
      id: updated.id,
      nameEn: updated.nameEn,
      nameAr: updated.nameAr,
      stock: updated.stock,
    };
    if (updated.sku) view.sku = updated.sku;
    return view;
  }

  /** GET /store/warehouse/movements — paginated stock audit trail. */
  async listMovements(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const where = { product: { storeId: store.id } };

    const [rows, totalItems] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { nameEn: true, nameAr: true } },
          supplier: { select: { nameEn: true, nameAr: true } },
        },
        orderBy: { movementDate: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return buildPaginated(
      rows.map((row): StockMovementView => {
        const view: StockMovementView = {
          id: row.id,
          productId: row.productId,
          productNameEn: row.product.nameEn,
          productNameAr: row.product.nameAr,
          type: row.type as StockMovementView['type'],
          quantity: row.quantity,
          reason: row.reason ?? '',
          reasonAr: row.reasonAr ?? '',
          date: row.movementDate.toISOString().slice(0, 10),
        };
        if (row.supplierId && row.supplier) {
          view.supplierId = row.supplierId;
          view.supplierNameEn = row.supplier.nameEn;
          view.supplierNameAr = row.supplier.nameAr;
        }
        return view;
      }),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** GET /store/warehouse/suppliers — paginated supplier list. */
  async listSuppliers(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const where = { storeId: store.id };

    const [rows, totalItems] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { nameEn: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const counts = await this.productCountsBySupplier(store.id, rows.map((r) => r.id));

    return buildPaginated(
      rows.map((row) => this.toSupplierView(row, counts.get(row.id) ?? 0)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** POST /store/warehouse/suppliers — create a supplier (productsSupplied 0). */
  async createSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    dto: {
      nameEn: string;
      nameAr: string;
      contactName: string;
      phone: string;
      email: string;
      address: string;
    },
  ): Promise<SupplierView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const supplier = await this.prisma.supplier.create({
      data: {
        storeId: store.id,
        ...dto,
      },
    });
    return this.toSupplierView(supplier, 0);
  }

  /** PUT /store/warehouse/suppliers/:id — partial update (ownership enforced). */
  async updateSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    supplierId: string,
    dto: Partial<{
      nameEn: string;
      nameAr: string;
      contactName: string;
      phone: string;
      email: string;
      address: string;
    }>,
  ): Promise<SupplierView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertSupplierBelongsToStore(store.id, supplierId);

    const updated = await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { ...dto },
    });
    const counts = await this.productCountsBySupplier(store.id, [supplierId]);
    return this.toSupplierView(updated, counts.get(supplierId) ?? 0);
  }

  /** DELETE /store/warehouse/suppliers/:id — delete (ownership enforced). */
  async deleteSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    supplierId: string,
  ): Promise<null> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertSupplierBelongsToStore(store.id, supplierId);
    await this.prisma.supplier.delete({ where: { id: supplierId } });
    return null;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Distinct products supplied per supplier (from the stock-movement log). */
  private async productCountsBySupplier(
    storeId: string,
    supplierIds: string[],
  ): Promise<Map<string, number>> {
    if (supplierIds.length === 0) return new Map();
    const rows = await this.prisma.stockMovement.findMany({
      where: { supplierId: { in: supplierIds }, product: { storeId } },
      distinct: ['productId'],
      select: { supplierId: true, productId: true },
    });
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = row.supplierId!;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  private toSupplierView(
    supplier: {
      id: string;
      nameEn: string;
      nameAr: string;
      contactName: string | null;
      phone: string | null;
      email: string | null;
      address: string | null;
    },
    productsSupplied: number,
  ): SupplierView {
    return {
      id: supplier.id,
      nameEn: supplier.nameEn,
      nameAr: supplier.nameAr,
      contactName: supplier.contactName ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      productsSupplied,
    };
  }

  private async assertSupplierBelongsToStore(storeId: string, supplierId: string): Promise<void> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, storeId },
      select: { id: true },
    });
    if (!supplier) {
      throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Supplier not found in this store');
    }
  }
}
