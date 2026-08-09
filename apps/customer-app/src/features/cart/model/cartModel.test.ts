/**
 * Unit tests for the pure cart domain logic (see `./cartModel.ts`).
 * No React involved — the context is a thin wrapper over these functions.
 */
import { describe, it, expect } from 'vitest';
import type { Product } from '~/entities/product';
import { addItem, removeItem, updateQuantity, cartTotals, CartItem } from './cartModel';

/** Minimal product fixture — only the fields cartModel reads are meaningful. */
function makeProduct(id: string, price: number): Product {
  return {
    id,
    nameEn: `Product ${id}`,
    nameAr: `منتج ${id}`,
    price,
    descriptionEn: '',
    descriptionAr: '',
    storeId: 's1',
    storeNameEn: 'Store',
    storeNameAr: 'متجر',
    image: '',
    categoryEn: 'Cat',
    categoryAr: 'فئة',
    storeCategoryId: 'c1',
    tags: [],
    rating: 0,
    reviewCount: 0,
  };
}

function line(id: string, price: number, quantity: number): CartItem {
  return { product: makeProduct(id, price), quantity };
}

describe('addItem', () => {
  it('adds a new product with quantity 1', () => {
    const items = addItem([], makeProduct('p1', 100));
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ product: expect.objectContaining({ id: 'p1' }), quantity: 1 });
  });

  it('increments quantity when the same product is added again', () => {
    const product = makeProduct('p1', 100);
    const once = addItem([], product);
    const twice = addItem(once, product);
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(2);
  });

  it('is immutable — the original array is not mutated', () => {
    const original = [line('p1', 100, 1)];
    const updated = addItem(original, makeProduct('p2', 50));
    expect(original).toHaveLength(1);
    expect(updated).toHaveLength(2);
  });
});

describe('removeItem', () => {
  it('removes the matching product line only', () => {
    const items = [line('p1', 100, 2), line('p2', 50, 1)];
    expect(removeItem(items, 'p1')).toEqual([expect.objectContaining({ quantity: 1 })]);
  });

  it('is a no-op for unknown product ids', () => {
    const items = [line('p1', 100, 1)];
    expect(removeItem(items, 'nope')).toHaveLength(1);
  });
});

describe('updateQuantity', () => {
  it('sets the quantity of the matching line', () => {
    const items = [line('p1', 100, 2)];
    expect(updateQuantity(items, 'p1', 5)[0].quantity).toBe(5);
  });

  it('removes the line when quantity drops to zero or below', () => {
    const items = [line('p1', 100, 2)];
    expect(updateQuantity(items, 'p1', 0)).toHaveLength(0);
    expect(updateQuantity(items, 'p1', -3)).toHaveLength(0);
  });
});

describe('cartTotals', () => {
  it('sums quantities and prices across lines', () => {
    const items = [line('p1', 100, 2), line('p2', 50, 1)];
    expect(cartTotals(items)).toEqual({ totalItems: 3, totalPrice: 250 });
  });

  it('returns zero totals for an empty cart', () => {
    expect(cartTotals([])).toEqual({ totalItems: 0, totalPrice: 0 });
  });
});
