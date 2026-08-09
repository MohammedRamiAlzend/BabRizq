/**
 * Canonical order-status flow — single source of truth for the platform.
 *
 * The shared contract (`packages/shared/src/lib/order.ts` FullOrderStatus)
 * defines the 6-step lifecycle used by the back-office and delivery apps:
 *
 *   pending → processing → assigned → picked_up → in_transit → delivered
 *
 * The store-owner app docs use a simplified `pending → processing → shipped
 * → delivered` chain; we reconcile on the canonical 6-step flow so every
 * role reads the same status. `assertForwardTransition` enforces strict
 * one-step-forward moves with the documented error codes.
 */
import { ApiError } from '../errors/api-error';

export const ORDER_STATUS_FLOW = [
  'pending',
  'processing',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_FLOW as readonly string[]).includes(value);
}

/**
 * Validates that `next` is exactly one step after `current`.
 *
 * @throws INVALID_STATUS_TRANSITION (422) — not the exact next step
 * @throws ORDER_ALREADY_DELIVERED (409) — current status is already `delivered`
 */
export function assertForwardTransition(current: string, next: string): void {
  if (current === 'delivered') {
    throw ApiError.conflict(
      'ORDER_ALREADY_DELIVERED',
      'This order has already been delivered',
    );
  }
  const index = ORDER_STATUS_FLOW.indexOf(current as OrderStatus);
  if (index === -1 || ORDER_STATUS_FLOW[index + 1] !== next) {
    throw new ApiError(
      'INVALID_STATUS_TRANSITION',
      422,
      `Invalid status transition from "${current}" to "${next}"`,
    );
  }
}

/** True when the status can move forward (i.e. not already delivered). */
export function canAdvance(status: string): boolean {
  return status !== 'delivered';
}
