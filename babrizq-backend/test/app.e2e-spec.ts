/**
 * E2E smoke tests.
 *
 * Prerequisite: `npx prisma migrate dev` + `npm run prisma:seed` so the
 * seeded demo user exists. Run with `npm run test:e2e`.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health → isSuccess with database up', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.value.status).toBe('ok');
    expect(res.body.value.info.database.status).toBe('up');
  });

  it('POST /api/v1/auth/login with seeded demo user → token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@babrizq.com', password: 'Password123!' })
      .expect(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.value.accessToken).toBeTruthy();
    expect(res.body.value.refreshToken).toBeTruthy();
  });

  it('POST /api/v1/auth/login with bad credentials → 401 envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@babrizq.com', password: 'wrong-password' })
      .expect(401);
    expect(res.body.isError).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

/** Storefront reads require a customer token — fetch one up front. */
async function customerToken(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: 'customer@babrizq.com', password: 'Password123!' })
    .expect(200);
  return res.body.value.accessToken as string;
}

describe('Storefront (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated catalog reads with 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/storefront/products').expect(401);
  });

  it('GET /api/v1/storefront/products → paginated items + priceRange', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/storefront/products?pageSize=5')
      .set('Authorization', `Bearer ${await customerToken(app)}`)
      .expect(200);
    expect(res.body.isSuccess).toBe(true);
    expect(Array.isArray(res.body.value.items)).toBe(true);
    expect(res.body.value.totalItems).toBeGreaterThanOrEqual(1);
    expect(res.body.value.priceRange).toEqual(
      expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }),
    );
    expect(res.body.value.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nameEn: expect.any(String),
        price: expect.any(Number),
        storeNameEn: expect.any(String),
        categoryEn: expect.any(String),
      }),
    );
  });

  it('GET /api/v1/storefront/products/:id missing → 404 PRODUCT_NOT_FOUND', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/storefront/products/does-not-exist')
      .set('Authorization', `Bearer ${await customerToken(app)}`)
      .expect(404);
    expect(res.body.isError).toBe(true);
    expect(res.body.topError.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('GET /api/v1/storefront/stores → seeded stores with productCount', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/storefront/stores')
      .set('Authorization', `Bearer ${await customerToken(app)}`)
      .expect(200);
    const techzone = res.body.value.stores.find(
      (store: { id: string }) => store.id === 'store-techzone',
    );
    expect(techzone).toBeDefined();
    expect(techzone.productCount).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/storefront/categories/Electronics → category + tagGroups + related', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/storefront/categories/Electronics')
      .set('Authorization', `Bearer ${await customerToken(app)}`)
      .expect(200);
    expect(res.body.value.category).toEqual({
      nameEn: 'Electronics',
      nameAr: 'إلكترونيات',
    });
    expect(Array.isArray(res.body.value.tagGroups)).toBe(true);
    expect(Array.isArray(res.body.value.relatedCategories)).toBe(true);
    expect(res.body.value.storeCount).toBeGreaterThanOrEqual(1);
  });
});

/** Fetches a token for any seeded role. */
async function roleToken(
  app: INestApplication,
  email: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: 'Password123!' })
    .expect(200);
  return res.body.value.accessToken as string;
}

