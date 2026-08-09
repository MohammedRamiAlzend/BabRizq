# Bab Rizq — Per-Role Project Refactor Plan

> Status: **Plan approved — scaffold in progress.** This document is the source of truth for the
> migration from the legacy monolith (`src/`) into six independent, role-scoped applications plus a
> shared workspace package. Every role project ships its own UI, its own domain interfaces
> (entities), its own `MIGRATION.md`, and its own `needed-endpoints-from-backend.md`.

---

## 1. Goals

1. **Split the monolith by role** into six deployable applications:
   `customer`, `store-owner`, `back-office`, `delivery`, `marketer`, `admin`.
2. **Extract role interfaces** (domain types & mock data) into each project's `entities` layer.
3. **Preserve every UI** — each project contains all screens its role currently has, pixel-for-pixel,
   with **zero functional changes** during the split.
4. **Keep legacy code as-is** — the original `src/` tree is **not modified** (see §3 for the single
   exception).
5. **Share the generic UI** through a single `packages/shared` workspace package (shadcn/ui
   primitives, Locale/Theme contexts, hooks, utils, app shell components).
6. Every project follows the **same FSD structure**, is **self-documenting (comments)**, and is
   **maintainable / extendable** (clean separation, clear public APIs).
7. Every project carries a **migration plan** (`MIGRATION.md`) and a **backend contract**
   (`docs/needed-endpoints-from-backend.md`) generated at migration time.

## 2. Non-Goals (out of scope for this phase)

- **No backend implementation.** All projects keep the existing mock data layer; the documented
  endpoints are the contract for a future backend (see §8).
- **No deep refactor of copied business logic.** Copy first, clean later (Phase 2 per project).
- **No visual redesign.** Styling tokens (`index.css`, Tailwind config) are inherited verbatim.
- **No monorepo tooling beyond bun workspaces** (no Turborepo/Nx yet).
- Legacy pages that were never routed (`Index.tsx`, `DashboardPage.tsx`, `BackOfficePage.tsx`,
  `DeliveryDriverPage.tsx`, `NotFound.tsx`) are **not** carried into the role apps; they are
  documented in each `MIGRATION.md`.

## 3. Decisions

### 3.1 Repository layout (bun workspaces)

```
BabRizq/                        ← repo root (legacy monolith UNTOUCHED)
├── package.json                ← + "workspaces": ["apps/*", "packages/*"]  (only legacy-adjacent change)
├── src/                        ← legacy app — read-only reference
├── needed-endpoints-for-backend/ ← legacy endpoint docs — read-only reference
├── REFACTOR_PLAN.md            ← this file
├── packages/
│   └── shared/                 ← @babrizq/shared — generic UI + contexts + hooks + lib
└── apps/
    ├── customer-app/           ← @babrizq/customer-app    (storefront)
    ├── store-owner-app/        ← @babrizq/store-owner-app
    ├── back-office-app/        ← @babrizq/back-office-app
    ├── delivery-app/           ← @babrizq/delivery-app
    ├── marketer-app/           ← @babrizq/marketer-app
    └── admin-app/              ← @babrizq/admin-app
```

**Exception to "legacy as-is":** the root `package.json` gains a `workspaces` field so bun can
install all six apps and the shared package from one command (`bun install` at the root). No other
legacy file is changed.

### 3.2 Shared package: consumed via path aliases, no build step

`packages/shared/src` is **TypeScript source**. Role apps reference it through Vite + tsconfig path
aliases (e.g. `@/shared/ui/ui/*` → `packages/shared/src/ui/ui/*`). Benefits:

- One source of truth; a fix in shared propagates to all six apps immediately.
- No package build order, no `dist` staleness, no duplicated React bundles (React comes from each app).
- Copied legacy files keep their original `@/shared/...`, `~/entities/...`, `@/features/...`,
  `@/assets/...` imports — they resolve to the right place in every app via that app's alias map.
  This is what makes the migration **mechanical and low-risk**.

Shared contents (moved verbatim from legacy `src/shared`):
`ui/ui/*` (49 shadcn primitives), `ui/AppHeader`, `ui/NavLink`, `ui/OrderBadge`, `ui/Pagination`,
`ui/ScrollToTopButton`, `ui/ProofOfDeliveryModal`, `contexts/LocaleContext`, `contexts/ThemeContext`,
`hooks/usePagination`, `hooks/use-mobile`, `hooks/use-toast`, `hooks/useInterests`,
`lib/utils`, `lib/animations`.

