/**
 * Order entity — domain model (back office).
 *
 * Extracted from the legacy `entities/fulfillmentData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A full order is the fulfillment view of a
 * customer order: it carries customer/address/store context plus the live
 * fulfillment status and assigned driver
 * (`GET /api/backoffice/orders`, `PUT /api/backoffice/orders/{id}/status`,
 * `PUT /api/backoffice/orders/{id}/assign-driver`).
 *
 * `FullOrder` / `FullOrderStatus` live in the shared package
 * (`@/shared/lib/order`) so the shared `OrderBadge`/`ProofOfDeliveryModal`
 * and the delivery app's order entity agree on the exact same contract;
 * they are re-exported here so existing `~/entities/order` imports keep
 * working unchanged.
 */
import type { FullOrder, FullOrderStatus } from '@/shared/lib/order';

export type { FullOrder, FullOrderStatus };
