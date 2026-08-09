import { describe, expect, it } from 'vitest';
import {
  ALL_ORDERS,
  assignDriverToOrder,
  getBackOfficeOrders,
  updateBackOfficeOrderStatus,
} from './api';

describe('order API (back office)', () => {
  it('returns the full order book', async () => {
    const orders = await getBackOfficeOrders();
    expect(orders).toHaveLength(ALL_ORDERS.length);
  });

  it('filters orders by status', async () => {
    const pending = await getBackOfficeOrders('pending');
    expect(pending.every(o => o.status === 'pending')).toBe(true);
    // Seed data contains at least two pending orders.
    expect(pending.length).toBeGreaterThanOrEqual(2);
  });

  it('updates an order status', async () => {
    const updated = await updateBackOfficeOrderStatus('fo2', 'delivered');
    expect(updated.id).toBe('fo2');
    expect(updated.status).toBe('delivered');
  });

  it('rejects status updates for unknown orders', async () => {
    await expect(updateBackOfficeOrderStatus('nope', 'delivered')).rejects.toThrow(
      'Order not found'
    );
  });

  it('assigns a driver and moves the order to assigned', async () => {
    const driver = { id: 'd9', nameEn: 'Test Driver', nameAr: 'سائق تجريبي' };
    const updated = await assignDriverToOrder('fo1', driver);
    expect(updated.assignedDriverId).toBe('d9');
    expect(updated.assignedDriverEn).toBe('Test Driver');
    expect(updated.assignedDriverAr).toBe('سائق تجريبي');
    expect(updated.status).toBe('assigned');
  });

  it('rejects driver assignment for unknown orders', async () => {
    const driver = { id: 'd9', nameEn: 'Test Driver', nameAr: 'سائق تجريبي' };
    await expect(assignDriverToOrder('nope', driver)).rejects.toThrow('Order not found');
  });
});
