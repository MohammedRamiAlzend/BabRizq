# Delivery App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/DeliveryLayout.tsx` | `src/pages/DeliveryLayout.tsx` | copied verbatim |
| `src/pages/DeliveryOverview|Orders|OrderDetail|History|Profile.tsx` | `src/pages/…` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/fulfillmentData.ts` | `src/entities/order/` + `src/entities/driver/` | **Phase 2** — `FullOrder`/`FullOrderStatus` live in `packages/shared/src/lib/order.ts`; the slices re-export them |
| `src/features/orders/model/ordersContext.tsx` | `src/features/orders/model/ordersContext.tsx` | **Phase 2** — pure logic extracted to `orderModel.ts`; context is now a thin wrapper |
| `src/shared/ui/DeliverySidebar.tsx` | `src/shared/ui/DeliverySidebar.tsx` | copied verbatim |
| shared ui/contexts/hooks/lib + AppHeader/NavLink/OrderBadge/Pagination/ProofOfDeliveryModal | `packages/shared/…` | shared via aliases |
| `needed-endpoints-for-backend/delivery-driver/*` | `docs/needed-endpoints-from-backend/…` | generated at migration time |

**Not carried over**: `DeliveryDriverPage.tsx` (never routed in legacy) and other un-routed leftovers.

## 2. What changed vs. legacy

- **Single-role auth** — demo login `1`/`1` → delivery session (mock JWT).
- **New app shell** — configs, providers, router, role-specific `index.html`.
- **No source edits** to copied pages — the alias map re-wires every import.

## 3. Mock data & backend handoff

| Mock | Endpoint (per docs) |
|---|---|
| `ALL_ORDERS` / `useOrders` | `GET /api/delivery/orders?status=` (assigned to me) |
| `updateStatus` (picked up / in transit / delivered) | `PUT /api/delivery/orders/{id}/status` |
| `setProofOfDelivery` | `POST /api/delivery/orders/{id}/proof-of-delivery` |
| history | `GET /api/delivery/history` |
| profile | `GET/PUT /api/delivery/me` |
| auth | `POST /api/auth/login` · `GET /api/auth/me` |

## 4. Validation

```bash
bun install && bun run typecheck && bun run test && bun run build
```

## 5. Phase 2 completed (entity layer cleanup)

Done on `feat/delivery-app-implementation`:

- **Entity slices** — `entities/fulfillmentData.ts` is gone, replaced by two FSD domain slices,
  each `model.ts` (interfaces) + `api.ts` (fetch-ready mocks annotated with the exact endpoint
  they simulate via `TODO(migration)` comments) + `index.ts` (barrel):
  `entities/order` and `entities/driver`.
- **Shared order contract** — `FullOrder` / `FullOrderStatus` moved to
  `packages/shared/src/lib/order.ts` (single source of truth, shared with the back-office app);
  the shared `OrderBadge` and `ProofOfDeliveryModal` consume it directly and the `order` slice
  re-exports it.
- **Pure order model** — `features/orders/model/orderModel.ts` holds the immutable
  `assignDriver` / `updateStatus` / `setProofOfDelivery` functions; `ordersContext.tsx` is a
  thin stateful wrapper with the same public API.
- **Strict TypeScript** — `strict: true` + `noImplicitAny: true`; the app typechecks clean.
- **Tests** — Vitest (`bun run test`): 3 files covering the order/driver APIs and the pure
  order model (13 tests).

## 6. Future cleanup (Phase 3+)

- Add a driver-location reporter (see `REFACTOR_PLAN.md` §8 map notes) for live tracking.
- Add Playwright e2e coverage; introduce `VITE_API_URL` when the backend lands.
