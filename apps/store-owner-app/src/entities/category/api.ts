/**
 * Category entity — mock API.
 *
 * Simulates the store-owner category endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/POST /api/store-owner/categories`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { StoreCategory } from './model';

/** In-memory categories. TODO(migration): replaced by `GET /api/store-owner/categories`. */
export const STORE_CATEGORIES: StoreCategory[] = [
  { id: 'cat1', nameEn: 'Electronics', nameAr: 'إلكترونيات', iconOrEmoji: '📱', productsCount: 2 },
  { id: 'cat2', nameEn: 'Accessories', nameAr: 'إكسسوارات', iconOrEmoji: '👜', productsCount: 2 },
  { id: 'cat3', nameEn: 'Watches', nameAr: 'ساعات', iconOrEmoji: '⌚', productsCount: 1 },
  { id: 'cat4', nameEn: 'Shoes', nameAr: 'أحذية', iconOrEmoji: '👟', productsCount: 1 },
  { id: 'cat5', nameEn: 'Perfumes', nameAr: 'عطور', iconOrEmoji: '🌹', productsCount: 1 },
  { id: 'cat6', nameEn: 'Fashion', nameAr: 'أزياء', iconOrEmoji: '👗', productsCount: 1 },
];

/** Simulates `GET /api/store-owner/categories`. */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  return new Promise(resolve => setTimeout(() => resolve(STORE_CATEGORIES), 100));
}

/** Simulates `POST /api/store-owner/categories`. */
export async function createStoreCategory(
  input: Omit<StoreCategory, 'id' | 'productsCount'>
): Promise<StoreCategory> {
  return new Promise(resolve =>
    setTimeout(() => {
      const category: StoreCategory = {
        ...input,
        id: `cat${STORE_CATEGORIES.length + 1}`,
        productsCount: 0,
      };
      STORE_CATEGORIES.push(category);
      resolve(category);
    }, 100)
  );
}
