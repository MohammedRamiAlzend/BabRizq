/**
 * Unit tests for the category mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { STORE_CATEGORIES, getStoreCategories, createStoreCategory } from './api';
import { STORE_PRODUCTS } from '../product/api';

describe('store-owner category mock API', () => {
  it('exposes categories with bilingual names and emoji icons', () => {
    expect(STORE_CATEGORIES.length).toBeGreaterThan(0);
    for (const cat of STORE_CATEGORIES) {
      expect(cat.nameEn).toBeTruthy();
      expect(cat.nameAr).toBeTruthy();
      expect(cat.iconOrEmoji).toBeTruthy();
    }
  });

  it('every product points at an existing category', () => {
    const categoryIds = new Set(STORE_CATEGORIES.map(c => c.id));
    for (const p of STORE_PRODUCTS) {
      expect(categoryIds.has(p.categoryId)).toBe(true);
    }
  });

  it('getStoreCategories resolves the seed data', async () => {
    expect(await getStoreCategories()).toEqual(STORE_CATEGORIES);
  });

  it('createStoreCategory starts with zero products', async () => {
    const created = await createStoreCategory({
      nameEn: 'New Cat', nameAr: 'تصنيف جديد', iconOrEmoji: '📦',
    });
    expect(created.productsCount).toBe(0);
    expect(STORE_CATEGORIES.some(c => c.id === created.id)).toBe(true);
  });
});
