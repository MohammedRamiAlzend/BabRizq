/**
 * Order entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A store order is a customer order placed with
 * the store owner, with a lifecycle driven by `status`
 * (`GET /api/store-owner/orders?status=`, `PUT /api/store-owner/orders/{id}/status`).
 */
export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerNameEn: string;
  customerNameAr: string;
  customerAddress?: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}
