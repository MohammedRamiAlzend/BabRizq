# Store Owner App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/StoreOwnerLayout.tsx` | `src/pages/StoreOwnerLayout.tsx` | copied verbatim |
| `src/pages/StoreOwnerOverview|Products|Orders|Sales|Categories|Offers|Reports|Chat|Settings|Warehouse|Accounting.tsx` | `src/pages/…` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/storeOwnerData.ts` | `src/entities/{product,category,order,offer,chat,warehouse,accounting,settings,sales,currency}/{model,api,index}` | **Phase 2** — split into per-domain FSD slices |
| `src/shared/ui/StoreOwnerSidebar.tsx` | `src/shared/ui/StoreOwnerSidebar.tsx` | copied verbatim |
| shared ui/contexts/hooks/lib + AppHeader/NavLink/OrderBadge/Pagination | `packages/shared/…` | shared via aliases |
| `needed-endpoints-for-backend/store-owner/*` | `docs/needed-endpoints-from-backend/…` | generated at migration time |

**Not carried over** (never routed in legacy): `Index.tsx`, `DashboardPage.tsx`, `NotFound.tsx`.

## 2. What changed vs. legacy

- **Single-role auth** — demo login `1`/`1` → store-owner session (mock JWT).
- **New app shell** — configs, providers, router, role-specific `index.html`.
- **No source edits** to copied pages — the alias map re-wires every import. (Note: legacy
  `StoreOwnerSales.tsx` had tsc errors purely because `~/entities/*` was missing from the legacy
  `tsconfig.app.json` paths — those resolve correctly in this app.)

## 3. Mock data & backend handoff

| Mock | Endpoint (per docs) |
|---|---|
| `STORE_PRODUCTS` / CRUD | `GET/POST /api/store-owner/products` · `PUT/DELETE /api/store-owner/products/{id}` |
| `STORE_ORDERS` | `GET /api/store-owner/orders?status=` · `PUT /api/store-owner/orders/{id}/status` |
| `MONTHLY_SALES_DATA`, `CURRENCY_REVENUE` | `GET /api/store-owner/sales` · `GET /api/store-owner/reports/summary` |
| `STORE_CATEGORIES` | `GET/POST /api/store-owner/categories` |
| `STORE_OFFERS` | `GET/POST /api/store-owner/offers` · `PUT /api/store-owner/offers/{id}` |
| `INITIAL_CHAT_MESSAGES` | `GET/POST /api/store-owner/chat` |
| `STOCK_MOVEMENTS`, `STORE_SUPPLIERS` | `GET/POST /api/store-owner/warehouse/…` |
| `STORE_EXPENSES`, `STORE_INVOICES` | `GET/POST /api/store-owner/accounting/…` |
| `DEFAULT_STORE_SETTINGS` | `GET/PUT /api/store-owner/settings` |
| auth | `POST /api/auth/login` · `GET /api/auth/me` |

## 4. Validation

```bash
bun install && bun run typecheck && bun run build
```

## 5. Phase 2 cleanup (done) & remaining work

**Completed in `feat/store-owner-app-implementation`:**

- **Entity slices** — `entities/storeOwnerData.ts` (~640 lines) split into ten FSD domain
  slices, each with `model.ts` (interfaces) + `api.ts` (fetch-ready mock functions) + `index.ts`:
  `product` (StoreProduct, CurrencyPrice, PriceEntry, CRUD), `category`, `order` (status
  filtering + transitions), `offer`, `chat`, `warehouse` (Supplier, StockMovement),
  `accounting` (Expense, Invoice), `settings`, `sales` (typed MonthlySalesPoint /
  CurrencyRevenue), `currency` (reference list). Every api function carries a
  `TODO(migration)` comment naming the backend endpoint it simulates.
- **Strict TypeScript** — `strict: true` + `noImplicitAny: true` enabled; the app typechecks
  clean.
- **Unit tests** — Vitest (`bun test`) with per-slice API contract tests (products CRUD, order
  status, invoice math invariant, warehouse product links, offers, settings, sales, chat,
  categories, currencies).

**Still open:**

- Playwright smoke tests (login `1`/`1`, browse the store-owner pages).
- Introduce `VITE_API_URL` + replace mock APIs with `fetch` when the backend lands (Phase 4).
- A `settings` feature context is optional once real API state management is introduced.
