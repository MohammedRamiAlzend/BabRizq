/**
 * Unit tests for the category mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { STORE_SPECIFIC_CATEGORIES, RELATED_CATEGORIES } from './model';
import { getStoreCategories, getRelatedCategories, getPlatformCategories } from './api';

describe('category mock API', () => {
  it('exposes store-specific categories for stores that define them', () => {
    expect(STORE_SPECIFIC_CATEGORIES.techzone.length).toBeGreaterThan(0);
    for (const categories of Object.values(STORE_SPECIFIC_CATEGORIES)) {
      for (const cat of categories) {
        expect(cat.id).toBeTruthy();
        expect(cat.storeId).toBeTruthy();
        expect(cat.nameEn).toBeTruthy();
        expect(cat.nameAr).toBeTruthy();
      }
    }
  });

  it('getStoreCategories returns [] for a store without categories', async () => {
    expect(await getStoreCategories('unknown-store')).toEqual([]);
    expect((await getStoreCategories('techzone')).length).toBeGreaterThan(0);
  });

  it('getRelatedCategories returns the thematic overlaps for a category', async () => {
    expect(await getRelatedCategories('Watches')).toEqual(['Electronics', 'Accessories']);
    expect(await getRelatedCategories('unknown')).toEqual([]);
  });

  it('getPlatformCategories returns every platform category exactly once', async () => {
    const cats = await getPlatformCategories();
    expect(cats).toEqual(Object.keys(RELATED_CATEGORIES));
    expect(new Set(cats).size).toBe(cats.length);
  });

  it('every related-category link points at another platform category', () => {
    const platform = new Set(Object.keys(RELATED_CATEGORIES));
    for (const related of Object.values(RELATED_CATEGORIES)) {
      for (const cat of related) {
        expect(platform.has(cat)).toBe(true);
      }
    }
  });
});
