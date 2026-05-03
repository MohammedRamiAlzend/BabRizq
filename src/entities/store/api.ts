// Mock API for Store entity
import { Store } from './model';

// Mock data
const MOCK_STORES: Store[] = [
  {
    id: 'techzone',
    nameEn: 'TechZone',
    nameAr: 'تك زون',
    descriptionEn: 'Latest gadgets & electronics',
    descriptionAr: 'أحدث الأجهزة والإلكترونيات',
    contactEmail: 'contact@techzone.com',
    phone: '+966 55 123 4567',
    addressEn: 'Riyadh, Saudi Arabia',
    addressAr: 'الرياض، المملكة العربية السعودية',
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    ownerId: 'u1',
    isActive: true,
    settings: {
      acceptedCurrencies: ['SAR', 'USD'],
      paymentMethods: ['cash', 'card'],
      lowStockThreshold: 5,
      notifyLowStock: true,
      notifyNewOrder: true,
      deliveryFee: 25,
      freeShippingThreshold: 300,
      estimatedDeliveryDays: 3,
      taxRate: 15,
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  // Add more stores...
];

// API functions
export async function getStores(): Promise<Store[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_STORES), 100));
}

export async function getStoreById(id: string): Promise<Store | null> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_STORES.find(s => s.id === id) || null), 100)
  );
}

export async function getStoresByOwner(ownerId: string): Promise<Store[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_STORES.filter(s => s.ownerId === ownerId)), 100)
  );
}

export async function updateStore(id: string, updates: Partial<Store>): Promise<Store> {
  const store = MOCK_STORES.find(s => s.id === id);
  if (!store) throw new Error('Store not found');
  Object.assign(store, updates, { updatedAt: new Date().toISOString() });
  return store;
}

export async function createStore(store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
  const newStore: Store = {
    ...store,
    id: `s${MOCK_STORES.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_STORES.push(newStore);
  return newStore;
}