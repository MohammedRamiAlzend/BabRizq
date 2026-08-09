/**
 * Unit tests for the offer mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { STORE_OFFERS, getStoreOffers, createStoreOffer, updateStoreOffer } from './api';

describe('store-owner offer mock API', () => {
  it('exposes offers with valid discount semantics', () => {
    expect(STORE_OFFERS.length).toBeGreaterThan(0);
    for (const offer of STORE_OFFERS) {
      expect(offer.discountValue).toBeGreaterThan(0);
      if (offer.discountType === 'percent') {
        expect(offer.discountValue).toBeLessThanOrEqual(100);
      }
      // Active offers must be inside their validity window
      if (offer.isActive) {
        expect(offer.startDate <= offer.endDate).toBe(true);
      }
    }
  });

  it('getStoreOffers resolves the seed data', async () => {
    expect(await getStoreOffers()).toEqual(STORE_OFFERS);
  });

  it('createStoreOffer appends and updateStoreOffer merges', async () => {
    const before = STORE_OFFERS.length;
    const created = await createStoreOffer({
      nameEn: 'Test', nameAr: 'اختبار', type: 'product',
      targetId: 'sp1', targetNameEn: 'X', targetNameAr: 'ص',
      discountType: 'percent', discountValue: 5,
      startDate: '2026-01-01', endDate: '2026-12-31', isActive: true,
    });
    expect(STORE_OFFERS.length).toBe(before + 1);

    const updated = await updateStoreOffer(created.id, { discountValue: 8 });
    expect(updated.discountValue).toBe(8);
    await expect(updateStoreOffer('missing', { isActive: false })).rejects.toThrow('Offer not found');
  });
});
