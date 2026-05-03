// Domain model for Store entity
export interface Store {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logoUrl?: string;
  contactEmail: string;
  phone: string;
  addressEn: string;
  addressAr: string;
  categoryEn: string;
  categoryAr: string;
  ownerId: string;
  isActive: boolean;
  settings: StoreSettings;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  acceptedCurrencies: string[];
  paymentMethods: string[];
  lowStockThreshold: number;
  notifyLowStock: boolean;
  notifyNewOrder: boolean;
  deliveryFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: number;
  taxRate: number;
}

// Business logic for Store
export class StoreEntity {
  constructor(private store: Store) {}

  canAcceptCurrency(currency: string): boolean {
    return this.store.settings.acceptedCurrencies.includes(currency);
  }

  calculateDeliveryFee(subtotal: number): number {
    return subtotal >= this.store.settings.freeShippingThreshold ? 0 : this.store.settings.deliveryFee;
  }

  calculateTax(amount: number): number {
    return amount * (this.store.settings.taxRate / 100);
  }

  updateSettings(settings: Partial<StoreSettings>): Store {
    return {
      ...this.store,
      settings: { ...this.store.settings, ...settings },
      updatedAt: new Date().toISOString(),
    };
  }
}

// Validation
export function validateStore(store: Partial<Store>): string[] {
  const errors: string[] = [];
  if (!store.nameEn) errors.push('English name is required');
  if (!store.nameAr) errors.push('Arabic name is required');
  if (!store.contactEmail) errors.push('Contact email is required');
  if (!store.ownerId) errors.push('Owner ID is required');
  return errors;
}