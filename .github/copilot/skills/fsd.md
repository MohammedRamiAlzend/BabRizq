---
name: fsd
description: >-
  Feature-Sliced Design (FSD) architecture conventions for this project.
  Use this skill whenever creating, moving, or refactoring files to ensure
  they land in the correct FSD layer and follow the project's slice structure.
---

# Feature-Sliced Design (FSD) — Project Conventions

## Layer Overview

This project follows FSD with **6 layers** ordered from highest to lowest level of abstraction.
Higher layers may import from lower layers but **never** the other way around.

```
src/
├── app/         ← Global providers, routing, app initialisation
├── processes/   ← Multi-page business flows (currently empty, reserved)
├── pages/       ← Route-level page components (composition only, no business logic)
├── features/    ← Business features — each user-facing capability lives here
├── entities/    ← Core domain models, types, business rules, mock/API data
└── shared/      ← Generic reusable code with no business knowledge
```

**Import direction (allowed):**

```
app → processes → pages → features → entities → shared
```

Cross-imports within the same layer are **forbidden** (e.g. a feature must not import from another feature).

---

## Path Alias

All absolute imports use the `@/` alias which resolves to `src/`:

```ts
import { User } from '@/entities/user';
import { AuthProvider } from '@/features/auth';
import { Button } from '@/shared/ui/ui/button';
import { useLocale } from '@/shared/contexts/LocaleContext';
```

---

## Layer Details

### `src/app/`

Contains only:
- **`providers/appProviders.tsx`** — wraps the app in all context providers (QueryClient, Theme, Locale, Auth, Cart, Orders, Tooltip, Toaster).
- **`routing/appRouter.tsx`** — `<BrowserRouter>` + `<Routes>` with all route definitions.
- **`index.ts`** — re-exports both.

When adding a new global provider, add it inside `appProviders.tsx`.
When adding new routes, add them to `appRouter.tsx`.

### `src/processes/`

Reserved for multi-step business processes that span several pages (e.g. a multi-step checkout wizard). Currently empty.

### `src/pages/`

Each file is a **thin route component**: it imports and composes features/entities/shared but contains no inline business logic. Layouts (`*Layout.tsx`) define nested routes via `<Outlet />`.

### `src/features/`

Each sub-directory is an **independent feature slice**:

```
features/
├── auth/          ← AuthProvider + useAuth hook
├── cart/          ← CartProvider + useCart hook
├── orders/        ← OrdersProvider + useOrders hook
├── admin/
├── delivery/
├── marketing/
├── products/
└── store/
```

**Slice internal structure** (only create what is needed):

```
features/<name>/
├── model/        ← React context, state, types, business logic
├── ui/           ← Components used only by this feature
├── api/          ← API calls / data-fetching functions
├── lib/          ← Feature-specific utilities
├── config/       ← Constants and configuration
└── index.ts      ← Public API — export ONLY what other layers need
```

`index.ts` must export every symbol that pages or `app/` consume.
Example (`features/auth/index.ts`):

```ts
export * from './model/authContext';
```

### `src/entities/`

Domain entities hold **types, business-rule classes, validation helpers, and mock/API data** for the core domain objects.

```
entities/
├── user/          ← User interface, UserEntity class, validateUser()
├── product/       ← Product interface, ProductEntity class, validateProduct()
├── order/         ← Order types and business rules
├── store/         ← Store types and business rules
├── adminData.ts   ← (legacy) admin mock data, to be extracted
├── ...            ← other legacy data files
└── index.ts       ← re-exports all entity slices + legacy files
```

**Slice internal structure:**

```
entities/<name>/
├── model.ts      ← TypeScript interfaces + Entity class + validate*() function
├── api.ts        ← Mock data arrays / API calls that return domain objects
└── index.ts      ← re-exports model + api
```

When adding a new entity:
1. Create `src/entities/<name>/model.ts` with the TypeScript interface, an Entity class (business rules), and a `validate*()` function.
2. Create `src/entities/<name>/api.ts` with mock data or API helpers.
3. Create `src/entities/<name>/index.ts` that re-exports both.
4. Add `export * from './<name>';` to `src/entities/index.ts`.

### `src/shared/`

Generic, **project-agnostic** building blocks:

```
shared/
├── ui/            ← All reusable UI components (shadcn/ui components live in ui/ui/)
├── hooks/         ← Generic hooks (usePagination, use-mobile, useInterests, use-toast)
├── lib/           ← Pure utilities (utils.ts — includes todayDate(), animations.ts)
├── contexts/      ← App-wide non-business contexts (ThemeContext, LocaleContext)
└── index.ts       ← re-exports all four sub-directories
```

---

## Localization

All user-facing strings **must** use the `useLocale()` hook:

```tsx
import { useLocale } from '@/shared/contexts/LocaleContext';

const { t, lang } = useLocale();
// t(englishString, arabicString)
return <span>{t('Save', 'حفظ')}</span>;
```

The default language is **Arabic (RTL)**. Always provide both strings.

---

## Pagination

All data tables use the `usePagination` hook and `<Pagination>` component:

```tsx
import { usePagination } from '@/shared/hooks/usePagination';
import { Pagination } from '@/shared/ui/Pagination';

const { currentPage, totalPages, paginatedData, setCurrentPage } = usePagination(data, 5);
```

Default page size is **5**.

---

## Build, Test, Lint

```bash
npx vite build       # production build
npx vitest run       # unit tests
npx eslint .         # lint
```

---

## Adding a New Feature — Checklist

1. Create `src/features/<name>/` with at minimum `model/` and `index.ts`.
2. Export the public API from `index.ts` (providers, hooks, types needed by pages/app).
3. If the feature needs a new domain entity, create it in `src/entities/<name>/` first.
4. Register any new context provider in `src/app/providers/appProviders.tsx`.
5. Register any new routes in `src/app/routing/appRouter.tsx`.
6. **Do not** import from another feature inside your feature slice.
7. **Do not** add business logic directly inside a page component.
8. Use `@/` absolute imports for all cross-layer imports.
9. Use `useLocale()` for every user-visible string.
