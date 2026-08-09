import { describe, expect, it } from 'vitest';
import { STORE_PRODUCTS, getProductStock } from './api';

describe('product API (back office)', () => {
  it('returns the stock level for a known product', async () => {
    const stock = await getProductStock('sp1');
    expect(stock).toBe(STORE_PRODUCTS[0].stock);
  });

  it('reports zero stock for out-of-stock products', async () => {
    const stock = await getProductStock('sp8');
    expect(stock).toBe(0);
  });

  it('rejects unknown products', async () => {
    await expect(getProductStock('nope')).rejects.toThrow('Product not found');
  });
});
