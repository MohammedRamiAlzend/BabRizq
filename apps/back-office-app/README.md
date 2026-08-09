# Bab Rizq — Back Office App

The **back office** application of the Bab Rizq marketplace platform (bilingual EN/AR, RTL-aware).
Handles order management, shipment tracking, driver assignment, the live delivery map,
notifications and support chat.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query

## Run

```bash
bun install        # from the repo root (bun workspaces)
bun run dev        # this directory — http://localhost:8083
bun run typecheck  # tsc -p tsconfig.app.json --noEmit
bun run test       # vitest unit tests (entity APIs + order model)
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## Structure

Standard Bab Rizq role-app template (see `REFACTOR_PLAN.md`): `app/` (providers+routing),
`pages/` (Overview, Orders, ShipmentDetail, Drivers, Map, Notifications, Chat),
`features/auth` + `features/orders` (fulfillment context + pure `orderModel`),
`entities/` — six FSD domain slices: `order`, `driver`, `notification`, `chat`, `map`,
`product` (each `model.ts` + `api.ts` mock functions + `index.ts`),
`shared/` (BackOfficeSidebar).

`FullOrder` / `FullOrderStatus` live in `packages/shared/src/lib/order.ts` — the shared order
contract consumed by the shared `OrderBadge` / `ProofOfDeliveryModal` and re-exported by this
app's `entities/order` slice.

Generic UI lives in `packages/shared` and is imported via path aliases — never edit copies here.

## Docs

- `MIGRATION.md` — split history + backend migration checklist.
- `docs/needed-endpoints-from-backend.md` — the back-office API contract.
