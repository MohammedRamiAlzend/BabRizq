/**
 * Storefront constants — static reference data the catalog endpoints need.
 *
 * - `TAG_LABELS`: human-readable labels for product-tag slugs ("Browse by
 *   Topic" groups). Mirrors the client map in `CategoryCatalogPage.tsx`.
 * - `RELATED_CATEGORIES`: the "You Might Also Like" mapping from the
 *   customer `_shared.md` endpoint contract.
 * - `SORT_ORDERS`: maps the frontend `sortBy` values to Prisma orderBy.
 */
import { Prisma } from '@prisma/client';

export const TAG_LABELS: Record<string, { labelEn: string; labelAr: string }> = {
  wireless: { labelEn: 'Wireless & Bluetooth', labelAr: 'لاسلكي وبلوتوث' },
  audio: { labelEn: 'Audio & Sound', labelAr: 'صوت وسماعات' },
  flagship: { labelEn: 'Flagship Phones', labelAr: 'هواتف رائدة' },
  wearable: { labelEn: 'Wearables & Smartwatches', labelAr: 'ساعات ذكية وإكسسوارات' },
  leather: { labelEn: 'Leather Collection', labelAr: 'مجموعة الجلد' },
  'arabic-fragrance': { labelEn: 'Arabic Fragrances', labelAr: 'عطور عربية' },
  oud: { labelEn: 'Oud & Oriental', labelAr: 'عود وعطور شرقية' },
  sneakers: { labelEn: 'Sneakers', labelAr: 'أحذية رياضية' },
  knitwear: { labelEn: 'Knitwear & Wool', labelAr: 'تريكو وصوف' },
};

/** Fallback label for unknown tags: "Wireless" → "Wireless". */
export function tagLabel(tag: string): { labelEn: string; labelAr: string } {
  const known = TAG_LABELS[tag];
  if (known) return known;
  const pretty = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');
  return { labelEn: pretty, labelAr: pretty };
}

/** Related categories map (customer `_shared.md`). */
export const RELATED_CATEGORIES: Record<string, string[]> = {
  Electronics: ['Watches'],
  Watches: ['Electronics', 'Accessories'],
  Accessories: ['Fashion', 'Shoes'],
  Shoes: ['Fashion', 'Accessories'],
  Perfumes: ['Accessories'],
  Fashion: ['Shoes', 'Accessories'],
};

export type SortBy = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

/** Maps the frontend `sortBy` values to Prisma order-by clauses. */
export const SORT_ORDERS: Record<SortBy, Prisma.ProductOrderByWithRelationInput[]> = {
  default: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
  rating: [{ rating: 'desc' }],
  newest: [{ createdAt: 'desc' }],
};

/**
 * Builds the "Browse by Topic" tag groups for a category catalog page.
 *
 * Rules (from the customer contract): include tags present in ≥ 2 products,
 * unless the category has fewer than 4 products total (then ≥ 1 qualifies);
 * sort by product count descending; cap at 5 groups.
 *
 * Pure function — kept here for unit-testability.
 */
export function buildTagGroups(
  products: { tags: string[] }[],
  maxGroups = 5,
): { tag: string; labelEn: string; labelAr: string; products: { tags: string[] }[] }[] {
  const byTag = new Map<string, { tags: string[] }[]>();
  for (const product of products) {
    for (const tag of product.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(product);
      byTag.set(tag, list);
    }
  }

  const minProducts = products.length < 4 ? 1 : 2;
  return [...byTag.entries()]
    .filter(([, group]) => group.length >= minProducts)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxGroups)
    .map(([tag, group]) => ({ tag, ...tagLabel(tag), products: group }));
}
