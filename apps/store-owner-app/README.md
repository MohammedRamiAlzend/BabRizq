# Bab Rizq — Store Owner App

The **store owner** application of the Bab Rizq marketplace platform (bilingual EN/AR, RTL-aware).
Manages products, orders, sales, categories, offers, reports, chat, warehouse, accounting and
store settings.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query · Recharts

## Run

```bash
bun install        # from the repo root (bun workspaces)
bun run dev        # this directory — http://localhost:8082
bun run typecheck  # tsc -p tsconfig.app.json --noEmit
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## Structure

Standard Bab Rizq role-app template (see `REFACTOR_PLAN.md`): `app/` (providers+routing),
`pages/` (Overview, Products, Orders, Sales, Categories, Offers, Reports, Chat, Warehouse,
Accounting, Settings), `features/auth`, `shared/` (StoreOwnerSidebar).

**Entities** are split into per-domain FSD slices — `product`, `category`, `order`, `offer`,
`chat`, `warehouse`, `accounting`, `settings`, `sales`, `currency` — each with `model.ts`
(interfaces) + `api.ts` (mock data + fetch-ready functions) + `index.ts` (barrel). Every api
function is annotated with the backend endpoint it simulates, so swapping mocks for `fetch`
later is a 1:1 change.

Generic UI lives in `packages/shared` and is imported via path aliases — never edit copies here.

## Tests

```bash
bun test          # Vitest — entity API contracts (products, orders, accounting, warehouse, …)
```

## Docs

- `MIGRATION.md` — split history + backend migration checklist.
- `docs/needed-endpoints-from-backend.md` — the store-owner API contract.
