/**
 * Cart feature — React context.
 *
 * Thin stateful wrapper over the pure functions in `./cartModel.ts`. Keeps the
 * cart lines in component state and exposes the same public API the UI already
 * consumes (`useCart()`). All business rules live in `cartModel.ts` so they are
 * unit-testable without React.
 */
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Product } from '~/entities/product';
import {
  CartItem,
  addItem as addItemModel,
  removeItem as removeItemModel,
  updateQuantity as updateQuantityModel,
  cartTotals,
} from './cartModel';

export type { CartItem } from './cartModel';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (product: Product) => setItems(prev => addItemModel(prev, product)),
    []
  );

  const removeItem = useCallback(
    (productId: string) => setItems(prev => removeItemModel(prev, productId)),
    []
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      setItems(prev => updateQuantityModel(prev, productId, quantity)),
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const { totalItems, totalPrice } = cartTotals(items);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
