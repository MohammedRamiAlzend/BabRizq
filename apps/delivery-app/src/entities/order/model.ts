/**
 * Order entity — domain model (delivery driver).
 *
 * Extracted from the legacy `entities/fulfillmentData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A full order is the fulfillment view of a
 * customer order that a driver picks up and delivers
 * (`GET /api/delivery/orders?status=`, `PUT /api/delivery/orders/{id}/status`,
 * `POST /api/delivery/orders/{id}/proof-of-delivery`).
 *
 * `FullOrder` / `FullOrderStatus` live in the shared package
 * (`@/shared/lib/order`) so the shared `OrderBadge`/`ProofOfDeliveryModal`
 * and the back-office app's order entity agree on the exact same contract;
 * they are re-exported here so existing `~/entities/order` imports keep
 * working unchanged.
 */
import type { FullOrder, FullOrderStatus } from '@/shared/lib/order';

export type { FullOrder, FullOrderStatus };
