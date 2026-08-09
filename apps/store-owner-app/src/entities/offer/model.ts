/**
 * Offer entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). An offer applies a discount to a product, a
 * category, or a customer segment
 * (`GET/POST /api/store-owner/offers`, `PUT /api/store-owner/offers/{id}`).
 */
export interface Offer {
  id: string;
  nameEn: string;
  nameAr: string;
  type: 'product' | 'category' | 'segment';
  targetId: string;
  targetNameEn: string;
  targetNameAr: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
