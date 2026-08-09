/**
 * Unit tests for the warehouse mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { STORE_SUPPLIERS, STOCK_MOVEMENTS, getSuppliers, getStockMovements, createSupplier } from './api';
import { STORE_PRODUCTS } from '../product/api';

describe('store-owner warehouse mock API', () => {
  it('exposes suppliers and stock movements', () => {
    expect(STORE_SUPPLIERS.length).toBeGreaterThan(0);
    expect(STOCK_MOVEMENTS.length).toBeGreaterThan(0);
  });

  it('every stock movement references an existing product', () => {
    const productIds = new Set(STORE_PRODUCTS.map(p => p.id));
    for (const m of STOCK_MOVEMENTS) {
      expect(productIds.has(m.productId)).toBe(true);
    }
  });

  it('getSuppliers and getStockMovements resolve the seed data', async () => {
    expect(await getSuppliers()).toEqual(STORE_SUPPLIERS);
    expect(await getStockMovements()).toEqual(STOCK_MOVEMENTS);
  });

  it('createSupplier appends with a fresh id', async () => {
    const before = STORE_SUPPLIERS.length;
    const supplier = await createSupplier({
      nameEn: 'Test Supplier', nameAr: 'مورد تجريبي',
      contactName: 'X', phone: '+966 5 000 0000',
      email: 'x@example.com', address: 'Riyadh',
    });
    expect(STORE_SUPPLIERS.length).toBe(before + 1);
    expect(supplier.productsSupplied).toBe(0);
  });
});
