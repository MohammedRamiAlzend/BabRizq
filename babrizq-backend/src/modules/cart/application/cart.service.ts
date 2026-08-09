/**
 * Cart application service — server-side cart per authenticated customer.
 *
 * The cart row is lazily created on the first add (`Cart.customerUserId` is
 * unique). All mutations re-read the full cart so every response returns the
 * fresh `{ items, totalItems, totalPrice }` contract shape.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';
import { CartView, toCartView } from './cart.mapper';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /customer/cart — the customer's full cart. */
  async getCart(customerUserId: string): Promise<CartView> {
    const cart = await this.findCartWithItems(customerUserId);
    return toCartView(cart);
  }

  /**
   * POST /customer/cart/items — add a product (increments by 1 if present).
   * Errors: PRODUCT_NOT_FOUND (404), OUT_OF_STOCK (409, stock is 0),
   * INSUFFICIENT_STOCK (409, increment would exceed stock).
   */
  async addItem(customerUserId: string, productId: string): Promise<CartView> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });
    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }
    if (product.stock === 0) {
      throw ApiError.conflict('OUT_OF_STOCK', 'This product is out of stock');
    }

    const cart = await this.prisma.cart.upsert({
      where: { customerUserId },
      create: { customerUserId },
      update: {},
    });

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const newQuantity = (existing?.quantity ?? 0) + 1;
    if (newQuantity > product.stock) {
      throw ApiError.conflict(
        'INSUFFICIENT_STOCK',
        `Only ${product.stock} units available`,
      );
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    });

    return this.getCart(customerUserId);
  }

  /**
   * PUT /customer/cart/items/:productId — set quantity (≤ 0 removes).
   * Errors: ITEM_NOT_IN_CART (404), INSUFFICIENT_STOCK (409).
   */
  async updateItem(
    customerUserId: string,
    productId: string,
    quantity: number,
  ): Promise<CartView> {
    const cart = await this.findCartWithItems(customerUserId);
    const existing = cart?.items.find((item) => item.productId === productId);
    if (!cart || !existing) {
      throw ApiError.notFound('ITEM_NOT_IN_CART', 'This item is not in your cart');
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
      return this.getCart(customerUserId);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    if (product && quantity > product.stock) {
      throw ApiError.conflict(
        'INSUFFICIENT_STOCK',
        `Only ${product.stock} units available`,
      );
    }

    await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });
    return this.getCart(customerUserId);
  }

  /** DELETE /customer/cart/items/:productId — remove one item (lenient). */
  async removeItem(customerUserId: string, productId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({
      where: { customerUserId },
      select: { id: true },
    });
    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    }
    return this.getCart(customerUserId);
  }

  /** DELETE /customer/cart — clear the whole cart. */
  async clearCart(customerUserId: string): Promise<null> {
    const cart = await this.prisma.cart.findUnique({
      where: { customerUserId },
      select: { id: true },
    });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return null;
  }

  /** Loads the cart (or null) with product relations for mapping. */
  private findCartWithItems(customerUserId: string) {
    return this.prisma.cart.findUnique({
      where: { customerUserId },
      include: {
        items: {
          include: {
            product: {
              include: { store: true, category: true, tags: true },
            },
          },
        },
      },
    });
  }
}

/** Re-export for callers that type against the view directly. */
export type { CartView } from './cart.mapper';
export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: { include: { product: { include: { store: true; category: true; tags: true } } } };
  };
}>;
