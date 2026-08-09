/**
 * Driver entity — domain model (delivery driver app).
 *
 * Extracted from the legacy `entities/fulfillmentData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A driver is the authenticated user of this
 * app: the roster is used to self-identify and to label assignments
 * (`GET /api/delivery/me`).
 */
export interface MockDriver {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  available: boolean;
}