**Alias map (identical in every app — Vite `resolve.alias` array and `tsconfig.app.json` `paths`):**

| Alias (longest first) | Resolves to |
|---|---|
| `@/shared/ui/ui/*` | `packages/shared/src/ui/ui/*` |
| `@/shared/contexts/*` | `packages/shared/src/contexts/*` |
| `@/shared/hooks/*` | `packages/shared/src/hooks/*` |
| `@/shared/lib/*` | `packages/shared/src/lib/*` |
| `@/shared/ui/AppHeader` … `ProofOfDeliveryModal` (exact) | `packages/shared/src/ui/*` |
| `@/shared/*` | `<app>/src/shared/*` (role-specific UI: sidebars, storefront widgets) |
| `~/entities/*` | `<app>/src/entities/*` |
| `@/features/*` | `<app>/src/features/*` |
| `@/pages/*` | `<app>/src/pages/*` |
| `~/processes/*`, `~/app/*`, `@/assets/*`, `@/*` | `<app>/src/…` |

### 3.3 Per-role app identity

Each app is a **standalone Vite + React 18 + TypeScript + Tailwind** application with:

- Its own `package.json` (name `@babrizq/<role>-app`), scripts: `dev`, `build`, `preview`, `typecheck`.
- Its own port (customer 8081, store-owner 8082, back-office 8083, delivery 8084, marketer 8085,
  admin 8086), `host: "::"` (binds 0.0.0.0 for Freebuff preview).
- A **single-role auth context** (demo credentials `1`/`1`, simulated JWT) — no role picker.
- The **same FSD template** (§5) and the same theme (`index.css` + `tailwind.config.ts` copied).

## 4. Per-role scope (pages / entities / features / in-app shared UI)

| App | Pages (copied) | Entities (interfaces + mocks) | Features | In-app `shared/ui` | Assets |
|---|---|---|---|---|---|
| **customer** | Storefront, StoreCatalog, CategoryCatalog | `products.ts` (Store, Product, ads…) | auth, cart | StorefrontHeader, ProductCard, StoreCard, CategoryTile, AdCarousel, FilterPanel, CartDrawer, CheckoutModal | logo, login-bg, products/* |
| **store-owner** | Layout + Overview, Products, Orders, Sales, Categories, Offers, Reports, Chat, Settings, Warehouse, Accounting | `storeOwnerData.ts` (StoreProduct, StoreOrder, Offer, Invoice…) | auth | StoreOwnerSidebar | logo, login-bg |
| **back-office** | Layout + Overview, Orders, ShipmentDetail, Drivers, Map, Notifications, Chat | `fulfillmentData.ts`, `backOfficeData.ts`, `storeOwnerData.ts` (STORE_PRODUCTS) | auth, orders | BackOfficeSidebar | logo, login-bg |
| **delivery** | Layout + Overview, Orders, OrderDetail, History, Profile | `fulfillmentData.ts` (FullOrder, MockDriver…) | auth, orders | DeliverySidebar | logo, login-bg |
| **marketer** | Layout + Overview, Links, Performance, Settings | `marketerData.ts` (AffiliateLink…) | auth | MarketerSidebar | logo, login-bg |
| **admin** | Layout + Overview, Users, Settings, Profile | `adminData.ts` (PlatformUser, PlatformSettings…) | auth | AdminSidebar | logo, login-bg |

Every app also consumes the shared package (§3.2) and the generic shadcn primitives.

## 5. Standard project template (same structure for all six)

```
apps/<role>-app/
├── package.json            # @babrizq/<role>-app — dev/build/preview/typecheck
├── vite.config.ts          # alias map + port + host "::"
├── tsconfig.json           # references app + node
├── tsconfig.app.json       # alias paths (longest-first), include: src
├── tsconfig.node.json      # for vite.config.ts
├── tailwind.config.ts      # content includes ../../packages/shared/src/**/*
├── postcss.config.js
├── index.html              # <title> Bab Rizq — <Role> </title>
├── README.md               # what it is, how to run
├── MIGRATION.md            # migration plan for this project (source map + backend steps)
├── docs/
│   ├── needed-endpoints-from-backend.md          # generated from legacy endpoint docs
│   └── needed-endpoints-from-backend/            # full per-role endpoint reference
└── src/
    ├── main.tsx            # entry (imports index.css)
    ├── App.tsx             # LocaleProvider-driven RTL switching + AppRouter
    ├── index.css           # Tailwind directives + gold/navy theme tokens (copied verbatim)
    ├── vite-env.d.ts
    ├── app/                # providers/appProviders.tsx · routing/appRouter.tsx
    ├── pages/              # role pages (thin, compose features/entities/shared)
    ├── features/           # auth/ (single-role context) + role feature slices (cart, orders)
    ├── entities/           # role domain interfaces + mock data (extracted per role)
    ├── shared/             # role-specific UI only (sidebars, storefront widgets)
    └── assets/             # logo, login-bg, product images
