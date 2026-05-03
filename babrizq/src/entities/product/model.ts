// Domain model for Product entity
export interface ProductPrice {
  currency: string;
  amount: number;
}

export interface ProductPriceHistory {
  currency: string;
  amount: number;
  date: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  currency: string;
  priceHistory: ProductPriceHistory[];
  currencyPrices: ProductPrice[];
  stock: number;
  categoryEn: string;
  categoryAr: string;
  storeId: string;
  storeNameEn: string;
  storeNameAr: string;
  images: string[];
  barcode?: string;
  sku?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Business logic for Product
export class ProductEntity {
  constructor(private product: Product) {}

  getCurrentPrice(currency?: string): number {
    if (!currency) return this.product.price;
    const price = this.product.currencyPrices.find(p => p.currency === currency);
    return price?.amount || this.product.price;
  }

  isInStock(): boolean {
    return this.product.stock > 0;
  }

  canFulfill(quantity: number): boolean {
    return this.product.stock >= quantity;
  }

  updateStock(quantity: number): Product {
    if (this.product.stock + quantity < 0) throw new Error('Insufficient stock');
    return {
      ...this.product,
      stock: this.product.stock + quantity,
      updatedAt: new Date().toISOString(),
    };
  }

  addPriceHistory(currency: string, amount: number): Product {
    const newHistory: ProductPriceHistory = {
      currency,
      amount,
      date: new Date().toISOString(),
    };
    return {
      ...this.product,
      priceHistory: [...this.product.priceHistory, newHistory],
      updatedAt: new Date().toISOString(),
    };
  }
}

// Validation
export function validateProduct(product: Partial<Product>): string[] {
  const errors: string[] = [];
  if (!product.nameEn) errors.push('English name is required');
  if (!product.nameAr) errors.push('Arabic name is required');
  if (product.price == null || product.price < 0) errors.push('Valid price is required');
  if (!product.categoryEn) errors.push('Category is required');
  if (!product.storeId) errors.push('Store ID is required');
  return errors;
}