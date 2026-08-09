/**
 * Accounting entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Models store expenses and invoices
 * (`GET/POST /api/store-owner/accounting/…`).
 */
export interface Expense {
  id: string;
  titleEn: string;
  titleAr: string;
  category: 'rent' | 'salary' | 'marketing' | 'shipping' | 'utilities' | 'other';
  amount: number;
  currency: string;
  date: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerNameEn: string;
  customerNameAr: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  date: string;
  status: 'paid' | 'unpaid' | 'cancelled';
}
