/**
 * Affiliate link entity — domain model (marketer).
 *
 * Extracted from the legacy `entities/marketerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A marketer promotes stores/products via
 * affiliate links and earns commissions on conversions
 * (`GET/POST /api/marketer/links`, `GET /api/marketer/targets`).
 */

/** A target (store or product) a marketer can create an affiliate link for. */
export interface AffiliateTarget {
  id: string;
  nameEn: string;
  nameAr: string;
  type: 'store' | 'product';
}

/** A marketer's affiliate link with its accumulated performance stats. */
export interface AffiliateLink {
  id: string;
  url: string;
  targetNameEn: string;
  targetNameAr: string;
  type: 'store' | 'product';
  clicks: number;
  conversions: number;
  earned: number;
  createdAt: string;
}
