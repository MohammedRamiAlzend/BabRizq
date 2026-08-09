/**
 * Store-owner mapper — Prisma records → the shapes the store-owner app's
 * `products.md` / `orders.md` / `categories.md` contracts define.
 */
import { Order, OrderItem, PlatformCategory, Product, ProductTag, StoreCategory } from '@prisma/client';

/** Product with the relations the store endpoints always load. */
export type StoreProduct = Product & {
  category: PlatformCategory;
  tags: ProductTag[];
};

/** Store-owner `Product` shape (products.md). */
export interface StoreProductView {
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
 * Maps a product row. `currencyPrices` is currently a single SAR entry —
 * prices are stored in the store's base currency (multi-currency price lists
 * land with the accounting phase).
 */
export function toStoreProductView(product: StoreProduct, hasOffer: boolean): StoreProductView {
  const view: StoreProductView = {
    id: product.id,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    descriptionEn: product.descriptionEn ?? '',
    descriptionAr: product.descriptionAr ?? '',
    images: product.imageUrl ? [product.imageUrl] : [],
    price: product.price,
    currencyPrices: [{ currency: 'SAR', amount: product.price }],
    stock: product.stock,
    categoryId: product.storeCategoryId ?? '',
    hasOffer,
  };
  if (product.sku) view.sku = product.sku;
  return view;
}

/** Store-owner `Category` shape (categories.md) with computed product count. */
export interface StoreCategoryView {
  id: string;
  nameEn: string;
  nameAr: string;
  iconOrEmoji: string;
  productsCount: number;
}

export function toStoreCategoryView(
  category: StoreCategory,
  productsCount: number,
): StoreCategoryView {
  return {
    id: category.id,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    iconOrEmoji: category.emoji,
    productsCount,
  };
}

/** Store-owner `Order` shape (orders.md). */
export interface StoreOrderView {
  id: string;
  orderNumber: string;
  date: string;
  customerNameEn: string;
  customerNameAr: string;
  customerAddress?: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  currency: string;
  status: string;
}

export function toStoreOrderView(order: Order & { items: OrderItem[] }): StoreOrderView {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.toISOString().slice(0, 10),
    customerNameEn: order.customerNameEn,
    customerNameAr: order.customerNameAr,
    customerAddress: order.addressEn || undefined,
    items: order.items.map((item) => ({
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      qty: item.qty,
      price: item.price,
    })),
    total: order.total,
    currency: order.currency,
    status: order.status,
  };
}
