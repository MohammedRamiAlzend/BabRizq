/**
 * Product entity — mock API.
 *
 * Simulates the store-owner product endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET/POST /api/store-owner/products` · `PUT/DELETE /api/store-owner/products/{id}`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { StoreProduct } from './model';
import { api, unwrapList } from '@/shared/lib/api';

/** In-memory catalogue. TODO(migration): replaced by `GET /api/store-owner/products`. */
export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'sp1', nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة',
    descriptionEn: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
    descriptionAr: 'سماعات لاسلكية عالية الجودة مع إلغاء الضوضاء النشط وعمر بطارية 30 ساعة.',
    descriptionEn2: 'Bluetooth 5.0, foldable design, premium carrying case included.',
    descriptionAr2: 'بلوتوث 5.0، تصميم قابل للطي، حقيبة حمل فاخرة مضمنة.',
    images: [], image: '',
    price: 299, stock: 45, categoryId: 'cat1', categoryEn: 'Electronics', categoryAr: 'إلكترونيات',
    sku: 'ELEC-001',
    currencyPrices: [
      { currency: 'SAR', amount: 299 }, { currency: 'USD', amount: 80 },
      { currency: 'AED', amount: 294 }, { currency: 'SYP', amount: 200000 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 349, date: '2026-01-01' },
      { currency: 'SAR', amount: 319, date: '2026-02-15' },
      { currency: 'SAR', amount: 299, date: '2026-04-01' },
    ],
  },
  {
    id: 'sp2', nameEn: 'Leather Messenger Bag', nameAr: 'حقيبة جلدية كلاسيكية',
    descriptionEn: 'Genuine leather messenger bag with laptop compartment.',
    descriptionAr: 'حقيبة جلد طبيعي مع مقصورة للكمبيوتر المحمول.',
    images: [], image: '',
    price: 189, stock: 23, categoryId: 'cat2', categoryEn: 'Accessories', categoryAr: 'إكسسوارات',
    sku: 'ACC-001',
    currencyPrices: [
      { currency: 'SAR', amount: 189 }, { currency: 'USD', amount: 50 }, { currency: 'AED', amount: 185 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 220, date: '2026-01-01' },
      { currency: 'SAR', amount: 189, date: '2026-03-01' },
    ],
  },
  {
    id: 'sp3', nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية',
    descriptionEn: 'Luxury gold-plated wristwatch with sapphire crystal glass.',
    descriptionAr: 'ساعة يد مطلية بالذهب مع زجاج كريستال الياقوت.',
    images: [], image: '',
    price: 459, stock: 12, categoryId: 'cat3', categoryEn: 'Watches', categoryAr: 'ساعات',
    sku: 'WATCH-001',
    currencyPrices: [
      { currency: 'SAR', amount: 459 }, { currency: 'USD', amount: 122 }, { currency: 'AED', amount: 450 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 499, date: '2026-01-01' },
      { currency: 'SAR', amount: 459, date: '2026-03-15' },
    ],
  },
  {
    id: 'sp4', nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية أفياتور',
    descriptionEn: 'Classic aviator sunglasses with UV400 protection.',
    descriptionAr: 'نظارات شمسية كلاسيكية بحماية UV400.',
    images: [], image: '',
    price: 129, stock: 67, categoryId: 'cat2', categoryEn: 'Accessories', categoryAr: 'إكسسوارات',
    sku: 'ACC-002',
    currencyPrices: [
      { currency: 'SAR', amount: 129 }, { currency: 'USD', amount: 34 }, { currency: 'AED', amount: 126 },
    ],
    priceHistory: [{ currency: 'SAR', amount: 129, date: '2026-01-01' }],
  },
  {
    id: 'sp5', nameEn: 'Classic White Sneakers', nameAr: 'حذاء رياضي أبيض',
    descriptionEn: 'Premium leather white sneakers, comfortable and stylish.',
    descriptionAr: 'حذاء رياضي أبيض من الجلد الفاخر، مريح وأنيق.',
    images: [], image: '',
    price: 159, stock: 3, categoryId: 'cat4', categoryEn: 'Shoes', categoryAr: 'أحذية',
    sku: 'SHOE-001',
    currencyPrices: [
      { currency: 'SAR', amount: 159 }, { currency: 'USD', amount: 42 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 199, date: '2026-01-01' },
      { currency: 'SAR', amount: 159, date: '2026-02-01' },
    ],
  },
  {
    id: 'sp6', nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي',
    descriptionEn: 'Authentic Arabic oud perfume, rich and long-lasting fragrance.',
    descriptionAr: 'عطر عود عربي أصيل، رائحة غنية وطويلة الأمد.',
    images: [], image: '',
    price: 219, stock: 31, categoryId: 'cat5', categoryEn: 'Perfumes', categoryAr: 'عطور',
    sku: 'PERF-001',
    currencyPrices: [
      { currency: 'SAR', amount: 219 }, { currency: 'USD', amount: 58 }, { currency: 'AED', amount: 215 },
    ],
    priceHistory: [{ currency: 'SAR', amount: 219, date: '2026-01-01' }],
  },
  {
    id: 'sp7', nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد',
    descriptionEn: '6.7" OLED display, 256GB storage, 108MP camera system.',
    descriptionAr: 'شاشة OLED 6.7 بوصة، تخزين 256 جيجا، نظام كاميرا 108 ميجابكسل.',
    images: [], image: '',
    price: 899, stock: 8, categoryId: 'cat1', categoryEn: 'Electronics', categoryAr: 'إلكترونيات',
    sku: 'ELEC-002',
    currencyPrices: [
      { currency: 'SAR', amount: 899 }, { currency: 'USD', amount: 240 }, { currency: 'AED', amount: 880 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 999, date: '2026-01-01' },
      { currency: 'SAR', amount: 949, date: '2026-02-15' },
      { currency: 'SAR', amount: 899, date: '2026-04-01' },
    ],
  },
  {
    id: 'sp8', nameEn: 'Wool Knitted Scarf', nameAr: 'وشاح صوف محبوك',
    descriptionEn: 'Soft merino wool scarf, available in multiple colors.',
    descriptionAr: 'وشاح من الصوف المرينو الناعم، متاح بألوان متعددة.',
    images: [], image: '',
    price: 69, stock: 0, categoryId: 'cat6', categoryEn: 'Fashion', categoryAr: 'أزياء',
    sku: 'FASH-001',
    currencyPrices: [
      { currency: 'SAR', amount: 69 }, { currency: 'USD', amount: 18 },
    ],
    priceHistory: [{ currency: 'SAR', amount: 69, date: '2026-01-01' }],
  },
];

