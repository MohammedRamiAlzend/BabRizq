/**
 * Offer entity — mock API.
 *
 * Simulates the store-owner offer endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET/POST /api/store-owner/offers` · `PUT /api/store-owner/offers/{id}`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { Offer } from './model';

/** In-memory offers. TODO(migration): replaced by `GET /api/store-owner/offers`. */
export const STORE_OFFERS: Offer[] = [
  {
    id: 'off1', nameEn: 'Ramadan Sale', nameAr: 'تخفيضات رمضان',
    type: 'category', targetId: 'cat1', targetNameEn: 'Electronics', targetNameAr: 'إلكترونيات',
    discountType: 'percent', discountValue: 15,
    startDate: '2026-03-01', endDate: '2026-04-10', isActive: false,
  },
  {
    id: 'off2', nameEn: 'Spring Offer', nameAr: 'عرض الربيع',
    type: 'product', targetId: 'sp3', targetNameEn: 'Gold Wristwatch', targetNameAr: 'ساعة يد ذهبية',
    discountType: 'fixed', discountValue: 50, currency: 'SAR',
    startDate: '2026-04-15', endDate: '2026-05-15', isActive: true,
  },
  {
    id: 'off3', nameEn: 'VIP Members Discount', nameAr: 'خصم أعضاء VIP',
    type: 'segment', targetId: 'vip', targetNameEn: 'VIP Members', targetNameAr: 'أعضاء VIP',
    discountType: 'percent', discountValue: 10,
    startDate: '2026-01-01', endDate: '2026-12-31', isActive: true,
  },
];

/** Simulates `GET /api/store-owner/offers`. */
export async function getStoreOffers(): Promise<Offer[]> {
  return new Promise(resolve => setTimeout(() => resolve(STORE_OFFERS), 100));
}

/** Simulates `POST /api/store-owner/offers`. */
export async function createStoreOffer(input: Omit<Offer, 'id'>): Promise<Offer> {
  return new Promise(resolve =>
    setTimeout(() => {
      const offer: Offer = { ...input, id: `off${STORE_OFFERS.length + 1}` };
      STORE_OFFERS.push(offer);
      resolve(offer);
    }, 100)
  );
}

/** Simulates `PUT /api/store-owner/offers/{id}`. */
export async function updateStoreOffer(
  id: string,
  updates: Partial<Offer>
): Promise<Offer> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const index = STORE_OFFERS.findIndex(o => o.id === id);
      if (index === -1) {
        reject(new Error('Offer not found'));
        return;
      }
      STORE_OFFERS[index] = { ...STORE_OFFERS[index], ...updates };
      resolve(STORE_OFFERS[index]);
    }, 100)
  );
}
