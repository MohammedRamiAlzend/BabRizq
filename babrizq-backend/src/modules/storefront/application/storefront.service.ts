/**
 * Storefront application service — read-only catalog use cases for the
 * customer storefront (`/api/storefront/*`).
 *
 * All queries go through Prisma directly (the infrastructure layer); the
 * service owns mapping to the frontend contract shapes and the small
 * computations (tag groups, related categories, price range, deal flags).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { Paginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { AdView, ProductView, StoreView, toAdView, toProductView, toStoreView } from './storefront.mapper';
import { buildTagGroups, RELATED_CATEGORIES, SORT_ORDERS } from './storefront.constants';

/** Product row + the relations every catalog query needs. */
const PRODUCT_INCLUDE = {
  store: true,
  category: true,
  tags: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Homepage sections
  // ------------------------------------------------------------------

  /** GET /storefront/stores — every visible store with its product count. */
  async getStores(): Promise<{ stores: (StoreView & { productCount: number })[] }> {
    const stores = await this.prisma.store.findMany({
      include: { category: true, _count: { select: { products: true } } },
      orderBy: { nameEn: 'asc' },
    });
    return {
      stores: stores.map((store) => ({
        ...toStoreView(store),
        productCount: store._count.products,
      })),
    };
  }

  /** GET /storefront/categories — platform categories with deal indicators. */
  async getCategories(): Promise<
    { categories: { nameEn: string; nameAr: string; hasDeals: boolean }[] }
  > {
    const categories = await this.prisma.platformCategory.findMany({
      include: {
        products: {
          where: { originalPrice: { not: null }, status: 'active' },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return {
      categories: categories.map((category) => ({
        nameEn: category.code,
        nameAr: category.nameAr,
        hasDeals: category.products.length > 0,
      })),
    };
  }

  /** GET /storefront/featured — Flash Deals carousel products. */
  async getFeatured(limit: number): Promise<{ products: ProductView[] }> {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'active',
        OR: [{ isFeatured: true }, { originalPrice: { not: null } }],
      },
      include: PRODUCT_INCLUDE,
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return { products: products.map(toProductView) };
  }

  /**
   * GET /storefront/recommendations — product suggestions from the
   * client-provided interest categories (client-side interest tracking).
   */
  async getRecommendations(
    categories: string[],
    limit: number,
  ): Promise<{ products: ProductView[] }> {
    if (categories.length === 0) return { products: [] };
    const products = await this.prisma.product.findMany({
      where: { status: 'active', categoryCode: { in: categories } },
      include: PRODUCT_INCLUDE,
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return { products: products.map(toProductView) };
  }

  /** GET /storefront/ads — global homepage promotional banners. */
  async getAds(): Promise<{ ads: AdView[] }> {
    const ads = await this.prisma.ad.findMany({
      where: { placement: 'home', active: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { ads: ads.map(toAdView) };
  }

  // ------------------------------------------------------------------
  // Product browsing
  // ------------------------------------------------------------------

  /**
   * GET /storefront/products — paginated, filterable product list.
   * `priceRange` is the global min/max across ALL products (before filters)
   * so the client can initialize its price slider.
   */
  async listProducts(query: {
    page: number;
    pageSize: number;
    search?: string;
    priceMin?: number;
    priceMax?: number;
    stores?: string[];
    categories?: string[];
    onlyDiscounted?: boolean;
    onlyNew?: boolean;
    minRating?: number;
    sortBy: 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  }): Promise<Paginated<ProductView> & { priceRange: { min: number; max: number } }> {
    const where = this.productWhere(query);

    const [items, totalItems, range] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: SORT_ORDERS[query.sortBy],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.product.count({ where }),
      this.prisma.product.aggregate({
        where: { status: 'active' },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      ...Paginated.from(
        items.map(toProductView),
        totalItems,
        query.page,
        query.pageSize,
      ),
      priceRange: {
        min: range._min.price ?? 0,
        max: range._max.price ?? 0,
      },
    };
  }

  /** GET /storefront/products/:id — single product detail. */
  async getProduct(id: string): Promise<ProductView> {
    const product = await this.prisma.product.findFirst({
      where: { id, status: 'active' },
      include: PRODUCT_INCLUDE,
    });
    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }
    return toProductView(product);
  }

  // ------------------------------------------------------------------
  // Category catalog
  // ------------------------------------------------------------------

  /** GET /storefront/categories/:categoryEn — category page payload. */
  async getCategoryCatalog(
    categoryEn: string,
    query: { page: number; pageSize: number; search?: string },
  ) {
    const category = await this.prisma.platformCategory.findUnique({
      where: { code: categoryEn },
    });
    if (!category) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', `Category "${categoryEn}" not found`);
    }

    const where: Prisma.ProductWhereInput = {
      categoryCode: categoryEn,
      status: 'active',
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search } },
              { nameAr: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [products, totalItems, storeGroups, ads, categoryProducts] =
      await Promise.all([
        this.prisma.product.findMany({
          where,
          include: PRODUCT_INCLUDE,
          orderBy: SORT_ORDERS.default,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        this.prisma.product.count({ where }),
        this.prisma.product.groupBy({
          by: ['storeId'],
          where: { categoryCode: categoryEn, status: 'active' },
          _count: true,
        }),
        this.prisma.ad.findMany({
          where: { placement: 'category', categoryCode: categoryEn, active: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        }),
        // Full category set (no search) — tag groups always use this.
        this.prisma.product.findMany({
          where: { categoryCode: categoryEn, status: 'active' },
          include: { tags: true },
        }),
      ]);

    const related = await this.relatedCategories(categoryEn);

    return {
      category: { nameEn: category.code, nameAr: category.nameAr },
      ...Paginated.from(
        products.map(toProductView),
        totalItems,
        query.page,
        query.pageSize,
      ),
      storeCount: storeGroups.length,
      ads: ads.map(toAdView),
      tagGroups: buildTagGroups(categoryProducts.map((p) => ({ tags: p.tags.map((t) => t.value) }))),
      relatedCategories: related,
    };
  }

  /** GET /storefront/categories/:categoryEn/stores — stores in a category. */
  async getCategoryStores(
    categoryEn: string,
    limit: number,
  ): Promise<{ stores: (StoreView & { productCount: number })[] }> {
    await this.assertCategory(categoryEn);
    const stores = await this.prisma.store.findMany({
      where: { categoryCode: categoryEn },
      include: { category: true, _count: { select: { products: true } } },
      orderBy: { nameEn: 'asc' },
      take: limit,
    });
    return {
      stores: stores.map((store) => ({
        ...toStoreView(store),
        productCount: store._count.products,
      })),
    };
  }

  /** GET /storefront/categories/:categoryEn/ads — category banners. */
  async getCategoryAds(categoryEn: string): Promise<{ ads: AdView[] }> {
    await this.assertCategory(categoryEn);
    const ads = await this.prisma.ad.findMany({
      where: { placement: 'category', categoryCode: categoryEn, active: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { ads: ads.map(toAdView) };
  }

  // ------------------------------------------------------------------
  // Store catalog
  // ------------------------------------------------------------------

  /** GET /storefront/stores/:storeId — store page payload. */
  async getStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        category: true,
        categories: { orderBy: { nameEn: 'asc' } },
        ads: {
          where: { placement: 'store', active: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
        _count: { select: { products: true } },
      },
    });
    if (!store) {
      throw ApiError.notFound('STORE_NOT_FOUND', `Store "${storeId}" not found`);
    }
    return {
      store: toStoreView(store),
      storeCategories: store.categories.map((sc) => ({
        id: sc.id,
        storeId: sc.storeId,
        nameEn: sc.nameEn,
        nameAr: sc.nameAr,
        emoji: sc.emoji,
      })),
      ads: store.ads.map(toAdView),
      productCount: store._count.products,
    };
  }

  /** GET /storefront/stores/:storeId/products — store products + sub-category counts. */
  async getStoreProducts(
    storeId: string,
    query: { page: number; pageSize: number; search?: string; storeCategoryId?: string },
  ) {
    await this.assertStore(storeId);

    const where: Prisma.ProductWhereInput = {
      storeId,
      status: 'active',
      ...(query.storeCategoryId ? { storeCategoryId: query.storeCategoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search } },
              { nameAr: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, totalItems, groups] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: SORT_ORDERS.default,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({
        by: ['storeCategoryId'],
        where: { storeId, status: 'active', storeCategoryId: { not: null } },
        _count: true,
      }),
    ]);

    const categoryProductCounts: Record<string, number> = {};
    for (const group of groups) {
      if (group.storeCategoryId) categoryProductCounts[group.storeCategoryId] = group._count;
    }

    return {
      ...Paginated.from(items.map(toProductView), totalItems, query.page, query.pageSize),
      categoryProductCounts,
    };
  }

  /** GET /storefront/stores/:storeId/similar — same-category stores. */
  async getSimilarStores(
    storeId: string,
    limit: number,
  ): Promise<{ stores: (StoreView & { productCount: number })[] }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { categoryCode: true },
    });
    if (!store) {
      throw ApiError.notFound('STORE_NOT_FOUND', `Store "${storeId}" not found`);
    }
    const stores = await this.prisma.store.findMany({
      where: { categoryCode: store.categoryCode, id: { not: storeId } },
      include: { category: true, _count: { select: { products: true } } },
      orderBy: { nameEn: 'asc' },
      take: limit,
    });
    return {
      stores: stores.map((s) => ({ ...toStoreView(s), productCount: s._count.products })),
    };
  }

  /** GET /storefront/stores/:storeId/more-in-category — same category, other stores. */
  async getMoreInCategory(
    storeId: string,
    limit: number,
  ): Promise<{ categoryEn: string; categoryAr: string; products: ProductView[] }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { category: true },
    });
    if (!store) {
      throw ApiError.notFound('STORE_NOT_FOUND', `Store "${storeId}" not found`);
    }
    const products = await this.prisma.product.findMany({
      where: {
        categoryCode: store.categoryCode,
        storeId: { not: storeId },
        status: 'active',
      },
      include: PRODUCT_INCLUDE,
      orderBy: SORT_ORDERS.default,
      take: limit,
    });
    return {
      categoryEn: store.category.code,
      categoryAr: store.category.nameAr,
      products: products.map(toProductView),
    };
  }

  /** GET /storefront/stores/:storeId/ads — store banners. */
  async getStoreAds(storeId: string): Promise<{ ads: AdView[] }> {
    await this.assertStore(storeId);
    const ads = await this.prisma.ad.findMany({
      where: { placement: 'store', storeId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { ads: ads.map(toAdView) };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Builds the Prisma `where` for the shared product filters. */
  private productWhere(query: {
    search?: string;
    priceMin?: number;
    priceMax?: number;
    stores?: string[];
    categories?: string[];
    onlyDiscounted?: boolean;
    onlyNew?: boolean;
    minRating?: number;
  }): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { status: 'active' };

    if (query.search) {
      where.OR = [
        { nameEn: { contains: query.search } },
        { nameAr: { contains: query.search } },
      ];
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.price = {
        ...(query.priceMin !== undefined ? { gte: query.priceMin } : {}),
        ...(query.priceMax !== undefined ? { lte: query.priceMax } : {}),
      };
    }
    if (query.stores?.length) where.storeId = { in: query.stores };
    if (query.categories?.length) where.categoryCode = { in: query.categories };
    if (query.onlyDiscounted) where.originalPrice = { not: null };
    if (query.onlyNew) where.isNew = true;
    if (query.minRating) where.rating = { gte: query.minRating };
    return where;
  }

  /** Resolves related categories with product counts (customer contract map). */
  private async relatedCategories(categoryEn: string) {
    const related = RELATED_CATEGORIES[categoryEn] ?? [];
    if (related.length === 0) return [];

    const [categories, groups] = await Promise.all([
      this.prisma.platformCategory.findMany({
        where: { code: { in: related } },
        select: { code: true, nameAr: true },
      }),
      this.prisma.product.groupBy({
        by: ['categoryCode'],
        where: { categoryCode: { in: related }, status: 'active' },
        _count: true,
      }),
    ]);

    const counts = new Map(groups.map((g) => [g.categoryCode, g._count]));
    const byCode = new Map(categories.map((c) => [c.code, c]));
    return related
      .filter((code) => byCode.has(code))
      .map((code) => ({
        nameEn: code,
        nameAr: byCode.get(code)!.nameAr,
        productCount: counts.get(code) ?? 0,
      }));
  }

  private async assertCategory(categoryEn: string): Promise<void> {
    const category = await this.prisma.platformCategory.findUnique({
      where: { code: categoryEn },
      select: { code: true },
    });
    if (!category) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', `Category "${categoryEn}" not found`);
    }
  }

  private async assertStore(storeId: string): Promise<void> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });
    if (!store) {
      throw ApiError.notFound('STORE_NOT_FOUND', `Store "${storeId}" not found`);
    }
  }
}