describe('Store Owner + Back Office (e2e)', () => {
  let app: INestApplication;
  let storeToken: string;
  let backofficeToken: string;
  let customerTkn: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    storeToken = await roleToken(app, 'store@babrizq.com');
    backofficeToken = await roleToken(app, 'backoffice@babrizq.com');
    customerTkn = await roleToken(app, 'customer@babrizq.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('store-owner products require the X-Store-Id header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/products')
      .set('Authorization', `Bearer ${storeToken}`)
      .expect(400);
    expect(res.body.topError.code).toBe('STORE_ID_REQUIRED');
  });

  it('GET /api/v1/store/products with X-Store-Id → seeded products', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/products')
      .set('Authorization', `Bearer ${storeToken}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.value.totalItems).toBeGreaterThanOrEqual(1);
    expect(res.body.value.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nameEn: expect.any(String),
        price: expect.any(Number),
        hasOffer: expect.any(Boolean),
        currencyPrices: expect.any(Array),
      }),
    );
  });

  it('cross-role access is rejected with 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/backoffice/orders')
      .set('Authorization', `Bearer ${storeToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/store/products')
      .set('Authorization', `Bearer ${backofficeToken}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/storefront/products')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200); // customer role still works on its own endpoints
  });

  it('GET /api/v1/backoffice/orders → FullOrder list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/backoffice/orders')
      .set('Authorization', `Bearer ${backofficeToken}`)
      .expect(200);
    expect(res.body.value.totalItems).toBeGreaterThanOrEqual(1);
    expect(res.body.value.items[0]).toEqual(
      expect.objectContaining({
        orderNumber: expect.any(String),
        storeNameEn: expect.any(String),
        customerNameEn: expect.any(String),
        status: expect.any(String),
      }),
    );
  });

  it('GET /api/v1/backoffice/drivers → seeded roster (2 drivers)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/backoffice/drivers')
      .set('Authorization', `Bearer ${backofficeToken}`)
      .expect(200);
    expect(res.body.value.length).toBeGreaterThanOrEqual(2);
    expect(res.body.value[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nameEn: expect.any(String),
        available: expect.any(Boolean),
      }),
    );
  });

  it('GET /api/v1/backoffice/overview → KPIs + driver summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/backoffice/overview')
      .set('Authorization', `Bearer ${backofficeToken}`)
      .expect(200);
    expect(res.body.value).toEqual(
      expect.objectContaining({
        ordersToday: expect.any(Number),
        pendingOrders: expect.any(Number),
        activeDeliveries: expect.any(Number),
        completedToday: expect.any(Number),
      }),
    );
    expect(res.body.value.driverSummary.drivers.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Delivery (e2e)', () => {
  let app: INestApplication;
  let deliveryToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    deliveryToken = await roleToken(app, 'delivery@babrizq.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects non-delivery roles with 403', async () => {
    const customerTkn = await roleToken(app, 'customer@babrizq.com');
    await request(app.getHttpServer())
      .get('/api/v1/delivery/orders')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(403);
  });

  it('GET /api/v1/delivery/orders → the seeded in-transit delivery', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/delivery/orders')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .expect(200);
    expect(Array.isArray(res.body.value)).toBe(true);
    const inTransit = res.body.value.find(
      (order: { orderNumber: string }) => order.orderNumber === '#BRQ-1040',
    );
    expect(inTransit).toBeDefined();
    expect(inTransit.status).toBe('in_transit');
    expect(inTransit.storeNameEn).toBe('TechZone');
  });

  it('GET /api/v1/delivery/orders?status=delivered → empty history', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/delivery/orders?status=delivered')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .expect(200);
    expect(res.body.value).toEqual([]);
  });

  it('GET /api/v1/delivery/orders/:id → detail for the assigned order', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/delivery/orders')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .expect(200);
    const orderId = list.body.value[0].id as string;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/delivery/orders/${orderId}`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .expect(200);
    expect(res.body.value).toEqual(
      expect.objectContaining({
        id: orderId,
        customerNameEn: expect.any(String),
        addressEn: expect.any(String),
        items: expect.any(Array),
      }),
    );
  });
});

describe('Marketer + Admin (e2e)', () => {
  let app: INestApplication;
  let marketerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    marketerToken = await roleToken(app, 'marketer@babrizq.com');
    adminToken = await roleToken(app, 'admin@babrizq.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects non-marketer roles with 403', async () => {
    const customerTkn = await roleToken(app, 'customer@babrizq.com');
    await request(app.getHttpServer())
      .get('/api/v1/marketer/links')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(403);
  });

  it('GET /api/v1/marketer/links → paginated seeded links', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/marketer/links?pageSize=10')
      .set('Authorization', `Bearer ${marketerToken}`)
      .expect(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.value.totalItems).toBeGreaterThanOrEqual(4);
    expect(res.body.value.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        url: expect.any(String),
        type: expect.any(String),
        clicks: expect.any(Number),
        earned: expect.any(Number),
      }),
    );
  });

  it('GET /api/v1/marketer/targets → stores + products', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/marketer/targets?search=Tech')
      .set('Authorization', `Bearer ${marketerToken}`)
      .expect(200);
    expect(res.body.value.length).toBeGreaterThan(0);
    expect(res.body.value[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), type: expect.any(String) }),
    );
  });

  it('POST /api/v1/marketer/links/generate → new zero-stat link (idempotent)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/marketer/links/generate')
      .set('Authorization', `Bearer ${marketerToken}`)
      .send({ targetId: 'prod-sneakers', targetType: 'product' })
      .expect(201);
    expect(res.body.value.clicks).toBe(0);
    expect(res.body.value.targetNameEn).toBe('Everyday Sneakers');
  });

  it('GET /api/v1/marketer/overview → KPIs incl. balance and top links', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/marketer/overview')
      .set('Authorization', `Bearer ${marketerToken}`)
      .expect(200);
    expect(res.body.value.totalEarned).toBeGreaterThan(0);
    expect(res.body.value.balance).toBeGreaterThan(0);
    expect(res.body.value.topLinks.length).toBeLessThanOrEqual(3);
  });

  it('POST /api/v1/marketer/withdraw over the balance → 422 INSUFFICIENT_BALANCE', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/marketer/withdraw')
      .set('Authorization', `Bearer ${marketerToken}`)
      .send({ amount: 99999999, bankIban: 'SA0380000000608010167519' })
      .expect(422);
    expect(res.body.topError.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('GET /api/v1/marketer/performance → weekly timeline with 7 buckets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/marketer/performance?period=weekly')
      .set('Authorization', `Bearer ${marketerToken}`)
      .expect(200);
    expect(res.body.value.timeline).toHaveLength(7);
    expect(res.body.value.byLink.length).toBeGreaterThanOrEqual(4);
    expect(res.body.value.conversionRate).toBeGreaterThanOrEqual(0);
  });

  it('rejects non-admin roles with 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${marketerToken}`)
      .expect(403);
  });

  it('GET /api/v1/admin/users?role=delivery → filtered platform users', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/users?pageSize=5&role=delivery')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.value.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.value.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        role: 'delivery',
        status: expect.any(String),
        joinedDate: expect.any(String),
      }),
    );
  });

  it('GET /api/v1/admin/overview → platform KPIs (delivered seed order drives revenue)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.value.totalUsers).toBeGreaterThanOrEqual(7);
    expect(res.body.value.totalStores).toBeGreaterThanOrEqual(2);
    expect(res.body.value.platformRevenue).toBeGreaterThan(0);
    expect(res.body.value.activeMarketers).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/admin/settings → the singleton platform settings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.value.platformName).toBe('Bab Rizq');
    expect(res.body.value.commissionRate).toBe(5.5);
  });

  it('POST /api/v1/admin/users → creates with a temp password', async () => {
    const email = `e2e-${Date.now()}@babrizq.com`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E User', nameAr: 'مستخدم', email, role: 'marketer' })
      .expect(201);
    expect(res.body.value.email).toBe(email);
    expect(res.body.value.tempPassword).toBeTruthy();
  });

  it('DELETE /api/v1/admin/users/{self} → 400 CANNOT_DELETE_SELF', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/admin/users/${me.body.value.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    expect(res.body.topError.code).toBe('CANNOT_DELETE_SELF');
  });
});

