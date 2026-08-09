/**
 * Unit tests for CartService — add/update/remove/clear with the documented
 * stock guards, using a mocked PrismaService.
 */
import { CartService } from './cart.service';
import { PrismaService } from '../../prisma/prisma.service';

const productRow = {
  id: 'prod-headphones',
  storeId: 'store-techzone',
  nameEn: 'Premium Wireless Headphones',
  nameAr: 'سماعات لاسلكية فاخرة',
  price: 299,
  originalPrice: 349,
  descriptionEn: 'ANC, 30h battery.',
  descriptionAr: 'إلغاء ضوضاء، بطارية 30 ساعة.',
  imageUrl: '/img.png',
  categoryCode: 'Electronics',
  rating: 4.7,
  reviewCount: 128,
  status: 'active',
  isNew: false,
  isFeatured: true,
  store: { id: 'store-techzone', nameEn: 'TechZone', nameAr: 'تك زون' },
  category: { code: 'Electronics', nameAr: 'إلكترونيات' },
  tags: [{ value: 'wireless' }],
};

const cartItem = (
  productId: string,
  quantity: number,
  overrides: Record<string, unknown> = {},
) => ({
  cartId: 'cart-1',
  productId,
  quantity,
  product: { ...productRow, id: productId, ...overrides },
});

const cartRow = (items: ReturnType<typeof cartItem>[]) => ({
  id: 'cart-1',
  customerUserId: 'customer-1',
  updatedAt: new Date(),
  items,
});

const prisma = {
  product: { findUnique: jest.fn() },
  cart: { upsert: jest.fn(), findUnique: jest.fn() },
  cartItem: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
} as unknown as PrismaService;

const service = new CartService(prisma);

beforeEach(() => jest.clearAllMocks());

describe('CartService.getCart', () => {
  it('returns an empty cart when the customer has none', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.getCart('customer-1')).resolves.toEqual({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  });

  it('computes totals from quantities and product prices', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(
      cartRow([
        cartItem('prod-headphones', 2),
        cartItem('prod-smartwatch', 1, { price: 499 }),
      ]),
    );
    const view = await service.getCart('customer-1');
    expect(view.totalItems).toBe(3);
    expect(view.totalPrice).toBe(2 * 299 + 499);
  });
});

describe('CartService.addItem', () => {
  it('creates the cart and the item on first add', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', stock: 10 });
    (prisma.cart.upsert as jest.Mock).mockResolvedValue({ id: 'cart-1', customerUserId: 'c1' });
    (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.cartItem.upsert as jest.Mock).mockResolvedValue(null);
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(cartRow([cartItem('p1', 1)]));

    await service.addItem('customer-1', 'p1');

    expect(prisma.cart.upsert).toHaveBeenCalledWith({
      where: { customerUserId: 'customer-1' },
      create: { customerUserId: 'customer-1' },
      update: {},
    });
    expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { cartId: 'cart-1', productId: 'p1', quantity: 1 } }),
    );
  });

  it('increments the quantity when the item is already in the cart', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', stock: 10 });
    (prisma.cart.upsert as jest.Mock).mockResolvedValue({ id: 'cart-1', customerUserId: 'c1' });
    (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue({ quantity: 2 });
    (prisma.cartItem.upsert as jest.Mock).mockResolvedValue(null);
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(cartRow([cartItem('p1', 3)]));

    await service.addItem('customer-1', 'p1');

    expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { quantity: { increment: 1 } } }),
    );
  });

  it('rejects unknown products with PRODUCT_NOT_FOUND', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.addItem('customer-1', 'ghost')).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    });
  });

  it('rejects zero-stock products with OUT_OF_STOCK', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', stock: 0 });
    await expect(service.addItem('customer-1', 'p1')).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
    });
  });

  it('rejects an increment that would exceed stock', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', stock: 2 });
    (prisma.cart.upsert as jest.Mock).mockResolvedValue({ id: 'cart-1', customerUserId: 'c1' });
    (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue({ quantity: 2 });
    await expect(service.addItem('customer-1', 'p1')).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    });
  });
});

describe('CartService.updateItem', () => {
  it('removes the item when quantity is 0 or less', async () => {
    // First call loads the cart (updateItem), second re-reads after delete (getCart).
    (prisma.cart.findUnique as jest.Mock)
      .mockResolvedValueOnce(cartRow([cartItem('p1', 5)]))
      .mockResolvedValueOnce(cartRow([]));
    (prisma.cartItem.delete as jest.Mock).mockResolvedValue(null);

    await service.updateItem('customer-1', 'p1', 0);

    expect(prisma.cartItem.delete).toHaveBeenCalledWith({
      where: { cartId_productId: { cartId: 'cart-1', productId: 'p1' } },
    });
  });

  it('throws ITEM_NOT_IN_CART for items missing from the cart', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(cartRow([]));
    await expect(service.updateItem('customer-1', 'p1', 2)).rejects.toMatchObject({
      code: 'ITEM_NOT_IN_CART',
    });
  });

  it('throws INSUFFICIENT_STOCK when the requested quantity exceeds stock', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(cartRow([cartItem('p1', 1)]));
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', stock: 2 });
    await expect(service.updateItem('customer-1', 'p1', 3)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    });
  });
});

describe('CartService.removeItem / clearCart', () => {
  it('removeItem is lenient when the cart does not exist', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.removeItem('customer-1', 'p1')).resolves.toMatchObject({
      items: [],
    });
    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('clearCart returns null', async () => {
    (prisma.cart.findUnique as jest.Mock).mockResolvedValue({ id: 'cart-1' });
    await expect(service.clearCart('customer-1')).resolves.toBeNull();
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'cart-1' },
    });
  });
});
