/**
 * Driver entity — domain model (back office).
 *
 * Extracted from the legacy `entities/fulfillmentData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A driver is a delivery partner the back office
 * can assign to orders (`GET /api/backoffice/drivers`).
 */
export interface MockDriver {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  available: boolean;
}
