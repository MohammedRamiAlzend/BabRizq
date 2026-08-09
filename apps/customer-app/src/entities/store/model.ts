/**
 * Store entity — domain model.
 *
 * Extracted from the legacy monolith's `entities/products.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A store is a merchant shop on the Bab Rizq
 * marketplace; the customer storefront browses stores and drills into their
 * catalogs (`GET /api/stores` in `docs/needed-endpoints-from-backend.md`).
 *
 * Mock data + fetch-ready functions live in `./api.ts`.
 */
export interface Store {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  descriptionEn: string;
  descriptionAr: string;
  categoryEn: string;
  categoryAr: string;
}
