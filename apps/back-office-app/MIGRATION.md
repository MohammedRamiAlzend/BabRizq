# Back Office App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/BackOfficeLayout.tsx` | `src/pages/BackOfficeLayout.tsx` | copied verbatim |
| `src/pages/BackOfficeOverview|Orders|ShipmentDetail|Drivers|Map|Notifications|Chat.tsx` | `src/pages/…` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/fulfillmentData.ts` | `src/entities/order/` + `src/entities/driver/` | **Phase 2** — `FullOrder`/`FullOrderStatus` live in `packages/shared/src/lib/order.ts`; the slices re-export them |
| `src/entities/backOfficeData.ts` | `src/entities/{notification,chat,map}/` | **Phase 2** — split into domain slices |
| `src/entities/storeOwnerData.ts` | `src/entities/product/` | **Phase 2** — only `STORE_PRODUCTS` is used (stock checks) |
| `src/features/orders/model/ordersContext.tsx` | `src/features/orders/model/ordersContext.tsx` | **Phase 2** — pure logic extracted to `orderModel.ts`; context is now a thin wrapper |
| `src/shared/ui/BackOfficeSidebar.tsx` | `src/shared/ui/BackOfficeSidebar.tsx` | copied verbatim |
| shared ui/contexts/hooks/lib + AppHeader/NavLink/OrderBadge/Pagination/ProofOfDeliveryModal | `packages/shared/…` | shared via aliases |
| `needed-endpoints-for-backend/back-office/*` | `docs/needed-endpoints-from-backend/…` | generated at migration time |

**Not carried over**: `BackOfficePage.tsx` (never routed in legacy) and other un-routed leftovers.

## 2. What changed vs. legacy

- **Single-role auth** — demo login `1`/`1` → back-office session (mock JWT).
- **New app shell** — configs, providers, router, role-specific `index.html`.
- **No source edits** to copied pages — the alias map re-wires every import.

## 3. Mock data & backend handoff

| Mock | Endpoint (per docs) |
|---|---|
| `ALL_ORDERS` / `useOrders` | `GET /api/backoffice/orders?page=&pageSize=&search=&status=` |
| `assignDriver` | `PUT /api/backoffice/orders/{id}/assign-driver` |
| `updateStatus` | `PUT /api/backoffice/orders/{id}/status` |
| `MOCK_DRIVERS` | `GET /api/backoffice/drivers` |
| `DRIVER_LOCATIONS` | `GET /api/backoffice/map/drivers` (live driver tracking) |
| `INITIAL_NOTIFICATIONS` | `GET /api/backoffice/notifications` |
| `INITIAL_CONVERSATIONS` (chat) | `GET/POST /api/backoffice/chat` (realtime) |
| `STORE_PRODUCTS` (stock check) | `GET /api/store-owner/products/{id}/stock` |
| auth | `POST /api/auth/login` · `GET /api/auth/me` |

## 4. Validation

```bash
bun install && bun run typecheck && bun run test && bun run build
```

## 5. Phase 2 completed (entity layer cleanup)

Done on `feat/back-office-app-implementation`:

- **Entity slices** — the three legacy entity files are gone, replaced by six FSD domain slices,
  each `model.ts` (interfaces) + `api.ts` (fetch-ready mocks annotated with the exact endpoint
  they simulate via `TODO(migration)` comments) + `index.ts` (barrel):
  `entities/{order, driver, notification, chat, map, product}`.
- **Shared order contract** — `FullOrder` / `FullOrderStatus` moved to
  `packages/shared/src/lib/order.ts` (single source of truth); the shared `OrderBadge` and
  `ProofOfDeliveryModal` consume it directly and the back-office `order` slice re-exports it
  (this also removed the shared→entities cross-layer imports that would have broken the
  delivery app in its own Phase 2).
- **Pure order model** — `features/orders/model/orderModel.ts` holds the immutable
  `assignDriver` / `updateStatus` / `setProofOfDelivery` functions; `ordersContext.tsx` is a
  thin stateful wrapper with the same public API.
- **Strict TypeScript** — `strict: true` + `noImplicitAny: true`; the app typechecks clean.
- **Tests** — Vitest (`bun run test`): 7 files covering the order/driver/notification/chat/map/
  product APIs and the pure order model (25 tests).

## 6. Future cleanup (Phase 3+)

- Move the live map to a maps provider (see `REFACTOR_PLAN.md` §8 service notes).
- `packages/shared/src/ui/AppHeader.tsx` still resolves the per-app auth feature
  (`@/features/auth/…`) — works in every single-role app today; revisit if shared needs to
  become fully app-agnostic.
- Add Playwright e2e coverage; introduce `VITE_API_URL` when the backend lands.
