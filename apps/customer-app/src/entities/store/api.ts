/**
 * Store entity — mock API.
 *
 * Simulates the store endpoints from `docs/needed-endpoints-from-backend.md`
 * (`GET /api/stores`, `GET /api/stores/{id}`). Mock data is copied verbatim
 * from the legacy monolith.
 */
import { Store } from './model';

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

/** Simulates `GET /api/stores`. */
export async function getStores(): Promise<Store[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_STORES), 100));
}

/** Simulates `GET /api/stores/{id}`. */
export async function getStoreById(id: string): Promise<Store | null> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_STORES.find(s => s.id === id) || null), 100)
  );
}

/** Simulates `GET /api/stores?category={categoryEn}`. */
export async function getStoresByCategory(categoryEn: string): Promise<Store[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_STORES.filter(s => s.categoryEn === categoryEn)), 100)
  );
}