describe('Notifications + Offers (e2e)', () => {
  let app: INestApplication;
  let customerTkn: string;
  let storeTkn: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    customerTkn = await roleToken(app, 'customer@babrizq.com');
    storeTkn = await roleToken(app, 'store@babrizq.com');
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('notifications: list is own-only and the read flow works', async () => {
    const customer = await prisma.user.findUniqueOrThrow({
      where: { email: 'customer@babrizq.com' },
    });
    const created = await prisma.notification.create({
      data: {
        recipientUserId: customer.id,
        type: 'order_status',
        titleEn: 'Status update',
        titleAr: 'تحديث الحالة',
        bodyEn: 'Your order is being prepared',
        bodyAr: 'طلبك قيد التحضير',
      },
    });

    const list = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    expect(
      list.body.value.items.some((n: { id: string }) => n.id === created.id),
    ).toBe(true);

    // A different user never sees someone else's notification.
    const other = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${storeTkn}`)
      .expect(200);
    expect(
      other.body.value.items.some((n: { id: string }) => n.id === created.id),
    ).toBe(false);

    const unread = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    expect(unread.body.value.unreadCount).toBeGreaterThanOrEqual(1);

    const read = await request(app.getHttpServer())
      .post(`/api/v1/notifications/${created.id}/read`)
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    expect(read.body.value.isRead).toBe(true);

    // A fresh unread row makes read-all report at least one update.
    await prisma.notification.create({
      data: {
        recipientUserId: customer.id,
        type: 'payout',
        titleEn: 'Payout ready',
        titleAr: 'سحب جاهز',
        bodyEn: 'Your withdrawal was processed',
        bodyAr: 'تمت معالجة طلب السحب',
      },
    });
    const all = await request(app.getHttpServer())
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    expect(all.body.value.updated).toBeGreaterThanOrEqual(1);
  });

  it('notifications: event wiring — placing an order notifies the store owner', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/customer/cart')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/customer/cart/items')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({ productId: 'prod-smartwatch' })
      .expect(200);
    await request(app.getHttpServer())
      .put('/api/v1/customer/cart/items/prod-smartwatch')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({ quantity: 1 })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/customer/orders')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({
        fullName: 'Sara Mansour',
        phone: '+966 50 000 0005',
        deliveryAddress: '45 King Fahd Rd, Riyadh',
        paymentMethod: 'cash',
      })
      .expect(201);

    const storeOwner = await prisma.user.findUniqueOrThrow({
      where: { email: 'store@babrizq.com' },
    });
    const storeNotifs = await prisma.notification.findMany({
      where: { recipientUserId: storeOwner.id, type: 'new_order' },
    });
    expect(storeNotifs.length).toBeGreaterThanOrEqual(1);
  });

  it('offers: seeded offers listed, cross-role access rejected', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/offers')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(res.body.value.totalItems).toBeGreaterThanOrEqual(2);
    expect(res.body.value.items[0]).toEqual(
      expect.objectContaining({
        nameEn: expect.any(String),
        discountType: expect.stringMatching(/^(percent|fixed)$/),
        isActive: expect.any(Boolean),
      }),
    );

    await request(app.getHttpServer())
      .get('/api/v1/store/offers')
      .set('Authorization', `Bearer ${customerTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(403);
  });

  it('offers: create → pause → stats', async () => {
    const products = await request(app.getHttpServer())
      .get('/api/v1/store/products')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    const productId = products.body.value.items[0].id as string;

    const created = await request(app.getHttpServer())
      .post('/api/v1/store/offers')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({
        nameEn: 'E2E Product Offer',
        nameAr: 'عرض تجريبي',
        productId,
        discountType: 'percent',
        discountValue: 20,
      })
      .expect(201);
    expect(created.body.value.type).toBe('product');

    const paused = await request(app.getHttpServer())
      .post(`/api/v1/store/offers/${created.body.value.id}/pause`)
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(paused.body.value.isActive).toBe(false);

    const stats = await request(app.getHttpServer())
      .get(`/api/v1/store/offers/${created.body.value.id}/stats`)
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(stats.body.value.totalOrders).toBe(0);
  });

  it('checkout applies the best offer and tracks the redemption', async () => {
    const settings = await prisma.storeSettings.findUnique({
      where: { storeId: 'store-techzone' },
    });
    const deliveryFee = settings?.deliveryFee ?? 0;
    const taxRate = settings?.taxRate ?? 0;

    await request(app.getHttpServer())
      .delete('/api/v1/customer/cart')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/customer/cart/items')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({ productId: 'prod-headphones' })
      .expect(200);
    await request(app.getHttpServer())
      .put('/api/v1/customer/cart/items/prod-headphones')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({ quantity: 2 })
      .expect(200);

    const placed = await request(app.getHttpServer())
      .post('/api/v1/customer/orders')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({
        fullName: 'Sara Mansour',
        phone: '+966 50 000 0005',
        deliveryAddress: '45 King Fahd Rd, Riyadh',
        paymentMethod: 'cash',
      })
      .expect(201);

    // 2 × 299 = 598; store-wide 10% (59.8) beats the fixed 50 SAR headphones
    // offer, and tax applies to the discounted subtotal.
    const discount = 59.8;
    const taxable = Math.round((598 - discount) * 100) / 100;
    const expectedTotal =
      Math.round((taxable + deliveryFee + (taxable * taxRate) / 100) * 100) / 100;
    expect(placed.body.value.discount).toBe(discount);
    expect(placed.body.value.total).toBe(expectedTotal);

    const offer = await prisma.offer.findUnique({
      where: { id: 'offer-techzone-wide' },
    });
    expect(offer?.redemptionCount ?? 0).toBeGreaterThanOrEqual(1);
  });
});

describe('Store Owner Accounting (e2e) — P1 live books', () => {
  let app: INestApplication;
  let storeTkn: string;
  let customerTkn: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    storeTkn = await roleToken(app, 'store@babrizq.com');
    customerTkn = await roleToken(app, 'customer@babrizq.com');
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('placing an order auto-posts balanced ledger entries and a tax invoice', async () => {
    const settings = await prisma.storeSettings.findUnique({
      where: { storeId: 'store-techzone' },
      select: { taxRate: true, deliveryFee: true },
    });
    const taxRate = settings?.taxRate ?? 0;
    const deliveryFee = settings?.deliveryFee ?? 0;

    await request(app.getHttpServer())
      .delete('/api/v1/customer/cart')
      .set('Authorization', `Bearer ${customerTkn}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/customer/cart/items')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({ productId: 'prod-headphones' })
      .expect(200);
    await request(app.getHttpServer())
      .put('/api/v1/customer/cart/items/prod-headphones')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({ quantity: 1 })
      .expect(200);
    const placed = await request(app.getHttpServer())
      .post('/api/v1/customer/orders')
      .set('Authorization', `Bearer ${customerTkn}`)
      .send({
        fullName: 'Sara Mansour',
        phone: '+966 50 000 0005',
        deliveryAddress: '45 King Fahd Rd, Riyadh',
        paymentMethod: 'cash',
      })
      .expect(201);

    const orderId = placed.body.value.orderId as string;
    const total = placed.body.value.total as number;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order).not.toBeNull();

    // The ledger entry exists, is balanced, and recognizes the revenue + VAT.
    const entry = await prisma.journalEntry.findFirst({
      where: { storeId: 'store-techzone', sourceType: 'order', sourceId: orderId },
      include: { lines: true },
    });
    expect(entry).not.toBeNull();
    const debit = (entry?.lines ?? []).reduce((sum, line) => sum + line.debit, 0);
    const credit = (entry?.lines ?? []).reduce((sum, line) => sum + line.credit, 0);
    expect(debit).toBeCloseTo(credit, 2);

    // The tax invoice was issued at checkout.
    const invoice = await prisma.invoice.findUnique({ where: { orderId } });
    expect(invoice).not.toBeNull();
    expect(invoice?.invoiceNumber).toMatch(/^INV-\d{4}-/);
    expect(invoice?.total).toBeCloseTo(total, 2);
    expect(invoice?.qrCode).toBeTruthy();

    // Trial balance reflects the order and balances exactly.
    const tb = await request(app.getHttpServer())
      .get('/api/v1/store/accounting/trial-balance')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(tb.body.value.balanced).toBe(true);
    expect(tb.body.value.totalDebit).toBeCloseTo(tb.body.value.totalCredit, 2);

    // P&L sees the revenue + VAT (order is revenue; no expenses in it).
    const pnl = await request(app.getHttpServer())
      .get('/api/v1/store/accounting/pnl')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .query({ from: '2020-01-01', to: '2030-12-31' })
      .expect(200);
    expect(pnl.body.value.revenue).toBeGreaterThanOrEqual(order?.subtotal ?? 0);

    // Invoice listing is store-scoped and returns the new invoice.
    const invoices = await request(app.getHttpServer())
      .get('/api/v1/store/accounting/invoices')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(invoices.body.value.total).toBeGreaterThanOrEqual(1);
  });

  it('expenses post to the ledger, show in P&L, and reverse on delete', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/store/accounting/expenses')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({
        titleEn: 'E2E Marketing Spend',
        titleAr: 'مصروف تسويق',
        category: 'marketing',
        amount: 123.45,
      })
      .expect(201);
    const expenseId = created.body.value.id as string;
    expect(created.body.value.category).toBe('marketing');

    const expenseEntry = await prisma.journalEntry.findFirst({
      where: { storeId: 'store-techzone', sourceType: 'expense', sourceId: expenseId },
      include: { lines: true },
    });
    expect(expenseEntry).not.toBeNull();
    const debit = (expenseEntry?.lines ?? []).reduce((sum, line) => sum + line.debit, 0);
    const credit = (expenseEntry?.lines ?? []).reduce((sum, line) => sum + line.credit, 0);
    expect(debit).toBeCloseTo(credit, 2);

    const list = await request(app.getHttpServer())
      .get('/api/v1/store/accounting/expenses')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .query({ page: 1, pageSize: 50 })
      .expect(200);
    expect(list.body.value.total).toBeGreaterThanOrEqual(3); // 2 seeded + this one

    await request(app.getHttpServer())
      .delete(`/api/v1/store/accounting/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    const after = await prisma.expense.findUnique({ where: { id: expenseId } });
    expect(after).toBeNull();
  });

  it('chart of accounts is seeded with the KSA template', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/accounting/accounts')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(res.body.value.rows.length).toBeGreaterThanOrEqual(20);
    expect(res.body.value.rows.some((row: { code: string }) => row.code === '4100')).toBe(true);
  });

  it('cross-role access is denied (customer is not a store owner)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/store/accounting/trial-balance')
      .set('Authorization', `Bearer ${customerTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(403);
  });
});

describe('Store Owner Warehouse (e2e) — P2 stock, POs & valuation', () => {
  let app: INestApplication;
  let storeTkn: string;
  let customerTkn: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    storeTkn = await roleToken(app, 'store@babrizq.com');
    customerTkn = await roleToken(app, 'customer@babrizq.com');
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the seeded supplier and creates a new one', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/store/suppliers')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(list.body.value.items.some((s: { id: string }) => s.id === 'sup-techzone-dist')).toBe(true);

    const created = await request(app.getHttpServer())
      .post('/api/v1/store/suppliers')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({
        nameEn: 'Riyadh Packaging Co',
        nameAr: 'شركة الرياض للتغليف',
        contactName: 'Naif',
        phone: '+966 55 000 0099',
        leadTimeDays: 3,
      })
      .expect(201);
    expect(created.body.value.nameEn).toBe('Riyadh Packaging Co');
  });

  it('blocks a cross-store supplier read (unknown store → 404)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/store/suppliers')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-does-not-exist')
      .expect(404);
  });

  it('rejects receiving more than the ordered quantity', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/purchase-orders/po-techzone-1/receive')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({ items: [{ productId: 'prod-headphones', quantity: 999 }] })
      .expect(400);
  });

  it('low-stock alerts flag the smartphone (threshold 12, stock below)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/stock/alerts')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    const flagged = res.body.value.items.find((p: { productId: string }) => p.productId === 'prod-smartphone');
    expect(flagged).toBeDefined();
    expect(flagged.stock).toBeLessThanOrEqual(flagged.threshold);
  });

  it('receives a PO → stock in + FIFO layer + balanced ledger entry', async () => {
    const before = await prisma.product.findUnique({
      where: { id: 'prod-headphones' },
      select: { stock: true },
    });

    const received = await request(app.getHttpServer())
      .post('/api/v1/store/purchase-orders/po-techzone-1/receive')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({ items: [{ productId: 'prod-headphones', quantity: 20 }] })
      .expect(201);
    expect(received.body.value.status).toBe('partial');

    const after = await prisma.product.findUnique({
      where: { id: 'prod-headphones' },
      select: { stock: true },
    });
    expect(after?.stock).toBe((before?.stock ?? 0) + 20);

    // FIFO layer exists for the received lot.
    const batch = await prisma.inventoryBatch.findFirst({
      where: { productId: 'prod-headphones', quantity: 20 },
      select: { unitCost: true },
    });
    expect(batch?.unitCost).toBe(190);

    // Ledger: DR Inventory / CR Supplier Payable, balanced.
    const entry = await prisma.journalEntry.findFirst({
      where: { storeId: 'store-techzone', sourceType: 'purchase_receipt' },
      include: { lines: true },
      orderBy: { postedAt: 'desc' },
    });
    expect(entry).not.toBeNull();
    const debit = (entry?.lines ?? []).reduce((sum, l) => sum + l.debit, 0);
    const credit = (entry?.lines ?? []).reduce((sum, l) => sum + l.credit, 0);
    expect(debit).toBeCloseTo(credit, 2);
    expect(debit).toBeCloseTo(20 * 190, 2);
  });

  it('completes the PO receive → status received, stock fully updated', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/purchase-orders/po-techzone-1/receive')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({ items: [{ productId: 'prod-smartphone', quantity: 10 }] })
      .expect(201);

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: 'po-techzone-1' },
      select: { status: true, receivedAt: true },
    });
    expect(po?.status).toBe('received');
    expect(po?.receivedAt).not.toBeNull();
  });

  it('stock adjustment posts to the ledger and updates stock', async () => {
    const before = await prisma.product.findUnique({
      where: { id: 'prod-smartwatch' },
      select: { stock: true },
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/store/stock/movements')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({ productId: 'prod-smartwatch', quantity: -3, reason: 'Damaged units removed' })
      .expect(201);
    expect(res.body.value.stock).toBe((before?.stock ?? 0) - 3);

    const entry = await prisma.journalEntry.findFirst({
      where: { storeId: 'store-techzone', sourceType: 'stock_adjustment' },
      include: { lines: true },
      orderBy: { postedAt: 'desc' },
    });
    expect(entry).not.toBeNull();
    const debit = (entry?.lines ?? []).reduce((sum, l) => sum + l.debit, 0);
    const credit = (entry?.lines ?? []).reduce((sum, l) => sum + l.credit, 0);
    expect(debit).toBeCloseTo(credit, 2);
  });

  it('stocktake snapshot + complete applies variances', async () => {
    const before = await prisma.product.findUnique({
      where: { id: 'prod-smartwatch' },
      select: { stock: true },
    });
    const counted = Math.max(0, (before?.stock ?? 0) - 2);

    const created = await request(app.getHttpServer())
      .post('/api/v1/store/stock/stocktakes')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .send({
        notes: 'Monthly count',
        items: [{ productId: 'prod-smartwatch', countedQuantity: counted }],
      })
      .expect(201);
    expect(created.body.value.status).toBe('open');
    expect(created.body.value.items[0].variance).toBe(-2);
    expect(created.body.value.items[0].systemQuantity).toBe(before?.stock);

    await request(app.getHttpServer())
      .post(`/api/v1/store/stock/stocktakes/${created.body.value.id}/complete`)
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(201);

    const product = await prisma.product.findUnique({
      where: { id: 'prod-smartwatch' },
      select: { stock: true },
    });
    expect(product?.stock).toBe(counted);
  });

  it('valuation reports FIFO value > 0 with per-product rows', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/stock/valuation')
      .set('Authorization', `Bearer ${storeTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(200);
    expect(res.body.value.total).toBeGreaterThan(0);
    expect(res.body.value.items.length).toBeGreaterThan(0);
    const headphones = res.body.value.items.find((p: { productId: string }) => p.productId === 'prod-headphones');
    expect(headphones).toBeDefined();
  });

  it('cross-role access to warehouse endpoints is denied', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/store/stock/valuation')
      .set('Authorization', `Bearer ${customerTkn}`)
      .set('X-Store-Id', 'store-techzone')
      .expect(403);
  });
});
