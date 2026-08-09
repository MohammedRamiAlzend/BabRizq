/**
 * Order entity — public API (delivery driver).
 *
 * @see ./model — the shared `FullOrder` / `FullOrderStatus` contract
 * @see ./api — mock endpoints (replace with real API at migration time)
 */
export type { FullOrder, FullOrderStatus } from './model';
export { ALL_ORDERS, getDeliveryOrders, updateDeliveryOrderStatus, setOrderProofOfDelivery } from './api';
