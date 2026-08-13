/**
 * Offers application service — store-scoped promotions (product-level or
 * store-wide) with the discount engine used at checkout.
 *
 * Ownership is enforced via `X-Store-Id` (see `store-context.ts`). `activeOffers`
 * filters by status AND validity window, so expired offers never apply at
 * checkout. `bestDiscount` implements the "best single offer per order" rule
 * (no stacking) from the promotions plan.
 */
import { Injectable } from '@nestjs/common';
import { Offer, Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { resolveOwnedStore } from '../../store/application/store-context';
import { PrismaService } from '../../prisma/prisma.service';

/** Rounding helper for money (SAR): two decimals. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface OfferView {
  id: string;
  nameEn: string;
  nameAr: string;
  /** 'product' when a specific product is targeted, 'store' for store-wide. */
  type: 'product' | 'store';
  productId: string | null;
  productNameEn?: string;
  productNameAr?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  redemptionCount: number;
  createdAt: string;
}

export interface CreateOfferInput {
  nameEn: string;
  nameAr: string;
  productId?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  startDate?: string;
  endDate?: string;
}

export type UpdateOfferInput = Partial<CreateOfferInput>;

export interface BestDiscount {
  discount: number;
  offerId: string | null;
}

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Store-owner CRUD (/api/store/offers)
  // ------------------------------------------------------------------

  /** GET /store/offers — paginated offers with optional status filter. */
  async listOffers(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; status?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const where: Prisma.OfferWhereInput = {
      storeId: store.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, totalItems] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: { product: { select: { nameEn: true, nameAr: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.offer.count({ where }),
    ]);

    return buildPaginated(
      rows.map((row) => this.toView(row)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** POST /store/offers — create an offer (product-scoped or store-wide). */
  async createOffer(
    ownerUserId: string,
    storeId: string | undefined,
    input: CreateOfferInput,
  ): Promise<OfferView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    this.assertInput(input);

    if (input.productId) {
      await this.assertProductBelongsToStore(store.id, input.productId);
    }

    const offer = await this.prisma.offer.create({
      data: {
        storeId: store.id,
        productId: input.productId ?? null,
        titleEn: input.nameEn,
        titleAr: input.nameAr,
        discountType: input.discountType,
        discountValue: input.discountValue,
        validFrom: input.startDate ? new Date(input.startDate) : null,
        validTo: input.endDate ? new Date(input.endDate) : null,
        status: 'active',
      },
      include: { product: { select: { nameEn: true, nameAr: true } } },
    });
    return this.toView(offer);
  }

  /** PUT /store/offers/:id — partial update (ownership enforced). */
  async updateOffer(
    ownerUserId: string,
    storeId: string | undefined,
    offerId: string,
    input: UpdateOfferInput,
  ): Promise<OfferView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const offer = await this.assertOfferBelongsToStore(store.id, offerId);
    this.assertInput(input);

    if (input.productId !== undefined && input.productId) {
      await this.assertProductBelongsToStore(store.id, input.productId);
    }

    const data: Prisma.OfferUncheckedUpdateInput = {};
    if (input.nameEn !== undefined) data.titleEn = input.nameEn;
    if (input.nameAr !== undefined) data.titleAr = input.nameAr;
    if (input.discountType !== undefined) data.discountType = input.discountType;
    if (input.discountValue !== undefined) data.discountValue = input.discountValue;
    if (input.productId !== undefined) data.productId = input.productId || null;
    if (input.startDate !== undefined) {
      data.validFrom = input.startDate ? new Date(input.startDate) : null;
    }
    if (input.endDate !== undefined) {
      data.validTo = input.endDate ? new Date(input.endDate) : null;
    }

    // Re-validate the merged window if either date is changing.
    const merged = {
      ...offer,
      ...(input.startDate !== undefined
        ? { validFrom: input.startDate ? new Date(input.startDate) : null }
        : {}),
      ...(input.endDate !== undefined
        ? { validTo: input.endDate ? new Date(input.endDate) : null }
        : {}),
    };
    this.assertWindow(merged);

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data,
      include: { product: { select: { nameEn: true, nameAr: true } } },
    });
    return this.toView(updated);
  }

  /** DELETE /store/offers/:id — delete an offer (ownership enforced). */
  async deleteOffer(
    ownerUserId: string,
    storeId: string | undefined,
    offerId: string,
  ): Promise<null> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertOfferBelongsToStore(store.id, offerId);
    await this.prisma.offer.delete({ where: { id: offerId } });
    return null;
  }

  /** POST /store/offers/:id/activate|pause — flip the offer status. */
  async setStatus(
    ownerUserId: string,
    storeId: string | undefined,
    offerId: string,
    status: 'active' | 'paused',
  ): Promise<OfferView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertOfferBelongsToStore(store.id, offerId);
    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
      include: { product: { select: { nameEn: true, nameAr: true } } },
    });
    return this.toView(updated);
  }

  /** PATCH /store/offers/:id/toggle — flip `isActive` without touching other fields. */
  async toggle(
    ownerUserId: string,
    storeId: string | undefined,
    offerId: string,
    isActive: boolean,
  ): Promise<OfferView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertOfferBelongsToStore(store.id, offerId);
    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: isActive ? 'active' : 'paused' },
      include: { product: { select: { nameEn: true, nameAr: true } } },
    });
    return this.toView(updated);
  }

  /** GET /store/offers/:id/stats — redemption analytics from applied orders. */
  async getStats(
    ownerUserId: string,
    storeId: string | undefined,
    offerId: string,
  ): Promise<{
    totalOrders: number;
    totalDiscount: number;
    totalRevenue: number;
    redemptionCount: number;
    lastUsedAt: string | null;
  }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const offer = await this.assertOfferBelongsToStore(store.id, offerId);

    const [aggregate, lastOrder] = await Promise.all([
      this.prisma.order.aggregate({
        where: { storeId: store.id, offerId },
        _count: { id: true },
        _sum: { discount: true, total: true },
      }),
      this.prisma.order.findFirst({
        where: { storeId: store.id, offerId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalOrders: aggregate._count.id,
      totalDiscount: round2(aggregate._sum.discount ?? 0),
      totalRevenue: round2(aggregate._sum.total ?? 0),
      redemptionCount: offer.redemptionCount,
      lastUsedAt: lastOrder ? lastOrder.createdAt.toISOString() : null,
    };
  }

  // ------------------------------------------------------------------
  // Checkout integration (consumed by the orders module)
  // ------------------------------------------------------------------

  /**
   * Active offers for a store — status `active` AND within the validity
   * window (open-ended when `validFrom`/`validTo` are null).
   */
  activeOffers(storeId: string, tx?: Prisma.TransactionClient): Promise<Offer[]> {
    const client = tx ?? this.prisma;
    const now = new Date();
    return client.offer.findMany({
      where: {
        storeId,
        status: 'active',
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
        ],
      },
    });
  }

  /**
   * Best single offer for an order: store-wide offers discount the whole
   * subtotal, product offers discount that product's line total. The offer
   * yielding the largest total discount wins (no stacking).
   */
  bestDiscount(
    offers: Offer[],
    items: { productId: string; unitPrice: number; qty: number }[],
  ): BestDiscount {
    const subtotal = round2(
      items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    );
    let best: BestDiscount = { discount: 0, offerId: null };

    for (const offer of offers) {
      let base = 0;
      if (offer.productId === null) {
        base = subtotal;
      } else {
        const line = items.find((item) => item.productId === offer.productId);
        if (!line) continue;
        base = round2(line.unitPrice * line.qty);
      }
      const discount =
        offer.discountType === 'percent'
          ? round2((base * offer.discountValue) / 100)
          : Math.min(offer.discountValue, base);

      if (discount > best.discount) {
        best = { discount, offerId: offer.id };
      }
    }
    return best;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Validates discount value ranges + the validity window of a DTO input. */
  private assertInput(input: CreateOfferInput | UpdateOfferInput): void {
    if (input.discountValue !== undefined) {
      if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
        throw ApiError.badRequest(
          'INVALID_DISCOUNT_VALUE',
          'Discount value must be greater than zero',
        );
      }
      if (input.discountType === 'percent' && input.discountValue > 100) {
        throw ApiError.badRequest(
          'INVALID_DISCOUNT_VALUE',
          'Percentage discount cannot exceed 100',
        );
      }
    }
    if (
      input.startDate &&
      input.endDate &&
      new Date(input.endDate) <= new Date(input.startDate)
    ) {
      throw ApiError.badRequest(
        'INVALID_OFFER_WINDOW',
        'endDate must be after startDate',
      );
    }
  }

  private assertWindow(offer: {
    validFrom: Date | null;
    validTo: Date | null;
  }): void {
    if (offer.validFrom && offer.validTo && offer.validTo <= offer.validFrom) {
      throw ApiError.badRequest(
        'INVALID_OFFER_WINDOW',
        'endDate must be after startDate',
      );
    }
  }

  private async assertProductBelongsToStore(
    storeId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
      select: { id: true },
    });
    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found in this store');
    }
  }

  private async assertOfferBelongsToStore(
    storeId: string,
    offerId: string,
  ): Promise<Offer> {
    const offer = await this.prisma.offer.findFirst({
      where: { id: offerId, storeId },
    });
    if (!offer) {
      throw ApiError.notFound('OFFER_NOT_FOUND', 'Offer not found in this store');
    }
    return offer;
  }

  private toView(
    row: Offer & { product?: { nameEn: string; nameAr: string } | null },
  ): OfferView {
    return {
      id: row.id,
      nameEn: row.titleEn,
      nameAr: row.titleAr,
      type: row.productId ? 'product' : 'store',
      productId: row.productId,
      productNameEn: row.product?.nameEn,
      productNameAr: row.product?.nameAr,
      discountType: row.discountType as 'percent' | 'fixed',
      discountValue: row.discountValue,
      startDate: row.validFrom ? row.validFrom.toISOString() : null,
      endDate: row.validTo ? row.validTo.toISOString() : null,
      isActive: row.status === 'active',
      redemptionCount: row.redemptionCount,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
