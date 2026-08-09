/**
 * Category entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup. A store category is managed by the store owner and organises their
 * products (`GET/POST /api/store-owner/categories`).
 */
export interface StoreCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  iconOrEmoji: string;
  productsCount: number;
}
