/**
 * Sales entity — mock API.
 *
 * Simulates the sales/report endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET /api/store-owner/sales` · `GET /api/store-owner/reports/summary`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { MonthlySalesPoint, CurrencyRevenue } from './model';

/** Monthly sales/orders chart. TODO(migration): replaced by `GET /api/store-owner/sales`. */
export const MONTHLY_SALES_DATA: MonthlySalesPoint[] = [
  { month: 'Oct', monthAr: 'أكتوبر', sales: 12400, orders: 82 },
  { month: 'Nov', monthAr: 'نوفمبر', sales: 18200, orders: 110 },
  { month: 'Dec', monthAr: 'ديسمبر', sales: 22600, orders: 145 },
  { month: 'Jan', monthAr: 'يناير', sales: 15800, orders: 98 },
  { month: 'Feb', monthAr: 'فبراير', sales: 19400, orders: 124 },
  { month: 'Mar', monthAr: 'مارس', sales: 21200, orders: 136 },
  { month: 'Apr', monthAr: 'أبريل', sales: 24580, orders: 156 },
];

/** Revenue split by currency. TODO(migration): replaced by `GET /api/store-owner/reports/summary`. */
export const CURRENCY_REVENUE: CurrencyRevenue[] = [
  { currency: 'SAR', symbol: 'ر.س', amount: 24580, trend: '+12.5%' },
  { currency: 'USD', symbol: '$', amount: 6554, trend: '+8.2%' },
  { currency: 'AED', symbol: 'د.إ', amount: 9052, trend: '+15.1%' },
  { currency: 'SYP', symbol: 'ل.س', amount: 16400000, trend: '+5.8%' },
];

/** Simulates `GET /api/store-owner/sales`. */
export async function getMonthlySales(): Promise<MonthlySalesPoint[]> {
  return new Promise(resolve => setTimeout(() => resolve(MONTHLY_SALES_DATA), 100));
}

/** Simulates `GET /api/store-owner/reports/summary`. */
export async function getCurrencyRevenue(): Promise<CurrencyRevenue[]> {
  return new Promise(resolve => setTimeout(() => resolve(CURRENCY_REVENUE), 100));
}
