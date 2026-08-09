/**
 * Order fulfilment — shared cross-role contract.
 *
 * Single source of truth for the order types shared across roles:
 * - the back-office and delivery apps re-export these from their order
 *   entity slice (so pages keep importing from `~/entities/order`),
 * - the shared `OrderBadge` and `ProofOfDeliveryModal` UIs consume them
 *   directly.
 *
 * Order data flows across roles (store-owner → back-office → driver), so
 * every consumer must agree on the exact same shape and statuses. Keeping
 * the contract here (instead of inside each app) guarantees that by
 * construction.
 */

/** The fulfilment lifecycle of an order. */
export type FullOrderStatus =
  | 'pending'
  | 'processing'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered';

/**
 * Fulfilment view of a customer order, as seen by the back-office and
 * delivery apps: customer/address/store context plus the live fulfilment
 * status and assigned driver.
 */
export interface FullOrder {
  id: string;
  orderNumber: string;
  customerNameEn: string;
  customerNameAr: string;
  customerPhone: string;
  addressEn: string;
  addressAr: string;
  /** Optional customer GPS coordinates for map display */
  lat?: number;
  lng?: number;
  storeNameEn: string;
  storeNameAr: string;
  storeAddressEn: string;
  storeAddressAr: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  status: FullOrderStatus;
  assignedDriverId: string | null;
  assignedDriverEn: string | null;
  assignedDriverAr: string | null;
  date: string;
  proofOfDelivery?: string;
}
