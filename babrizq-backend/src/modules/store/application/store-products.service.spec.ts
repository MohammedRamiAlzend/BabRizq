/**
 * Unit tests for StoreProductsService — ownership checks, category
 * validation, and the `hasOffer` computation.
 */
import { StoreProductsService } from './store-products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.types';

const prisma = {
  store: { findUnique: jest.fn() },
  storeCategory: { findFirst: jest.fn() },
  product: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  offer: { findMany: jest.fn() },
} as unknown as PrismaService;

const storage = {
  save: jest.fn(),
} as unknown as StorageService;

const service = new StoreProductsService(prisma, storage);

const ownedStore = { id: 'store-techzone', ownerUserId: 'owner-1' };

const productRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  storeId: 'store-techzone',
  storeCategoryId: 'cat-1',
  categoryCode: 'Electronics',
  nameEn: 'Headphones',
  nameAr: 'سماعات',
  descriptionEn: 'd',
  descriptionAr: 'د',
  imageUrl: '/img.png',
  price: 299,
  stock: 45,
  sku: 'ELEC-001',
  status: 'active',
  isNew: false,
  isFeatured: true,
  rating: 4.7,
  reviewCount: 128,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { code: 'Electronics', nameAr: 'إلكترونيات' },
  tags: [],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('StoreProductsService.createProduct', () => {
  it('creates the product when the category belongs to the store', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.storeCategory.findFirst as jest.Mock).mockResolvedValue({ id: 'cat-1' });
    (prisma.product.create as jest.Mock).mockResolvedValue(productRow());

    const view = await service.createProduct('owner-1', 'store-techzone', {
      nameEn: 'Headphones',
      nameAr: 'سماعات',
      descriptionEn: 'd',
      descriptionAr: 'د',
      price: 299,
      stock: 45,
      categoryId: 'cat-1',
    });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storeId: 'store-techzone',
          storeCategoryId: 'cat-1',
          categoryCode: 'Electronics',
          price: 299,
          stock: 45,
        }),
      }),
    );
    expect(view).toMatchObject({ id: 'prod-1', hasOffer: false });
  });

  it('rejects a category that belongs to another store', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.storeCategory.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createProduct('owner-1', 'store-techzone', {
        nameEn: 'X',
        nameAr: 'ي',
        descriptionEn: 'd',
        descriptionAr: 'د',
        price: 10,
        stock: 1,
        categoryId: 'cat-999',
      }),
    ).rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND' });
    expect(prisma.product.create).not.toHaveBeenCalled();
  });
});

describe('StoreProductsService.listProducts', () => {
  it('computes hasOffer from the store active offers', async () => {
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(ownedStore);
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      productRow({ id: 'prod-1' }),
      productRow({ id: 'prod-2' }),
    ]);
    (prisma.product.count as jest.Mock).mockResolvedValue(2);
    // Store-wide active offer (productId null) → both products have an offer.
    (prisma.offer.findMany as jest.Mock).mockResolvedValue([
      { productId: null },
    ]);

    const page = await service.listProducts('owner-1', 'store-techzone', {
      page: 1,
      pageSize: 10,
    });

    expect(page.items.map((p) => p.hasOffer)).toEqual([true, true]);
  });
});
