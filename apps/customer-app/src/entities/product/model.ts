/**
 * Product entity — domain model.
 *
 * Extracted from the legacy monolith's `entities/products.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Contains only the *shape* of a product as the
 * customer storefront understands it; mock data + fetch-ready functions live in
 * `./api.ts`.
 *
 * Two-level category system (documented in `docs/needed-endpoints-from-backend`):
 *   • Platform categories (e.g. Electronics, Perfumes) — controlled by the
 *     platform admin, shared across all stores (`categoryEn` / `categoryAr`).
 *   • Store-specific categories — controlled by each store owner, only visible
 *     within that store's catalog (`storeCategoryId`, see `entities/category`).
 */
export interface Product {
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
  image: string;
  /** Platform-level category (controlled by admin) */
  categoryEn: string;
  categoryAr: string;
  /** Store-specific category ID (controlled by store owner) */
  storeCategoryId: string;
  /** Sub-category hashtags used for "Related Topics" discovery */
  tags: string[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
}
