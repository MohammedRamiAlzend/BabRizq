/**
 * Category entity — storefront API.
 *
 * Talks to the real backend (`/storefront/*`). The legacy mock selectors are
 * kept for `getStoreCategories` (the backend has no per-store category
 * endpoint yet — sub-categories are derived from products client-side) while
 * the platform-level category functions are wired to the storefront catalog.
 *
 * Legacy constants (`RELATED_CATEGORIES`, `STORE_SPECIFIC_CATEGORIES`) remain
 * the page-facing source of truth for now.
 */
import { RELATED_CATEGORIES, STORE_SPECIFIC_CATEGORIES, StoreSpecificCategory } from './model';
import { api } from '@/shared/lib/api';

/**
 * NOTE — kept as a mock: the backend exposes no per-store category endpoint.
 * Store sub-categories are derived from the store's products in a later phase.
 * TODO(migration): derive from `GET /storefront/stores/{storeId}/products`.
 */
export async function getStoreCategories(storeId: string): Promise<StoreSpecificCategory[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(STORE_SPECIFIC_CATEGORIES[storeId] ?? []), 100)
  );
}

/**
 * GET /storefront/categories/:categoryEn — reads the category catalog's
 * `relatedCategories` array (thematically linked platform categories).
 */
export async function getRelatedCategories(categoryEn: string): Promise<string[]> {
  const catalog = await api.get<{ relatedCategories: string[] }>(
    `/storefront/categories/${categoryEn}`,
    { page: 1, pageSize: 1 }
  );
  return catalog.relatedCategories ?? [];
}

/** GET /storefront/categories — the platform-level category list. */
export async function getPlatformCategories(): Promise<string[]> {
  const data = await api.get<{ categories: { nameEn: string; nameAr: string; hasDeals: boolean }[] }>(
    '/storefront/categories'
  );
  return data.categories.map(category => category.nameEn);
}
