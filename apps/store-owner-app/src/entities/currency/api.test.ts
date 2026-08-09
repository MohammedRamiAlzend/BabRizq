/**
 * Unit tests for the currency reference data (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { CURRENCIES, getCurrencies } from './api';

describe('store-owner currency API', () => {
  it('exposes a list of supported currencies with bilingual names', () => {
    expect(CURRENCIES.length).toBeGreaterThan(0);
    for (const c of CURRENCIES) {
      expect(c.code).toMatch(/^[A-Z]{3}$/);
      expect(c.nameEn).toBeTruthy();
      expect(c.nameAr).toBeTruthy();
      expect(c.symbol).toBeTruthy();
    }
    // SAR must always be present (default store currency)
    expect(CURRENCIES.some(c => c.code === 'SAR')).toBe(true);
  });

  it('getCurrencies resolves the reference list', async () => {
    expect(await getCurrencies()).toEqual(CURRENCIES);
  });
});
