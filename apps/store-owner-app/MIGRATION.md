# Store Owner App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/StoreOwnerLayout.tsx` | `src/pages/StoreOwnerLayout.tsx` | copied verbatim |
| `src/pages/StoreOwnerOverview|Products|Orders|Sales|Categories|Offers|Reports|Chat|Settings|Warehouse|Accounting.tsx` | `src/pages/…` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/storeOwnerData.ts` | `src/entities/storeOwnerData.ts` | interfaces `StoreProduct`, `StoreOrder`, `StoreCategory`, `Offer`, `ChatMessage`, `Supplier`, `StockMovement`, `Expense`, `Invoice`, `StoreSettings`, `CurrencyPrice` + mocks |
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

## 5. Future cleanup (Phase 2)

- Split `storeOwnerData.ts` (the largest legacy file, ~640 lines) into per-domain slices:
  `entities/product`, `entities/order`, `entities/warehouse`, `entities/accounting`, `entities/chat`.
- Introduce a store-owner `settings` feature context; add Vitest/Playwright coverage.
