# Bab Rizq — Marketer App

The **marketer** application of the Bab Rizq marketplace platform (bilingual EN/AR, RTL-aware).
Creates affiliate links, tracks clicks/commissions, and manages marketer settings.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query

## Run

```bash
bun install        # from the repo root (bun workspaces)
bun run dev        # this directory — http://localhost:8085
bun run typecheck  # tsc -p tsconfig.app.json --noEmit
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## Structure

Standard Bab Rizq role-app template (see `REFACTOR_PLAN.md`): `app/` (providers+routing),
`pages/` (Overview, Links, Performance, Settings), `features/auth`, `entities/marketerData`
(AffiliateLink, AffiliateTarget + mocks), `shared/` (MarketerSidebar).

Generic UI lives in `packages/shared` and is imported via path aliases — never edit copies here.

## Docs

- `MIGRATION.md` — split history + backend migration checklist.
- `docs/needed-endpoints-from-backend.md` — the marketer API contract.
