/**
 * Product entity — domain model (back office).
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup. The back office only needs the store product catalogue for stock
 * checks while fulfilling orders
 * (`GET /api/store-owner/products/{id}/stock`). Only the relevant subset of the
 * store-owner model is carried here (see `REFACTOR_PLAN.md` §6 — no cross-role
 * duplication beyond what each app references).
 */
export interface PriceEntry {
  currency: string;
  amount: number;
  date: string;
}

export interface CurrencyPrice {
  currency: string;
  amount: number;
}

export interface StoreProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionEn2?: string;
  descriptionAr2?: string;
  images: string[];
  price: number;
  currencyPrices: CurrencyPrice[];
  priceHistory: PriceEntry[];
  stock: number;
  categoryId: string;
  categoryEn: string;
  categoryAr: string;
  image: string;
  barcode?: string;
  sku?: string;
}
