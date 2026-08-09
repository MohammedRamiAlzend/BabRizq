# Back Office App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/BackOfficeLayout.tsx` | `src/pages/BackOfficeLayout.tsx` | copied verbatim |
| `src/pages/BackOfficeOverview|Orders|ShipmentDetail|Drivers|Map|Notifications|Chat.tsx` | `src/pages/…` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/fulfillmentData.ts` | `src/entities/fulfillmentData.ts` | `FullOrder`, `FullOrderStatus`, `MockDriver` + mocks |
| `src/entities/backOfficeData.ts` | `src/entities/backOfficeData.ts` | notifications, chat conversations, `DriverLocation` |
| `src/entities/storeOwnerData.ts` | `src/entities/storeOwnerData.ts` | only `STORE_PRODUCTS` is used (stock checks) |
| `src/features/orders/model/ordersContext.tsx` | `src/features/orders/model/ordersContext.tsx` | copied verbatim |
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
bun install && bun run typecheck && bun run build
```

## 5. Future cleanup (Phase 2)

- Split `fulfillmentData.ts` into `entities/order` + `entities/driver`; split `backOfficeData.ts`
  into notifications/chat/map slices.
- Move the live map to a maps provider (see `REFACTOR_PLAN.md` §8 service notes).
- Add Vitest/Playwright coverage; introduce `VITE_API_URL` when the backend lands.
