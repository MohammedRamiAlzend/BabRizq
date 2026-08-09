# Bab Rizq — Customer App

The **customer storefront** application of the Bab Rizq marketplace platform (bilingual EN/AR,
RTL-aware). Lets customers browse stores and categories, search and filter products, view flash
deals and personalised recommendations, manage a cart and check out.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query · GSAP

## Run

```bash
bun install        # from the repo root (bun workspaces)
bun run dev        # this directory — http://localhost:8081
bun run typecheck  # tsc -p tsconfig.app.json --noEmit
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## StructureThis app follows the same Feature-Sliced Design template as every Bab Rizq role app
(see `REFACTOR_PLAN.md` at the repo root): `app/` (providers+routing), `pages/`,
`features/` (auth, cart), `entities/`, `shared/` (storefront-only UI).

**Entities** are split into per-domain FSD slices — `product`, `store`, `category`, `ad` —
each with `model.ts` (interfaces) + `api.ts` (mock data + fetch-ready functions) + `index.ts`
(barrel). Every api function is annotated with the backend endpoint it simulates, so swapping
mocks for `fetch` later is a 1:1 change. The cart's business rules live in the pure
`features/cart/model/cartModel.ts` and are unit-tested.

Generic UI (shadcn primitives, locale/theme contexts, hooks, app header) lives in
`packages/shared` and is imported via path aliases — never edit copies here.

## Tests

```bash
bun test          # Vitest — cart model + entity API contracts
```

## Docs

- `MIGRATION.md` — how this app was split from the legacy monolith and how to migrate to a real backend.
- `docs/needed-endpoints-from-backend.md` — the backend contract this app expects.
