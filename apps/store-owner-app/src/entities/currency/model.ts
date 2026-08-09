/**
 * Currency entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A currency option is a sellable currency in the
 * store owner's multi-currency pricing; the platform reference list lives in
 * `./api.ts`.
 */
export interface CurrencyOption {
  code: string;
  nameEn: string;
  nameAr: string;
  symbol: string;
}
