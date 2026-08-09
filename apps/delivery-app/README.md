# Bab Rizq — Delivery Driver App

The **delivery driver** application of the Bab Rizq marketplace platform (bilingual EN/AR,
RTL-aware). Shows assigned orders, per-order delivery details, delivery history, and the driver
profile.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query

## Run

```bash
bun install        # from the repo root (bun workspaces)
bun run dev        # this directory — http://localhost:8084
bun run typecheck  # tsc -p tsconfig.app.json --noEmit
bun run test       # vitest unit tests (entity APIs + order model)
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## Structure

Standard Bab Rizq role-app template (see `REFACTOR_PLAN.md`): `app/` (providers+routing),
`pages/` (Overview, Orders, OrderDetail, History, Profile), `features/auth` + `features/orders`
(fulfillment context + pure `orderModel`), `entities/` — two FSD domain slices: `order` and
`driver` (each `model.ts` + `api.ts` mock functions + `index.ts`), `shared/` (DeliverySidebar).

`FullOrder` / `FullOrderStatus` live in `packages/shared/src/lib/order.ts` — the shared order
contract consumed by the shared `OrderBadge` / `ProofOfDeliveryModal` and re-exported by this
app's `entities/order` slice.

Generic UI lives in `packages/shared` and is imported via path aliases — never edit copies here.

## Docs

- `MIGRATION.md` — split history + backend migration checklist.
- `docs/needed-endpoints-from-backend.md` — the delivery API contract.
