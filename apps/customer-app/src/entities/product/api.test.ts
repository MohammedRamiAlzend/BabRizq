/**
 * Unit tests for the product mock API (`./api.ts`).
 * These pin the catalogue contract the storefront UI relies on — when the
 * backend lands, the real API must satisfy the same invariants.
 */
import { describe, it, expect } from 'vitest';
import {
  MOCK_PRODUCTS,
  getProductById,
  getProductsByCategory,
  getProductsByStore,
  searchProducts,
  getRecommendedProducts,
} from './api';

describe('product mock API', () => {
  it('exposes a non-empty bilingual catalogue', () => {
    expect(MOCK_PRODUCTS.length).toBeGreaterThan(0);
    for (const p of MOCK_PRODUCTS) {
      expect(p.nameEn).toBeTruthy();
      expect(p.nameAr).toBeTruthy();
    }
  });

  it('getProductsByCategory returns only products of that platform category', async () => {
    const electronics = await getProductsByCategory('Electronics');
    expect(electronics.length).toBeGreaterThan(0);
    expect(electronics.every(p => p.categoryEn === 'Electronics')).toBe(true);
  });

  it('getProductsByStore returns only products of that store', async () => {
    const techzone = await getProductsByStore('techzone');
    expect(techzone.length).toBeGreaterThan(0);
    expect(techzone.every(p => p.storeId === 'techzone')).toBe(true);
  });

  it('getProductById resolves the requested product or null', async () => {
    expect((await getProductById('1'))?.id).toBe('1');
    expect(await getProductById('does-not-exist')).toBeNull();
  });

  it('searchProducts matches names and tags, case-insensitively', async () => {
    const byName = await searchProducts('HEADPHONES');
    expect(byName.some(p => p.id === '1')).toBe(true);

    const byTag = await searchProducts('oud');
    expect(byTag.length).toBeGreaterThan(0);
    expect(byTag.every(p => p.tags.includes('oud'))).toBe(true);
  });

  it('searchProducts with an empty query returns the full catalogue', async () => {
    expect((await searchProducts('   ')).length).toBe(MOCK_PRODUCTS.length);
  });

  it('getRecommendedProducts ranks interest categories first and caps at 6', async () => {
    const recs = await getRecommendedProducts(['Perfumes']);
    expect(recs.length).toBeLessThanOrEqual(6);
    expect(recs.length).toBeGreaterThan(0);
    // Perfume-category products must be ranked before any non-Perfume product
    const firstNonPerfume = recs.findIndex(p => p.categoryEn !== 'Perfumes');
    const lastPerfume = recs.map(p => p.categoryEn).lastIndexOf('Perfumes');
    expect(lastPerfume).toBeGreaterThanOrEqual(0);
    expect(firstNonPerfume === -1 || lastPerfume < firstNonPerfume).toBe(true);
  });
});
