/**
 * Unit tests for the store-owner order mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { STORE_ORDERS, getStoreOrders, updateOrderStatus } from './api';

describe('store-owner order mock API', () => {
  it('exposes a non-empty order book with valid statuses', () => {
    expect(STORE_ORDERS.length).toBeGreaterThan(0);
    const statuses = new Set(['pending', 'processing', 'shipped', 'delivered']);
    for (const o of STORE_ORDERS) {
      expect(statuses.has(o.status)).toBe(true);
      expect(o.total).toBeGreaterThan(0);
      expect(o.items.length).toBeGreaterThan(0);
    }
  });

  it('getStoreOrders filters by status when requested', async () => {
    const pending = await getStoreOrders('pending');
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every(o => o.status === 'pending')).toBe(true);
    expect((await getStoreOrders()).length).toBe(STORE_ORDERS.length);
  });

  it('updateOrderStatus transitions an order and rejects unknown ids', async () => {
    const updated = await updateOrderStatus('o1', 'shipped');
    expect(updated.status).toBe('shipped');
    expect(STORE_ORDERS.find(o => o.id === 'o1')?.status).toBe('shipped');
    await expect(updateOrderStatus('missing', 'delivered')).rejects.toThrow('Order not found');
  });
});
