import { describe, expect, it } from 'vitest';
import {
  AFFILIATE_TARGETS,
  INITIAL_LINKS,
  createAffiliateLink,
  getAffiliateLinks,
  getAffiliateTargets,
} from './api';

describe('affiliateLink API (marketer)', () => {
  it('returns all affiliate links', async () => {
    const links = await getAffiliateLinks();
    expect(links).toHaveLength(INITIAL_LINKS.length);
  });

  it('returns targets of both store and product types', async () => {
    const targets = await getAffiliateTargets();
    expect(targets).toHaveLength(AFFILIATE_TARGETS.length);
    expect(targets.some(t => t.type === 'store')).toBe(true);
    expect(targets.some(t => t.type === 'product')).toBe(true);
  });

  it('every link has bilingual target names and positive stats', async () => {
    const links = await getAffiliateLinks();
    for (const link of links) {
      expect(link.targetNameEn).toBeTruthy();
      expect(link.targetNameAr).toBeTruthy();
      expect(link.clicks).toBeGreaterThan(0);
      expect(link.earned).toBeGreaterThan(0);
    }
  });

  it('creates a new link with zero stats', async () => {
    const before = (await getAffiliateLinks()).length;
    const created = await createAffiliateLink({
      url: 'babrizq.com/store/s4?ref=marketer1',
      targetNameEn: 'Scent Palace',
      targetNameAr: 'قصر العطور',
      type: 'store',
    });

    expect(created.clicks).toBe(0);
    expect(created.conversions).toBe(0);
    expect(created.earned).toBe(0);
    expect(created.id).toBeTruthy();
    expect((await getAffiliateLinks())).toHaveLength(before + 1);
  });
});
