/**
 * Product entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A store product belongs to one store category
 * and supports multi-currency pricing plus a price history
 * (`GET/POST /api/store-owner/products`, `PUT/DELETE /api/store-owner/products/{id}`).
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
