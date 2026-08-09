/**
 * Store entity — mock API.
 *
 * Simulates the store endpoints from `docs/needed-endpoints-from-backend.md`
 * (`GET /api/stores`, `GET /api/stores/{id}`). Mock data is copied verbatim
 * from the legacy monolith.
 */
import { Store } from './model';
import { api, ApiError } from '@/shared/lib/api';

/** In-memory store directory. TODO(migration): replaced by `GET /api/stores`. */
export const MOCK_STORES: Store[] = [
  {
    id: 'techzone',
    nameEn: 'TechZone',
    nameAr: 'تك زون',
    emoji: '⚡',
    descriptionEn: 'Latest gadgets & electronics',
    descriptionAr: 'أحدث الأجهزة والإلكترونيات',
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
  },
  {
    id: 'leather-house',
    nameEn: 'Leather House',
    nameAr: 'بيت الجلود',
    emoji: '👜',
    descriptionEn: 'Handcrafted leather goods',
    descriptionAr: 'منتجات جلدية مصنوعة يدوياً',
    categoryEn: 'Accessories',
    categoryAr: 'إكسسوارات',
  },
  {
    id: 'time-gallery',
    nameEn: 'Time Gallery',
    nameAr: 'معرض الوقت',
    emoji: '🕰️',
    descriptionEn: 'Luxury watches & timepieces',
    descriptionAr: 'ساعات فاخرة وأجهزة قياس الوقت',
    categoryEn: 'Watches',
    categoryAr: 'ساعات',
  },
  {
    id: 'optic-style',
    nameEn: 'Optic Style',
    nameAr: 'أوبتك ستايل',
    emoji: '🕶️',
    descriptionEn: 'Premium eyewear & sunglasses',
    descriptionAr: 'نظارات فاخرة وواقية من الشمس',
    categoryEn: 'Accessories',
    categoryAr: 'إكسسوارات',
  },
  {
    id: 'step-up',
    nameEn: 'Step Up',
    nameAr: 'ستيب أب',
    emoji: '👟',
    descriptionEn: 'Footwear for every occasion',
    descriptionAr: 'أحذية لكل مناسبة',
    categoryEn: 'Shoes',
    categoryAr: 'أحذية',
  },
  {
    id: 'scent-palace',
    nameEn: 'Scent Palace',
    nameAr: 'قصر العطور',
    emoji: '🌸',
    descriptionEn: 'Exquisite Arabian fragrances',
    descriptionAr: 'عطور عربية فاخرة',
    categoryEn: 'Perfumes',
    categoryAr: 'عطور',
  },
  {
    id: 'cozy-corner',
    nameEn: 'Cozy Corner',
    nameAr: 'الركن الدافئ',
    emoji: '🧣',
    descriptionEn: 'Cozy fashion & knitwear',
    descriptionAr: 'ملابس دافئة وأزياء مريحة',
    categoryEn: 'Fashion',
    categoryAr: 'أزياء',
  },
];

/** Backend `StoreView` shape (customer `_shared.md`) — DTO boundary. */
interface StoreDto {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  descriptionEn: string;
  descriptionAr: string;
  categoryEn: string;
  categoryAr: string;
  productCount?: number;
}

/** Maps the backend view onto the frontend `Store` model. */
function toStore(dto: StoreDto): Store {
  return {
    id: dto.id,
    nameEn: dto.nameEn,
    nameAr: dto.nameAr,
    emoji: dto.emoji,
    descriptionEn: dto.descriptionEn,
    descriptionAr: dto.descriptionAr,
    categoryEn: dto.categoryEn,
    categoryAr: dto.categoryAr,
  };
}

/** GET /storefront/stores — all stores (with product counts). */
export async function getStores(): Promise<Store[]> {
  const data = await api.get<{ stores: StoreDto[] }>('/storefront/stores');
  return data.stores.map(toStore);
}

/** GET /storefront/stores/:storeId — store detail (404 → null). */
export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const data = await api.get<StoreDto | { store: StoreDto }>(`/storefront/stores/${id}`);
    const dto = 'store' in data ? data.store : data;
    return toStore(dto);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /storefront/categories/:categoryEn/stores — stores selling in a category. */
export async function getStoresByCategory(categoryEn: string): Promise<Store[]> {
  const data = await api.get<{ stores: StoreDto[] }>(`/storefront/categories/${categoryEn}/stores`);
  return data.stores.map(toStore);
}
