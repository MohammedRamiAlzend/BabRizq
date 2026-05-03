// Mock API for Product entity
import { Product } from './model';

// Mock data - in real app, this would be from DB
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    nameEn: 'Premium Wireless Headphones',
    nameAr: 'سماعات لاسلكية فاخرة',
    descriptionEn: 'High-quality wireless headphones',
    descriptionAr: 'سماعات لاسلكية عالية الجودة',
    price: 299,
    currency: 'SAR',
    priceHistory: [],
    currencyPrices: [{ currency: 'SAR', amount: 299 }],
    stock: 45,
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    storeId: 'techzone',
    storeNameEn: 'TechZone',
    storeNameAr: 'تك زون',
    images: [],
    sku: 'ELEC-001',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  // Add more products...
];

// API functions
export async function getProducts(): Promise<Product[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_PRODUCTS), 100));
}

export async function getProductById(id: string): Promise<Product | null> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_PRODUCTS.find(p => p.id === id) || null), 100)
  );
}

export async function getProductsByStore(storeId: string): Promise<Product[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_PRODUCTS.filter(p => p.storeId === storeId)), 100)
  );
}

export async function getProductsByCategory(categoryEn: string): Promise<Product[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_PRODUCTS.filter(p => p.categoryEn === categoryEn)), 100)
  );
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const product = MOCK_PRODUCTS.find(p => p.id === id);
  if (!product) throw new Error('Product not found');
  Object.assign(product, updates, { updatedAt: new Date().toISOString() });
  return product;
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: `p${MOCK_PRODUCTS.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_PRODUCTS.push(newProduct);
  return newProduct;
}