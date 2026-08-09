/**
 * Category entity — mock API.
 *
 * Simulates the store-owner category endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/POST /api/store-owner/categories`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { StoreCategory } from './model';
import { api, unwrapList } from '@/shared/lib/api';

/** In-memory categories. TODO(migration): replaced by `GET /api/store-owner/categories`. */
export const STORE_CATEGORIES: StoreCategory[] = [
  { id: 'cat1', nameEn: 'Electronics', nameAr: 'إلكترونيات', iconOrEmoji: '📱', productsCount: 2 },
  { id: 'cat2', nameEn: 'Accessories', nameAr: 'إكسسوارات', iconOrEmoji: '👜', productsCount: 2 },
  { id: 'cat3', nameEn: 'Watches', nameAr: 'ساعات', iconOrEmoji: '⌚', productsCount: 1 },
  { id: 'cat4', nameEn: 'Shoes', nameAr: 'أحذية', iconOrEmoji: '👟', productsCount: 1 },
  { id: 'cat5', nameEn: 'Perfumes', nameAr: 'عطور', iconOrEmoji: '🌹', productsCount: 1 },
  { id: 'cat6', nameEn: 'Fashion', nameAr: 'أزياء', iconOrEmoji: '👗', productsCount: 1 },
];

/** Backend `StoreCategoryView` shape (store `categories.md`) — DTO boundary. */
interface StoreCategoryDto {
  id: string;
  nameEn: string;
  nameAr: string;
  iconOrEmoji: string;
  productsCount: number;
}

/** Maps the backend view onto the frontend `StoreCategory` model. */
function toStoreCategory(dto: StoreCategoryDto): StoreCategory {
  return {
    id: dto.id,
    nameEn: dto.nameEn,
    nameAr: dto.nameAr,
    iconOrEmoji: dto.iconOrEmoji,
    productsCount: dto.productsCount,
  };
}

/** GET /store/categories — the store owner's categories (X-Store-Id scoped). */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  const data = await api.get<StoreCategoryDto[] | { items: StoreCategoryDto[] }>('/store/categories', {
    page: 1,
    pageSize: 100,
  });
  return unwrapList(data).map(toStoreCategory);
}

/** POST /store/categories — create a category for the authenticated store. */
export async function createStoreCategory(
  input: Omit<StoreCategory, 'id' | 'productsCount'>
): Promise<StoreCategory> {
  const dto = await api.post<StoreCategoryDto>('/store/categories', {
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    emoji: input.iconOrEmoji,
  });
  return toStoreCategory(dto);
}