```

## 6. Interface extraction strategy

"Extract the role's interfaces to the project" is realised by copying the **domain module that owns
those interfaces** into the app's `entities/`:

- Interfaces are **not** duplicated across apps. Cross-role types (e.g. `FullOrder` for back-office +
  delivery, `STORE_PRODUCTS` for back-office) are copied only into the apps that reference them
  (documented in the alias/entity table above).
- The `~/entities/*` alias keeps every copied import valid with zero edits.
- Phase 2 (per project): split the legacy data files into `model.ts` (interfaces) + `api.ts` (mock
  data + fetch-ready functions), mirroring the existing new-style slices (`entities/product/…`).

## 7. Coding conventions (all new projects)

- **FSD import rules** (from `.github/copilot/skills/fsd.md`): `app → pages → features → entities → shared`; no cross-imports within a layer; no business logic inside pages.
- **Bilingual**: every user-facing string via `useLocale().t(en, ar)`; `dir`/`lang` handled globally.
- **Comments**: file header comment explaining purpose + the API contract it simulates; section
  comments for non-obvious logic; `TODO(migration)` markers where a mock must become a real API call.
- **Naming**: kebab-case files, PascalCase components, `use`-prefixed hooks, `I`-free interfaces.
- **Types**: interfaces in `entities/*/model` (Phase 2), no `any` in new code.
- **Pagination**: `usePagination` + `<Pagination>` for all tables (default page size 5).
- **Validation gates per app**: `bun install` (root) → `bun tsc -p tsconfig.app.json --noEmit` →
  `bun run build` → visual check in preview.

## 8. Backend contract: `needed-endpoints-from-backend.md`

Each app ships `docs/needed-endpoints-from-backend.md`, **built at migration time** by copying the
corresponding legacy reference (`needed-endpoints-for-backend/<role>/README.md`) plus the full
per-role folder. These docs define: auth header (`Authorization: Bearer <jwt>`), the standard
response envelope, pagination shape, and every endpoint + DTO the app's pages consume. When the
backend is implemented, the mock entity APIs in each app are replaced 1:1 with calls to these
endpoints — no UI change required.

## 9. Phases

| Phase | Work | Where |
|---|---|---|
| 0 | Plan + decisions | `REFACTOR_PLAN.md` (this file) |
| 1 | Scaffold shared package + six apps (copy UI/entities, single-role auth, configs, docs) | `packages/shared`, `apps/*` |
| 2 | Per-app cleanup: split entity files into `model`/`api`, add tests, strict TS | each `apps/*/MIGRATION.md` |
| 3 | Backend: implement endpoints per `docs/needed-endpoints-from-backend.md` | backend repo(s) |
| 4 | Wire apps to backend (replace mocks with fetch), add env vars | each app |
| 5 | CI/CD: per-app pipelines, deploy independently | `.github/workflows` |

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Import drift (copied files reference something not in the app) | `~/entities/*` + `@/shared/*` alias map; validation gate `tsc` per app |
| Shared package change breaking several apps | Shared is single source; validated by typechecking all six apps after any change |
| Duplicate React bundles | `resolve.dedupe` for react/react-dom in each `vite.config.ts` |
| Legacy app regressions | Legacy `src/` untouched; root install/typecheck behaviour unchanged except `workspaces` field |
| Mock divergence across apps | Entities copied verbatim; Phase 2 centralises via `packages/shared` only for truly generic code |

## 11. Validation (how we know the split is done right)

1. `bun install` at root — workspace resolves, all deps install.
2. `bun tsc -p tsconfig.app.json --noEmit` **passes in all six apps** (legacy `src/` keeps its
   pre-existing tsc errors — untouched).
3. `bun run build` succeeds in at least customer + admin (validates aliases + bundling).
4. Visual smoke test per app in the Freebuff preview (login with `1`/`1`, browse the role's pages).
