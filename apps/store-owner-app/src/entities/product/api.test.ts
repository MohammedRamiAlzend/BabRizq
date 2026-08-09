/**
 * Unit tests for the store-owner product mock API (`./api.ts`).
 * Pins the catalogue contract the Products/Warehouse pages rely on.
 */
import { describe, it, expect } from 'vitest';
import {
  STORE_PRODUCTS,
  getStoreProducts,
  getStoreProductById,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from './api';

describe('store-owner product mock API', () => {
  it('exposes a non-empty bilingual catalogue', () => {
    expect(STORE_PRODUCTS.length).toBeGreaterThan(0);
    for (const p of STORE_PRODUCTS) {
      expect(p.nameEn).toBeTruthy();
      expect(p.nameAr).toBeTruthy();
      expect(p.currencyPrices.length).toBeGreaterThan(0);
      expect(p.priceHistory.length).toBeGreaterThan(0);
    }
  });

  it('getStoreProducts resolves the full catalogue', async () => {
    expect(await getStoreProducts()).toEqual(STORE_PRODUCTS);
  });

  it('getStoreProductById resolves a product or null', async () => {
    expect((await getStoreProductById('sp1'))?.id).toBe('sp1');
    expect(await getStoreProductById('nope')).toBeNull();
  });

  it('createStoreProduct appends a new product with a fresh id', async () => {
    const before = STORE_PRODUCTS.length;
    const created = await createStoreProduct({
      nameEn: 'Test Product', nameAr: 'منتج تجريبي',
      descriptionEn: '', descriptionAr: '', images: [], image: '',
      price: 10, stock: 1, categoryId: 'cat1', categoryEn: 'Electronics', categoryAr: 'إلكترونيات',
      currencyPrices: [{ currency: 'SAR', amount: 10 }],
      priceHistory: [],
    });
    expect(created.id).toBeTruthy();
    expect(STORE_PRODUCTS.length).toBe(before + 1);
    expect(STORE_PRODUCTS.some(p => p.id === created.id)).toBe(true);
  });

  it('updateStoreProduct merges partial updates', async () => {
    const updated = await updateStoreProduct('sp1', { price: 250 });
    expect(updated.price).toBe(250);
    expect(updated.nameEn).toBe('Premium Wireless Headphones');
  });

  it('deleteStoreProduct removes the product and rejects for unknown ids', async () => {
    const target = STORE_PRODUCTS[STORE_PRODUCTS.length - 1];
    await deleteStoreProduct(target.id);
    expect(STORE_PRODUCTS.some(p => p.id === target.id)).toBe(false);
    await expect(deleteStoreProduct('missing')).rejects.toThrow('Product not found');
  });
});
