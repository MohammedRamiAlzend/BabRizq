/**
 * Affiliate link entity — public API (marketer).
 *
 * @see ./model — the `AffiliateLink` / `AffiliateTarget` contracts
 * @see ./api — mock endpoints (replace with real API at migration time)
 */
export type { AffiliateLink, AffiliateTarget } from './model';
export { AFFILIATE_TARGETS, INITIAL_LINKS, getAffiliateLinks, getAffiliateTargets, createAffiliateLink } from './api';
