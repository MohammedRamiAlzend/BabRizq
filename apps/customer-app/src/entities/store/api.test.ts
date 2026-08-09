/**
 * Unit tests for the store mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { MOCK_STORES, getStoreById, getStoresByCategory } from './api';
import { MOCK_PRODUCTS } from '../product/api';

describe('store mock API', () => {
  it('exposes a non-empty bilingual store directory', () => {
    expect(MOCK_STORES.length).toBeGreaterThan(0);
    for (const s of MOCK_STORES) {
      expect(s.nameEn).toBeTruthy();
      expect(s.nameAr).toBeTruthy();
      expect(s.emoji).toBeTruthy();
    }
  });

  it('getStoreById resolves the requested store or null', async () => {
    expect((await getStoreById('techzone'))?.id).toBe('techzone');
    expect(await getStoreById('does-not-exist')).toBeNull();
  });

  it('getStoresByCategory returns only stores of that platform category', async () => {
    const accessories = await getStoresByCategory('Accessories');
    expect(accessories.length).toBeGreaterThan(0);
    expect(accessories.every(s => s.categoryEn === 'Accessories')).toBe(true);
  });

  it('every store has products in the catalogue (no orphan stores)', () => {
    // Mirrors the storefront's product-count badge invariant
    for (const s of MOCK_STORES) {
      expect(MOCK_PRODUCTS.some(p => p.storeId === s.id)).toBe(true);
    }
  });
});
