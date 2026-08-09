# Delivery App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/DeliveryLayout.tsx` | `src/pages/DeliveryLayout.tsx` | copied verbatim |
| `src/pages/DeliveryOverview|Orders|OrderDetail|History|Profile.tsx` | `src/pages/…` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/fulfillmentData.ts` | `src/entities/fulfillmentData.ts` | `FullOrder`, `FullOrderStatus`, `MockDriver` + mocks |
| `src/features/orders/model/ordersContext.tsx` | `src/features/orders/model/ordersContext.tsx` | copied verbatim |
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
bun install && bun run typecheck && bun run build
```

## 5. Future cleanup (Phase 2)

- Split `fulfillmentData.ts` into `entities/order` + `entities/driver`.
- Add a driver-location reporter (see `REFACTOR_PLAN.md` §8 map notes) for live tracking.
- Add Vitest/Playwright coverage; introduce `VITE_API_URL` when the backend lands.
