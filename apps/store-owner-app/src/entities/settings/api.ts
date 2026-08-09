/**
 * Settings entity — mock API.
 *
 * Simulates the store-owner settings endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/PUT /api/store-owner/settings`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { StoreSettings } from './model';

/** In-memory settings. TODO(migration): replaced by `GET /api/store-owner/settings`. */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeNameEn: 'My BabRizq Store',
  storeNameAr: 'متجري على بابرزق',
  descriptionEn: 'Quality products at the best prices.',
  descriptionAr: 'منتجات عالية الجودة بأفضل الأسعار.',
  logoUrl: '',
  contactEmail: 'store@babrizq.com',
  phone: '+966 50 123 4567',
  address: 'Riyadh, Saudi Arabia',
  acceptedCurrencies: ['SAR', 'USD', 'AED'],
  paymentMethods: ['cash', 'card', 'transfer'],
  lowStockThreshold: 5,
  notifyLowStock: true,
  notifyNewOrder: true,
  deliveryFee: 25,
  freeShippingThreshold: 300,
  estimatedDeliveryDays: 3,
  taxRate: 15,
};

/** Simulates `GET /api/store-owner/settings`. */
export async function getStoreSettings(): Promise<StoreSettings> {
  return new Promise(resolve => setTimeout(() => resolve(DEFAULT_STORE_SETTINGS), 100));
}

/** Simulates `PUT /api/store-owner/settings`. */
export async function updateStoreSettings(
  updates: Partial<StoreSettings>
): Promise<StoreSettings> {
  return new Promise(resolve =>
    setTimeout(() => {
      Object.assign(DEFAULT_STORE_SETTINGS, updates);
      resolve(DEFAULT_STORE_SETTINGS);
    }, 100)
  );
}
