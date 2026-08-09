# Bab Rizq — Backend

NestJS + Prisma backend for the Bab Rizq marketplace platform (six role apps in `../apps`).

Modular monolith with **Clean Architecture** per module (`presentation / application / domain /
infrastructure`), JWT auth with refresh-token rotation, RBAC for the six platform roles, **Google
login**, a **swappable file-storage layer** (local / Azure Blob / AWS S3 via env), and a response
envelope that matches the frontend API contracts.

## Stack

NestJS 11 · TypeScript (strict) · Prisma 6 · SQLite (dev) · class-validator · Passport/JWT ·
google-auth-library · @nestjs/serve-static · @azure/storage-blob · @aws-sdk/client-s3 ·
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

## File storage — pick your driver with an env var

`STORAGE_DRIVER` switches the backend between three providers without code changes (domain modules
depend on the `StorageService` interface, never on a concrete driver):

| `STORAGE_DRIVER` | Provider | Required env | Notes |
|---|---|---|---|
| `local` (default) | Project folder (`STORAGE_PATH`, `./uploads`) | none | Files served at `/uploads/*` via ServeStaticModule — zero-config "native" option |
| `azure` | Azure Blob Storage | `AZURE_STORAGE_CONNECTION_STRING` (+ `AZURE_CONTAINER_NAME`) | |
| `s3` | AWS S3 | `AWS_S3_BUCKET` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | Public-read bucket (or CDN in front) |

Upload any file as an authenticated user:

```bash
curl -X POST http://localhost:3000/api/v1/files/upload?folder=products \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@photo.jpg"
# → { "isSuccess": true, "value": { "key": "products/<uuid>.jpg", "url": "/uploads/products/<uuid>.jpg" } }
```

## Google login

Two flows, both implemented with the official `google-auth-library` (no passport strategy):

1. **SPA id-token flow (recommended)** — the frontend gets a credential from Google Identity
   Services and posts it:

   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/google/token \
     -H "Content-Type: application/json" \
     -d '{ "idToken": "<credential from google.accounts.id>" }'
   # → { "isSuccess": true, "value": { "accessToken": "...", "refreshToken": "..." } }
   ```

2. **Redirect flow** — `GET /api/v1/auth/google` → Google consent screen →
   `GET /api/v1/auth/google/callback?code=...` → the backend exchanges the code and redirects the
   browser to `FRONTEND_REDIRECT_URL?accessToken=...&refreshToken=...&state=...`.

Behavior: an existing user with the same **verified** email gets the `googleId` linked to their
account; a first-time Google user gets a new `customer` account with password login disabled.
Config: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_REDIRECT_URL`
(create an OAuth client in the Google Cloud Console → APIs & Services → Credentials).

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
    ├── auth/                  #   login/register/refresh/logout/me, Google login
    │   ├── presentation/      #   controller + DTOs
    │   ├── application/       #   auth.service, token.service
    │   ├── domain/            #   domain errors, payload contracts
    │   └── infrastructure/    #   repositories, passport strategy, google-auth.service
    ├── storage/               #   swappable file storage (local | azure | s3) + upload endpoint
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
2. ✅ Storage layer: local / Azure Blob / S3 drivers + authenticated upload endpoint.
3. ✅ Google login: SPA id-token flow + redirect flow, account linking/upsert.
4. ⏳ Domain modules: customer (catalog/cart/checkout), store-owner, back-office, delivery, marketer, admin.
5. ⏳ Integrations: payments (Stripe/PayPal), email (Nodemailer + queue), PDF, QR, maps, Redis cache, WebSocket notifications.
6. ⏳ Hardening: rate-limit tuning, e2e coverage, Docker (compose file included), monitoring.

## Docs

- `docs/analysis.md` — Phase 1 analysis: ERD, entity specs, relationships matrix, API mapping.
- `env.example` — every environment variable (copy to `.env`; never commit `.env`).
- `docker-compose.yml` / `Dockerfile` — containerization (SQLite out of the box; Postgres/Redis commented in).
