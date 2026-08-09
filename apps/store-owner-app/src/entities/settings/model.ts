/**
 * Settings entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Store settings configure the store owner's
 * public storefront, notifications, shipping and tax
 * (`GET/PUT /api/store-owner/settings`).
 */
export interface StoreSettings {
  storeNameEn: string;
  storeNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logoUrl: string;
  contactEmail: string;
  phone: string;
  address: string;
  acceptedCurrencies: string[];
  paymentMethods: string[];
  lowStockThreshold: number;
  notifyLowStock: boolean;
  notifyNewOrder: boolean;
  deliveryFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: number;
  taxRate: number;
}
