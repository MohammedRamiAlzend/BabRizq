# Bab Rizq — Backend

NestJS + Prisma backend for the Bab Rizq marketplace platform (six role apps in `../apps`).

Modular monolith with **Clean Architecture** per module (`presentation / application / domain /
infrastructure`), JWT auth with refresh-token rotation, RBAC for the six platform roles, and a
response envelope that matches the frontend API contracts.

## Stack

NestJS 11 · TypeScript (strict) · Prisma 6 · SQLite (dev) · class-validator · Passport/JWT ·
Swagger · Jest · Helmet · Throttler · pino-http

## Quick start

```bash
cd babrizq-backend
npm install

# 1. Configure environment
cp env.example .env   # then edit secrets (dev defaults work out of the box)

# 2. Create the database schema + seed demo data
npx prisma migrate dev --name init
npm run prisma:seed

# 3. Run
npm run start:dev     # API at http://localhost:3000/api/v1 — Swagger at http://localhost:3000/docs
```

## Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Customer | `customer@babrizq.com` | `Password123!` |
| Store owner | `store@babrizq.com` | `Password123!` |
| Back office | `backoffice@babrizq.com` | `Password123!` |
| Delivery | `delivery@babrizq.com` | `Password123!` |
| Marketer | `marketer@babrizq.com` | `Password123!` |
| Admin | `admin@babrizq.com` | `Password123!` |

## Scripts

| Command | Purpose |
|---|---|
| `npm run start:dev` | Watch mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Jest unit tests |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply migrations (production, idempotent) |
| `npm run prisma:seed` | Seed demo data |
| `npm run test:e2e` | e2e suite (requires a running DB) |

## Architecture

```
src/
├── main.ts                    # bootstrap: helmet, CORS, prefix, validation, Swagger
├── app.module.ts              # root wiring + global guards/filter/interceptor
├── shared/                    # shared kernel (config, envelope, guards, pagination, roles)
│   ├── config/                #   validated env → typed AppConfig
│   └── common/                #   response envelope, exception filter, RBAC, pagination, decorators
└── modules/                   # feature modules (clean architecture)
    ├── prisma/                #   global Prisma client
    ├── auth/                  #   login/register/refresh/logout/me + JWT strategy
    │   ├── presentation/      #   controller + DTOs
    │   ├── application/       #   auth.service, token.service
    │   ├── domain/            #   domain errors, payload contracts
    │   └── infrastructure/    #   repositories, passport strategy
    └── health/                #   liveness/readiness
```

## API conventions

- **Prefix**: `/api/v1` — **Swagger**: `/docs` (Bearer auth).
- **Response envelope** (matches the frontend contracts in each app's
  `docs/needed-endpoints-from-backend/_shared.md`):

  ```json
  { "isSuccess": true, "isError": false, "errors": [], "topError": null, "value": { } }
  ```

  Errors: `{ "isSuccess": false, "isError": true, "errors": ["..."], "topError": { "code": "...", "httpStatus": 400 }, "value": null }`
- **Pagination** (list endpoints): `value: { items, totalItems, page, pageSize, totalPages }`
- **Auth**: `Authorization: Bearer <accessToken>`; refresh via `POST /api/v1/auth/refresh`.

## Database

`prisma/schema.prisma` models the full ERD (see `docs/analysis.md`). SQLite is the default dev
provider; to switch to Postgres/MySQL change the `provider` in the schema + `DATABASE_URL`, then
`npx prisma migrate dev` — no SQL dialect is used anywhere.

## Roadmap

1. ✅ Core: scaffold, config, shared kernel, Prisma schema + seed, auth/RBAC, health, Swagger.
2. ⏳ Domain modules: customer (catalog/cart/checkout), store-owner, back-office, delivery, marketer, admin.
3. ⏳ Integrations: payments (Stripe/PayPal), email (Nodemailer + queue), PDF, QR, maps, storage, Redis cache, WebSocket notifications.
4. ⏳ Hardening: rate-limit tuning, e2e coverage, Docker (compose file included), monitoring.

## Docs

- `docs/analysis.md` — Phase 1 analysis: ERD, entity specs, relationships matrix, API mapping.
- `env.example` — every environment variable (copy to `.env`; never commit `.env`).
- `docker-compose.yml` / `Dockerfile` — containerization (SQLite out of the box; Postgres/Redis commented in).
