import { describe, expect, it } from 'vitest';
import {
  ALL_ORDERS,
  getDeliveryOrders,
  setOrderProofOfDelivery,
  updateDeliveryOrderStatus,
} from './api';

describe('order API (delivery)', () => {
  it('returns the full order book', async () => {
    const orders = await getDeliveryOrders();
    expect(orders).toHaveLength(ALL_ORDERS.length);
  });

  it('filters orders by status', async () => {
    const pending = await getDeliveryOrders('pending');
    expect(pending.every(o => o.status === 'pending')).toBe(true);
    expect(pending.length).toBeGreaterThanOrEqual(2);
  });

  it('updates an order status', async () => {
    const updated = await updateDeliveryOrderStatus('fo2', 'in_transit');
    expect(updated.id).toBe('fo2');
    expect(updated.status).toBe('in_transit');
  });

  it('rejects status updates for unknown orders', async () => {
    await expect(updateDeliveryOrderStatus('nope', 'delivered')).rejects.toThrow(
      'Order not found'
    );
  });

  it('attaches a proof of delivery', async () => {
    const updated = await setOrderProofOfDelivery('fo5', 'photo_uploaded');
    expect(updated.proofOfDelivery).toBe('photo_uploaded');
  });

  it('rejects proof of delivery for unknown orders', async () => {
    await expect(setOrderProofOfDelivery('nope', 'photo_uploaded')).rejects.toThrow(
      'Order not found'
    );
  });
});
