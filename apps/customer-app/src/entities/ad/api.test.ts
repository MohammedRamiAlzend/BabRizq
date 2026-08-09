/**
 * Unit tests for the ad mock API (`./api.ts`).
 * Pins the carousel-data contract: every ad is bilingual, has a Tailwind
 * gradient, and its navigation target must be internally consistent.
 */
import { describe, it, expect } from 'vitest';
import { MOCK_ADS, STORE_ADS, CATEGORY_ADS, getHomeAds, getStoreAds, getCategoryAds } from './api';

describe('ad mock API', () => {
  it('home ads are bilingual and carry a Tailwind gradient', () => {
    expect(MOCK_ADS.length).toBeGreaterThan(0);
    for (const ad of MOCK_ADS) {
      expect(ad.titleEn).toBeTruthy();
      expect(ad.titleAr).toBeTruthy();
      expect(ad.subtitleEn).toBeTruthy();
      expect(ad.subtitleAr).toBeTruthy();
      expect(ad.gradient).toMatch(/^from-/);
    }
  });

  it('getHomeAds resolves the home carousel', async () => {
    expect(await getHomeAds()).toEqual(MOCK_ADS);
  });

  it('getStoreAds returns the store ads and [] for unknown stores', async () => {
    expect((await getStoreAds('techzone')).length).toBeGreaterThan(0);
    expect(await getStoreAds('unknown-store')).toEqual([]);
  });

  it('store ads always point back at their own store', () => {
    for (const [storeId, ads] of Object.entries(STORE_ADS)) {
      for (const ad of ads) {
        expect(ad.linkType).toBe('store');
        expect(ad.linkValue).toBe(storeId);
      }
    }
  });

  it('getCategoryAds returns ads for a known category and [] otherwise', async () => {
    const ads = await getCategoryAds('Electronics');
    expect(ads.length).toBeGreaterThan(0);
    expect(ads.every(a => a.linkValue === 'Electronics')).toBe(true);
    expect(await getCategoryAds('Unknown')).toEqual([]);
  });

  it('category ads reference existing platform categories', () => {
    const knownCategories = new Set(Object.keys(CATEGORY_ADS));
    for (const ads of Object.values(CATEGORY_ADS)) {
      for (const ad of ads) {
        if (ad.linkType === 'category' && ad.linkValue) {
          expect(knownCategories.has(ad.linkValue)).toBe(true);
        }
      }
    }
  });
});
