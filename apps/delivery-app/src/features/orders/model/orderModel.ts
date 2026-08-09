/**
 * Order domain logic — pure, framework-free functions.
 *
 * Extracted from `ordersContext.tsx` during the Phase 2 cleanup so the
 * fulfillment actions (assign driver / update status / proof of delivery) can
 * be unit-tested without rendering React. The context (`./ordersContext.tsx`)
 * is now a thin stateful wrapper over these functions.
 *
 * TODO(migration): these map 1:1 to `PUT /api/delivery/orders/{id}/status`
 * and `POST /api/delivery/orders/{id}/proof-of-delivery`.
 */
import type { FullOrder, FullOrderStatus } from '~/entities/order';
import type { MockDriver } from '~/entities/driver';

/**
 * Assigns a driver to an order: records the driver's bilingual name and moves
 * the order to the `assigned` status. Returns a new array (immutable update).
 */
export function assignDriver(
  orders: FullOrder[],
  orderId: string,
  driver: MockDriver
): FullOrder[] {
  return orders.map(o =>
    o.id === orderId
      ? {
          ...o,
          assignedDriverId: driver.id,
          assignedDriverEn: driver.nameEn,
          assignedDriverAr: driver.nameAr,
          status: 'assigned',
        }
      : o
  );
}

/** Sets an order's fulfillment status. Returns a new array. */
export function updateStatus(
  orders: FullOrder[],
  orderId: string,
  status: FullOrderStatus
): FullOrder[] {
  return orders.map(o => (o.id === orderId ? { ...o, status } : o));
}

/** Attaches a proof-of-delivery reference to an order. Returns a new array. */
export function setProofOfDelivery(
  orders: FullOrder[],
  orderId: string,
  proof: string
): FullOrder[] {
  return orders.map(o => (o.id === orderId ? { ...o, proofOfDelivery: proof } : o));
}
