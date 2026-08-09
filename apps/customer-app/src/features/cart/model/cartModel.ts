/**
 * Cart domain logic — pure, framework-free functions.
 *
 * Extracted from `cartContext.tsx` during the Phase 2 cleanup so the cart's
 * behaviour (add / remove / update quantity / totals) can be unit-tested
 * without rendering React. The context (`./cartContext.tsx`) is now a thin
 * stateful wrapper over these functions.
 *
 * TODO(migration): when the backend lands these map 1:1 to the cart endpoints
 * in `docs/needed-endpoints-from-backend.md` (`POST /api/cart/items`,
 * `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`).
 */
import type { Product } from '~/entities/product';

/** A product line in the cart with its selected quantity. */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Aggregated totals shown in the cart drawer / checkout. */
export interface CartTotals {
  totalItems: number;
  totalPrice: number;
}

/**
 * Adds a product to the cart. If the product is already present its quantity
 * is incremented by one; otherwise a new line with quantity 1 is appended.
 * Returns a new array (immutable update).
 */
export function addItem(items: CartItem[], product: Product): CartItem[] {
  const existing = items.find(i => i.product.id === product.id);
  if (existing) {
    return items.map(i =>
      i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [...items, { product, quantity: 1 }];
}

/** Removes a product line from the cart entirely. */
export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter(i => i.product.id !== productId);
}

/**
 * Sets a product's quantity. Quantities of zero or less remove the line
 * (mirrors `PUT /api/cart/items/{id}` semantics).
 */
export function updateQuantity(
  items: CartItem[],
  productId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) return removeItem(items, productId);
  return items.map(i =>
    i.product.id === productId ? { ...i, quantity } : i
  );
}

/** Computes the number of distinct products and the summed price of all lines. */
export function cartTotals(items: CartItem[]): CartTotals {
  return {
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  };
}
