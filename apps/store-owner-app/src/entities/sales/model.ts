/**
 * Sales entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). These shapes feed the sales/report charts
 * (`GET /api/store-owner/sales`, `GET /api/store-owner/reports/summary`) and
 * replace the previously-untyped legacy arrays.
 */
export interface MonthlySalesPoint {
  month: string;
  monthAr: string;
  sales: number;
  orders: number;
}

export interface CurrencyRevenue {
  currency: string;
  symbol: string;
  amount: number;
  trend: string;
}
