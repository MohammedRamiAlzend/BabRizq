/**
 * Storefront mapper — converts Prisma records into the exact shapes the
 * customer app's `_shared.md` contract defines (`Product`, `Store`, `Ad`).
 */
import { Ad, PlatformCategory, Product, ProductTag, Store } from '@prisma/client';

/** Product with the relations the catalog queries always load. */
export type ProductWithRelations = Product & {
  store: Store;
  category: PlatformCategory;
  tags: ProductTag[];
};

/** Frontend `Product` shape (customer `_shared.md`). */
export interface ProductView {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  descriptionEn: string;
  descriptionAr: string;
  storeId: string;
  storeNameEn: string;
  storeNameAr: string;
  imageUrl: string;
  categoryEn: string;
  categoryAr: string;
  storeCategoryId?: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

/** Frontend `Store` shape. */
export interface StoreView {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  descriptionEn: string;
  descriptionAr: string;
  categoryEn: string;
  categoryAr: string;
}

/** Frontend `Ad` shape. */
export interface AdView {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;
  ctaAr: string;
  emoji: string;
  gradient: string;
  linkType?: 'category' | 'store';
  linkValue?: string;
}

export function toProductView(product: ProductWithRelations): ProductView {
  const view: ProductView = {
    id: product.id,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    price: product.price,
    descriptionEn: product.descriptionEn ?? '',
    descriptionAr: product.descriptionAr ?? '',
    storeId: product.store.id,
    storeNameEn: product.store.nameEn,
    storeNameAr: product.store.nameAr,
    imageUrl: product.imageUrl ?? '',
    categoryEn: product.category.code,
    categoryAr: product.category.nameAr,
    tags: product.tags.map((tag) => tag.value),
    rating: product.rating,
    reviewCount: product.reviewCount,
  };

  // Optional fields are omitted when absent (the client relies on undefined).
  if (product.originalPrice !== null && product.originalPrice !== undefined) {
    view.originalPrice = product.originalPrice;
  }
  if (product.storeCategoryId) view.storeCategoryId = product.storeCategoryId;
  if (product.isNew) view.isNew = true;
  if (product.isFeatured) view.isFeatured = true;
  return view;
}

export function toStoreView(
  store: Store & { category?: PlatformCategory },
): StoreView {
  return {
    id: store.id,
    nameEn: store.nameEn,
    nameAr: store.nameAr,
    emoji: store.emoji,
    descriptionEn: store.descriptionEn ?? '',
    descriptionAr: store.descriptionAr ?? '',
    categoryEn: store.category?.code ?? '',
    categoryAr: store.category?.nameAr ?? '',
  };
}

export function toAdView(ad: Ad): AdView {
  return {
    id: ad.id,
    titleEn: ad.titleEn,
    titleAr: ad.titleAr,
    subtitleEn: ad.subtitleEn ?? '',
    subtitleAr: ad.subtitleAr ?? '',
    ctaEn: ad.ctaEn ?? '',
    ctaAr: ad.ctaAr ?? '',
    emoji: ad.emoji,
    gradient: ad.gradient,
    linkType: (ad.linkType as 'category' | 'store' | undefined) ?? undefined,
    linkValue: ad.linkValue ?? undefined,
  };
}
