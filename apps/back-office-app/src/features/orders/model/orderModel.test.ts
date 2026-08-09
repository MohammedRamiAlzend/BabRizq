import { describe, expect, it } from 'vitest';
import type { FullOrder } from '~/entities/order';
import { assignDriver, setProofOfDelivery, updateStatus } from './orderModel';

const driver = { id: 'd1', nameEn: 'Yusuf Al-Mutairi', nameAr: 'يوسف المطيري', phone: '+966 55 123 4567', available: true };

function makeOrders(): FullOrder[] {
  return [
    {
      id: 'o1', orderNumber: '#BRQ-1',
      customerNameEn: 'A', customerNameAr: 'أ', customerPhone: '+966',
      addressEn: 'Riyadh', addressAr: 'الرياض',
      storeNameEn: 'S', storeNameAr: 'م', storeAddressEn: 'Riyadh', storeAddressAr: 'الرياض',
      items: [], total: 10, status: 'pending',
      assignedDriverId: null, assignedDriverEn: null, assignedDriverAr: null,
      date: '2026-04-06',
    },
    {
      id: 'o2', orderNumber: '#BRQ-2',
      customerNameEn: 'B', customerNameAr: 'ب', customerPhone: '+966',
      addressEn: 'Jeddah', addressAr: 'جدة',
      storeNameEn: 'S', storeNameAr: 'م', storeAddressEn: 'Jeddah', storeAddressAr: 'جدة',
      items: [], total: 20, status: 'pending',
      assignedDriverId: null, assignedDriverEn: null, assignedDriverAr: null,
      date: '2026-04-05',
    },
  ];
}

describe('orderModel (back office)', () => {
  it('assignDriver records the driver and moves the order to assigned', () => {
    const orders = makeOrders();
    const next = assignDriver(orders, 'o1', driver);

    const order = next.find(o => o.id === 'o1')!;
    expect(order.assignedDriverId).toBe('d1');
    expect(order.assignedDriverEn).toBe('Yusuf Al-Mutairi');
    expect(order.assignedDriverAr).toBe('يوسف المطيري');
    expect(order.status).toBe('assigned');
  });

  it('assignDriver leaves other orders untouched', () => {
    const orders = makeOrders();
    const next = assignDriver(orders, 'o1', driver);
    expect(next.find(o => o.id === 'o2')?.status).toBe('pending');
  });

  it('updates are immutable — the source array is not mutated', () => {
    const orders = makeOrders();
    const next = updateStatus(orders, 'o1', 'delivered');
    expect(orders[0].status).toBe('pending');
    expect(next[0].status).toBe('delivered');
    expect(next).not.toBe(orders);
  });

  it('setProofOfDelivery attaches the proof reference', () => {
    const orders = makeOrders();
    const next = setProofOfDelivery(orders, 'o2', 'photo_uploaded');
    expect(next.find(o => o.id === 'o2')?.proofOfDelivery).toBe('photo_uploaded');
    expect(orders.find(o => o.id === 'o2')?.proofOfDelivery).toBeUndefined();
  });
});
