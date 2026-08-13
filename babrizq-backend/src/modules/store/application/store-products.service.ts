/**
 * Store-products application service — CRUD for a store-owner's products.
 *
 * Ownership is enforced via `X-Store-Id` (see `store-context.ts`). `hasOffer`
 * is computed from the store's active offers: a product has an offer when an
 * active offer targets it directly or the whole store.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService, UploadedFileData } from '../../storage/storage.types';
import { StoreProductView, toStoreProductView } from './store.mapper';
import { resolveOwnedStore } from './store-context';

export interface CreateProductInput {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  images?: string[];
  price: number;
  stock: number;
  categoryId: string;
  sku?: string;
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'categoryId'> & { categoryId?: string }>;

const PRODUCT_INCLUDE = { category: true, tags: true } satisfies Prisma.ProductInclude;

@Injectable()
export class StoreProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** GET /store/products — paginated list with search + category filter. */
  async listProducts(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; search?: string; categoryId?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const where: Prisma.ProductWhereInput = {
      storeId: store.id,
      ...(query.categoryId ? { storeCategoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search } },
              { nameAr: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [products, totalItems, offers] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.product.count({ where }),
      this.activeOffers(store.id),
    ]);

    return buildPaginated(
      products.map((product) =>
        toStoreProductView(product, this.hasOffer(product.id, offers)),
      ),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** POST /store/products — create a product in the store's category. */
  async createProduct(
    ownerUserId: string,
    storeId: string | undefined,
    input: CreateProductInput,
  ): Promise<StoreProductView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertCategoryBelongsToStore(store.id, input.categoryId);

    const product = await this.prisma.product.create({
      data: {
        storeId: store.id,
        categoryCode: await this.platformCategoryFor(store.id, input.categoryId),
        storeCategoryId: input.categoryId,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr,
        imageUrl: input.images?.[0] ?? null,
        price: input.price,
        stock: input.stock,
        sku: input.sku ?? null,
      },
      include: PRODUCT_INCLUDE,
    });
    return toStoreProductView(product, false);
  }

  /** PUT /store/products/:id — partial update (ownership enforced). */
  async updateProduct(
    ownerUserId: string,
    storeId: string | undefined,
    productId: string,
    input: UpdateProductInput,
  ): Promise<StoreProductView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertProductBelongsToStore(store.id, productId);
    if (input.categoryId) {
      await this.assertCategoryBelongsToStore(store.id, input.categoryId);
    }

    // Unchecked input so we can set the scalar FK fields directly.
    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (input.nameEn !== undefined) data.nameEn = input.nameEn;
    if (input.nameAr !== undefined) data.nameAr = input.nameAr;
    if (input.descriptionEn !== undefined) data.descriptionEn = input.descriptionEn;
    if (input.descriptionAr !== undefined) data.descriptionAr = input.descriptionAr;
    if (input.images !== undefined) data.imageUrl = input.images[0] ?? null;
    if (input.price !== undefined) data.price = input.price;
    if (input.stock !== undefined) data.stock = input.stock;
    if (input.sku !== undefined) data.sku = input.sku;
    if (input.categoryId !== undefined) {
      data.storeCategoryId = input.categoryId;
      data.categoryCode = await this.platformCategoryFor(store.id, input.categoryId);
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data,
      include: PRODUCT_INCLUDE,
    });
    const offers = await this.activeOffers(store.id);
    return toStoreProductView(product, this.hasOffer(product.id, offers));
  }

  /** DELETE /store/products/:id — delete (ownership enforced). */
  async deleteProduct(
    ownerUserId: string,
    storeId: string | undefined,
    productId: string,
  ): Promise<null> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertProductBelongsToStore(store.id, productId);
    await this.prisma.product.delete({ where: { id: productId } });
    return null;
  }

  /**
   * GET /store/products/:id/price-history — placeholder.
   * A dedicated price-history table is a future accounting-phase model; the
   * contract shape is returned with an empty list for now.
   */
  async getPriceHistory(
    ownerUserId: string,
    storeId: string | undefined,
    productId: string,
  ): Promise<{ entries: { currency: string; amount: number; date: string }[] }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertProductBelongsToStore(store.id, productId);
    return { entries: [] };
  }

  /**
   * POST /store/products/:id/images — stores one image for the product and
   * returns its URL (the client persists it via the `images` array).
   */
  async uploadImage(
    ownerUserId: string,
    storeId: string | undefined,
    productId: string,
    file: UploadedFileData | undefined,
  ): Promise<{ url: string }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertProductBelongsToStore(store.id, productId);
    if (!file || file.size === 0) {
      throw ApiError.badRequest('NO_FILE_UPLOADED', 'No file uploaded');
    }
    const stored = await this.storage.save(file, 'products');
    return { url: stored.url };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** All active offers for a store (product-scoped + store-wide). */
  private activeOffers(storeId: string) {
    return this.prisma.offer.findMany({
      where: { storeId, status: 'active' },
      select: { productId: true },
    });
  }

  /** hasOffer = targeted by an active offer, or the store has a store-wide offer. */
  private hasOffer(productId: string, offers: { productId: string | null }[]): boolean {
    return offers.some(
      (offer) => offer.productId === productId || offer.productId === null,
    );
  }

  private async assertProductBelongsToStore(storeId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
      select: { id: true },
    });
    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found in this store');
    }
  }

  private async assertCategoryBelongsToStore(storeId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.storeCategory.findFirst({
      where: { id: categoryId, storeId },
      select: { id: true },
    });
    if (!category) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', 'Category not found in this store');
    }
  }

  /** The platform category the store's sub-category maps to (defaults to the store's). */
  private async platformCategoryFor(
    storeId: string,
    _categoryId: string,
  ): Promise<string> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { categoryCode: true },
    });
    return store?.categoryCode ?? 'Electronics';
  }
}
