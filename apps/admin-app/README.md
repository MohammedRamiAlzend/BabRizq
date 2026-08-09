# Bab Rizq — Platform Admin App

The **platform admin** application of the Bab Rizq marketplace platform (bilingual EN/AR, RTL-aware).
Manages platform-wide settings, users & roles, and the admin's own account/security.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router · TanStack Query

## Run

```bash
bun install        # from the repo root (bun workspaces)
bun run dev        # this directory — http://localhost:8086
bun run typecheck  # tsc -p tsconfig.app.json --noEmit
bun run build      # production build → dist/
```

Demo login: username **1** / password **1** (single-role app — no role picker).

## Structure

Standard Bab Rizq role-app template (see `REFACTOR_PLAN.md`): `app/` (providers+routing),
`pages/` (Overview, Users, Settings, Profile), `features/auth`, `entities/adminData`
(PlatformUser, PlatformSettings interfaces + mocks), `shared/` (AdminSidebar).

Generic UI lives in `packages/shared` and is imported via path aliases — never edit copies here.

## Docs

- `MIGRATION.md` — split history + backend migration checklist.
- `docs/needed-endpoints-from-backend.md` — the admin API contract.
