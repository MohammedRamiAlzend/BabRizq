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
