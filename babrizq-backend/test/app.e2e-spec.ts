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
