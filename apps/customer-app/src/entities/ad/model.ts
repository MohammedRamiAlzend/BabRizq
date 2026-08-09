/**
 * Ad entity — domain model.
 *
 * Extracted from the legacy monolith's `entities/products.ts` during the Phase 2
 * cleanup. An ad is a promotional banner rendered in the storefront carousels:
 * the home page carousel (`MOCK_ADS`), per-store carousels (`STORE_ADS`) and
 * per-category carousels (`CATEGORY_ADS`).
 */
export interface Ad {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;
  ctaAr: string;
  emoji: string;
  /** Tailwind gradient utility applied to the card background */
  gradient: string;
  /** Optional navigation target when the user clicks the ad */
  linkType?: 'category' | 'store';
  linkValue?: string;
}
