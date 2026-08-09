/**
 * Unit tests for the settings mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_STORE_SETTINGS, getStoreSettings, updateStoreSettings } from './api';

describe('store-owner settings mock API', () => {
  it('defaults are bilingual and complete', () => {
    expect(DEFAULT_STORE_SETTINGS.storeNameEn).toBeTruthy();
    expect(DEFAULT_STORE_SETTINGS.storeNameAr).toBeTruthy();
    expect(DEFAULT_STORE_SETTINGS.acceptedCurrencies.length).toBeGreaterThan(0);
    expect(DEFAULT_STORE_SETTINGS.taxRate).toBeGreaterThan(0);
  });

  it('getStoreSettings resolves the defaults', async () => {
    expect(await getStoreSettings()).toEqual(DEFAULT_STORE_SETTINGS);
  });

  it('updateStoreSettings merges partial updates', async () => {
    const updated = await updateStoreSettings({ deliveryFee: 30, taxRate: 18 });
    expect(updated.deliveryFee).toBe(30);
    expect(updated.taxRate).toBe(18);
    expect(updated.storeNameEn).toBe(DEFAULT_STORE_SETTINGS.storeNameEn);
  });
});
