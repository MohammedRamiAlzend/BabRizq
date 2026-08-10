/**
 * Suppliers application service — store-scoped supplier directory with
 * purchase history (per `plans/03` §3: "Supplier management: list, contact,
 * purchase history, lead times").
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';

export interface SupplierView {
  id: string;
  nameEn: string;
  nameAr: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  leadTimeDays: number | null;
  isActive: boolean;
  createdAt: string;
  purchaseOrderCount: number;
}

export interface CreateSupplierInput {
  nameEn: string;
  nameAr: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  leadTimeDays?: number | null;
}

const COUNT_INCLUDE = {
  _count: { select: { purchaseOrders: true } },
} satisfies Prisma.SupplierInclude;

type SupplierRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  leadTimeDays: number | null;
  isActive: boolean;
  createdAt: Date;
  _count: { purchaseOrders: number };
};

function toView(supplier: SupplierRow): SupplierView {
  return {
    id: supplier.id,
    nameEn: supplier.nameEn,
    nameAr: supplier.nameAr,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    leadTimeDays: supplier.leadTimeDays,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt.toISOString(),
    purchaseOrderCount: supplier._count.purchaseOrders,
  };
}

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/suppliers — paginated supplier list (search optional). */
  async listSuppliers(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; search?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const where: Prisma.SupplierWhereInput = {
      storeId: store.id,
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search } },
              { nameAr: { contains: query.search } },
              { contactName: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [suppliers, totalItems] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        include: COUNT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return buildPaginated(
      suppliers.map((s) => toView(s)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** POST /store/suppliers — create a supplier. */
  async createSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    input: CreateSupplierInput,
  ): Promise<SupplierView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const created = await this.prisma.supplier.create({
      data: {
        storeId: store.id,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        contactName: input.contactName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        leadTimeDays: input.leadTimeDays ?? null,
      },
      include: COUNT_INCLUDE,
    });
    return toView(created);
  }

  /** PUT /store/suppliers/:id — update a supplier (store-scoped). */
  async updateSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    supplierId: string,
    input: Partial<CreateSupplierInput>,
  ): Promise<SupplierView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const supplier = await this.findOwnedSupplier(store.id, supplierId);

    const updated = await this.prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.leadTimeDays !== undefined ? { leadTimeDays: input.leadTimeDays } : {}),
      },
      include: COUNT_INCLUDE,
    });
    return toView(updated);
  }

  /** GET /store/suppliers/:id — single supplier with purchase history. */
  async getSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    supplierId: string,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        ...COUNT_INCLUDE,
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
            orderedAt: true,
            receivedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!supplier || supplier.storeId !== store.id) {
      throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Supplier not found in this store');
    }
    return {
      ...toView(supplier),
      purchaseOrders: supplier.purchaseOrders.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        totalAmount: po.totalAmount,
        orderedAt: po.orderedAt?.toISOString() ?? null,
        receivedAt: po.receivedAt?.toISOString() ?? null,
      })),
    };
  }

  /** DELETE /store/suppliers/:id — only when no purchase orders reference it. */
  async deleteSupplier(
    ownerUserId: string,
    storeId: string | undefined,
    supplierId: string,
  ): Promise<{ id: string }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const supplier = await this.findOwnedSupplier(store.id, supplierId);
    const poCount = await this.prisma.purchaseOrder.count({
      where: { supplierId: supplier.id },
    });
    if (poCount > 0) {
      throw ApiError.conflict(
        'SUPPLIER_IN_USE',
        `Supplier has ${poCount} purchase order(s) — archive instead of deleting`,
      );
    }
    await this.prisma.supplier.delete({ where: { id: supplier.id } });
    return { id: supplier.id };
  }

  /** Loads a supplier that belongs to the store (404 otherwise). */
  private async findOwnedSupplier(storeId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, storeId: true },
    });
    if (!supplier || supplier.storeId !== storeId) {
      throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Supplier not found in this store');
    }
    return supplier;
  }
}
