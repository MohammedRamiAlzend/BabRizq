/**
 * Warehouse entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Models suppliers and stock movements
 * (`GET/POST /api/store-owner/warehouse/…`).
 */
export interface Supplier {
  id: string;
  nameEn: string;
  nameAr: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productNameEn: string;
  productNameAr: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reasonAr: string;
  date: string;
  supplierId?: string;
  supplierNameEn?: string;
  supplierNameAr?: string;
  reference?: string;
}
