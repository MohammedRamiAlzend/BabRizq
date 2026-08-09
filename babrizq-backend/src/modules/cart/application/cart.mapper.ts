/**
 * Cart mapper — converts a loaded cart (items + full product relations) into
 * the customer `cart.md` contract shape.
 */
import { toProductView, ProductView } from '../../storefront/application/storefront.mapper';
import type { CartWithItems } from './cart.service';

/** Frontend `CartItem` (cart.md): productId + quantity + resolved product. */
export interface CartItemView {
  productId: string;
  quantity: number;
  product: ProductView;
}

/** Frontend cart response value. */
export interface CartView {
  items: CartItemView[];
  totalItems: number;
  totalPrice: number;
}

export const EMPTY_CART: CartView = { items: [], totalItems: 0, totalPrice: 0 };

/** Maps a loaded cart (or null) to the contract view with computed totals. */
export function toCartView(cart: CartWithItems | null): CartView {
  if (!cart || cart.items.length === 0) return EMPTY_CART;

  const items: CartItemView[] = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    product: toProductView(item.product),
  }));

  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
  };
}
