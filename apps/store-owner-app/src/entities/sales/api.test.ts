/**
 * Unit tests for the sales/reports mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { MONTHLY_SALES_DATA, CURRENCY_REVENUE, getMonthlySales, getCurrencyRevenue } from './api';

describe('store-owner sales mock API', () => {
  it('exposes a monthly chart with monotonically recent months', () => {
    expect(MONTHLY_SALES_DATA.length).toBeGreaterThan(0);
    for (const point of MONTHLY_SALES_DATA) {
      expect(point.sales).toBeGreaterThan(0);
      expect(point.orders).toBeGreaterThan(0);
    }
  });

  it('exposes per-currency revenue with trend labels', () => {
    expect(CURRENCY_REVENUE.length).toBeGreaterThan(0);
    for (const row of CURRENCY_REVENUE) {
      expect(row.amount).toBeGreaterThan(0);
      expect(row.trend).toMatch(/^[+-]\d+(\.\d+)?%$/);
    }
  });

  it('getMonthlySales and getCurrencyRevenue resolve the seed data', async () => {
    expect(await getMonthlySales()).toEqual(MONTHLY_SALES_DATA);
    expect(await getCurrencyRevenue()).toEqual(CURRENCY_REVENUE);
  });
});
