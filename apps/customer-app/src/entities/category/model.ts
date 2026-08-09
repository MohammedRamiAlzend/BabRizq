/**
 * Category entity — domain model.
 *
 * Extracted from the legacy monolith's `entities/products.ts` during the Phase 2
 * cleanup. Models the two-level category system of the marketplace:
 *
 *   • Platform categories (e.g. Electronics, Perfumes) — controlled by the
 *     platform admin; shared across all stores. Thematic overlap between them
 *     drives the "Explore Related Categories" widget (`RELATED_CATEGORIES`).
 *   • Store-specific categories — controlled by each store owner; only visible
 *     within that store's catalog (`STORE_SPECIFIC_CATEGORIES`).
 */
export interface StoreSpecificCategory {
  id: string;
  storeId: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
}

/**
 * Categories that share thematic overlap — drives "Explore Related Categories"
 * on the dedicated category page.
 */
export const RELATED_CATEGORIES: Record<string, string[]> = {
  Electronics: ['Watches'],
  Watches: ['Electronics', 'Accessories'],
  Accessories: ['Fashion', 'Shoes'],
  Shoes: ['Fashion', 'Accessories'],
  Perfumes: ['Accessories'],
  Fashion: ['Shoes', 'Accessories'],
};

/** Store-specific categories, keyed by store id. */
export const STORE_SPECIFIC_CATEGORIES: Record<string, StoreSpecificCategory[]> = {
  techzone: [
    { id: 'tc-phones',    storeId: 'techzone',      nameEn: 'Smartphones',  nameAr: 'هواتف ذكية',                  emoji: '📱' },
    { id: 'tc-audio',     storeId: 'techzone',      nameEn: 'Audio & Sound', nameAr: 'صوت وسماعات',                emoji: '🎧' },
    { id: 'tc-wearables', storeId: 'techzone',      nameEn: 'Wearables',    nameAr: 'أجهزة قابلة للارتداء',        emoji: '⌚' },
  ],
  'leather-house': [
    { id: 'lh-bags',    storeId: 'leather-house', nameEn: 'Bags & Totes', nameAr: 'حقائب',   emoji: '👜' },
    { id: 'lh-wallets', storeId: 'leather-house', nameEn: 'Wallets',      nameAr: 'محافظ',   emoji: '👛' },
  ],
  'time-gallery': [
    { id: 'tg-gold',   storeId: 'time-gallery', nameEn: 'Gold Collection',   nameAr: 'المجموعة الذهبية', emoji: '🥇' },
    { id: 'tg-silver', storeId: 'time-gallery', nameEn: 'Silver Collection', nameAr: 'المجموعة الفضية',  emoji: '🥈' },
  ],
  'optic-style': [
    { id: 'os-sun', storeId: 'optic-style', nameEn: 'Sunglasses', nameAr: 'نظارات شمسية', emoji: '🕶️' },
  ],
  'step-up': [
    { id: 'su-casual', storeId: 'step-up', nameEn: 'Casual & Sneakers', nameAr: 'كاجوال ورياضي', emoji: '👟' },
    { id: 'su-formal', storeId: 'step-up', nameEn: 'Formal',            nameAr: 'رسمي',          emoji: '👞' },
    { id: 'su-sport',  storeId: 'step-up', nameEn: 'Sport & Running',   nameAr: 'رياضة وجري',   emoji: '🏃' },
  ],
  'scent-palace': [
    { id: 'sp-mens',   storeId: 'scent-palace', nameEn: "Men's Perfumes",    nameAr: 'عطور رجالية', emoji: '🧴' },
    { id: 'sp-womens', storeId: 'scent-palace', nameEn: "Women's Perfumes",  nameAr: 'عطور نسائية', emoji: '🌸' },
    { id: 'sp-kids',   storeId: 'scent-palace', nameEn: "Kids' Fragrances",  nameAr: 'عطور أطفال', emoji: '🧒' },
  ],
  'cozy-corner': [
    { id: 'cc-winter', storeId: 'cozy-corner', nameEn: 'Winter Collection', nameAr: 'مجموعة شتوية',  emoji: '🧣' },
    { id: 'cc-casual', storeId: 'cozy-corner', nameEn: 'Casual Wear',       nameAr: 'ملابس كاجوال', emoji: '👕' },
  ],
};
