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
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## Structure

Standard Bab Rizq role-app template (see `REFACTOR_PLAN.md`): `app/` (providers+routing),
`pages/` (Overview, Orders, ShipmentDetail, Drivers, Map, Notifications, Chat),
`features/auth` + `features/orders` (fulfillment context), `entities/` (fulfillmentData,
backOfficeData, storeOwnerData — FullOrder, Driver, DriverLocation… interfaces + mocks),
`shared/` (BackOfficeSidebar).

Generic UI lives in `packages/shared` and is imported via path aliases — never edit copies here.

## Docs

- `MIGRATION.md` — split history + backend migration checklist.
- `docs/needed-endpoints-from-backend.md` — the back-office API contract.