/** Backend `StoreProductView` shape (store `products.md`) — DTO boundary. */
interface StoreProductDto {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  images: string[];
  price: number;
  currencyPrices: { currency: string; amount: number }[];
  stock: number;
  categoryId: string;
  sku?: string;
  hasOffer: boolean;
}

/**
 * Maps the backend view onto the frontend `StoreProduct` model. `priceHistory`
 * and the bilingual category names are not part of the products endpoint — the
 * former arrives with the accounting phase, the latter with a category lookup.
 */
function toStoreProduct(dto: StoreProductDto): StoreProduct {
  return {
    id: dto.id,
    nameEn: dto.nameEn,
    nameAr: dto.nameAr,
    descriptionEn: dto.descriptionEn,
    descriptionAr: dto.descriptionAr,
    images: dto.images,
    image: dto.images[0] ?? '',
    price: dto.price,
    currencyPrices: dto.currencyPrices,
    priceHistory: [],
    stock: dto.stock,
    categoryId: dto.categoryId,
    categoryEn: '',
    categoryAr: '',
    sku: dto.sku,
  };
}

/** Maps a frontend create input onto the backend `CreateProductDto`. */
function toCreateProductDto(input: Omit<StoreProduct, 'id'>) {
  return {
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    images: input.images.length > 0 ? input.images : input.image ? [input.image] : [],
    price: input.price,
    stock: input.stock,
    categoryId: input.categoryId,
    ...(input.sku ? { sku: input.sku } : {}),
  };
}

/** GET /store/products — the store owner's catalogue (X-Store-Id scoped). */
export async function getStoreProducts(): Promise<StoreProduct[]> {
  const data = await api.get<StoreProductDto[] | { items: StoreProductDto[] }>('/store/products', {
    page: 1,
    pageSize: 100,
  });
  return unwrapList(data).map(toStoreProduct);
}

/**
 * GET /store/products (no detail route exists) — resolves a single product
 * from the list response to keep the legacy signature.
 */
export async function getStoreProductById(id: string): Promise<StoreProduct | null> {
  const products = await getStoreProducts();
  return products.find(p => p.id === id) ?? null;
}

/** POST /store/products — create a product for the authenticated store. */
export async function createStoreProduct(
  input: Omit<StoreProduct, 'id'>
): Promise<StoreProduct> {
  const dto = await api.post<StoreProductDto>('/store/products', toCreateProductDto(input));
  return toStoreProduct(dto);
}

/** PUT /store/products/{id} — update the product (only provided fields). */
export async function updateStoreProduct(
  id: string,
  updates: Partial<StoreProduct>
): Promise<StoreProduct> {
  const body: Record<string, unknown> = {};
  if (updates.nameEn !== undefined) body.nameEn = updates.nameEn;
  if (updates.nameAr !== undefined) body.nameAr = updates.nameAr;
  if (updates.descriptionEn !== undefined) body.descriptionEn = updates.descriptionEn;
  if (updates.descriptionAr !== undefined) body.descriptionAr = updates.descriptionAr;
  if (updates.price !== undefined) body.price = updates.price;
  if (updates.stock !== undefined) body.stock = updates.stock;
  if (updates.categoryId !== undefined) body.categoryId = updates.categoryId;
  if (updates.sku !== undefined) body.sku = updates.sku;
  if (updates.images !== undefined) body.images = updates.images;
  else if (updates.image !== undefined) body.images = [updates.image];

  const dto = await api.put<StoreProductDto>(`/store/products/${id}`, body);
  return toStoreProduct(dto);
}

/** DELETE /store/products/{id} — remove a product from the catalogue. */
export async function deleteStoreProduct(id: string): Promise<void> {
  await api.del<void>(`/store/products/${id}`);
}
