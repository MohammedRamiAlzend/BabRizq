/**
 * Category entity — mock API.
 *
 * Simulates the category/catalog endpoints from
 * `docs/needed-endpoints-from-backend.md` (`category-catalog.md`,
 * `store-catalog.md`). Data lives in `./model.ts`; this file only exposes
 * fetch-ready selectors so pages never touch the raw maps directly.
 */
import { RELATED_CATEGORIES, STORE_SPECIFIC_CATEGORIES, StoreSpecificCategory } from './model';

/** Simulates `GET /api/stores/{storeId}/categories`. */
export async function getStoreCategories(storeId: string): Promise<StoreSpecificCategory[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(STORE_SPECIFIC_CATEGORIES[storeId] ?? []), 100)
  );
}

/**
 * Simulates `GET /api/categories/{categoryEn}/related`.
 * Returns the platform categories thematically linked to the given one.
 */
export async function getRelatedCategories(categoryEn: string): Promise<string[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(RELATED_CATEGORIES[categoryEn] ?? []), 100)
  );
}

/** Simulates `GET /api/categories`. The platform-level category list. */
export async function getPlatformCategories(): Promise<string[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(Object.keys(RELATED_CATEGORIES)), 100)
  );
}
