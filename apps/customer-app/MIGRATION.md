# Customer App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/StorefrontPage.tsx` | `src/pages/StorefrontPage.tsx` | copied verbatim (aliases rewire imports) |
| `src/pages/StoreCatalogPage.tsx` | `src/pages/StoreCatalogPage.tsx` | copied verbatim |
| `src/pages/CategoryCatalogPage.tsx` | `src/pages/CategoryCatalogPage.tsx` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role, no role picker |
| `src/features/cart/model/cartContext.tsx` | `src/features/cart/model/cartContext.tsx` | copied verbatim |
| `src/entities/products.ts` | `src/entities/{product,store,category,ad}/{model,api,index}` | **Phase 2** — split into per-domain FSD slices |
| `src/shared/ui/StorefrontHeader|ProductCard|StoreCard|CategoryTile|AdCarousel|FilterPanel|CartDrawer|CheckoutModal` | `src/shared/ui/…` | copied verbatim |
| `src/shared/ui/{ui/*,AppHeader,NavLink,OrderBadge,Pagination,ScrollToTopButton,ProofOfDeliveryModal}`, `contexts/*`, `hooks/*`, `lib/*` | `packages/shared/…` | **shared** — one copy, imported via aliases |
| `src/assets/*` | `src/assets/*` | logo, login-bg, product images |
| `needed-endpoints-for-backend/customer/*` | `docs/needed-endpoints-from-backend/…` | generated at migration time |

**Not carried over** (legacy leftovers, never routed): `Index.tsx`, `DashboardPage.tsx`, `NotFound.tsx`.

## 2. What changed vs. legacy

- **Single-role auth** (`src/features/auth/model/authContext.tsx`): demo login `1`/`1` → directly the
  customer session (mock JWT, sessionStorage). No role picker.
- **New app shell** (`main.tsx`, `App.tsx`, `index.css`, `tailwind.config.ts`, `vite.config.ts`,
  `tsconfig*.json`, `index.html`, providers, router).
- **Import wiring** is handled entirely by the alias map — copied files were **not** edited.

## 3. Mock data & backend handoff

Everything is mock today. Replace 1:1 with `docs/needed-endpoints-from-backend.md` when the backend
exists:

| Mock | Endpoint (per docs) |
|---|---|
| `MOCK_PRODUCTS` / `getProducts()` | `GET /api/products?page=&pageSize=&category=&store=&search=` |
| `MOCK_STORES` / `getStores()` | `GET /api/stores` / `GET /api/stores/{id}` |
| `MOCK_ADS` (home/ads carousel) | `GET /api/home/ads` |
| cart context | `POST /api/cart/items` · `PUT /api/cart/items/{id}` · `DELETE /api/cart/items/{id}` |
| checkout modal | `POST /api/checkout` (payment → see plan §8) |
| `useInterests` (recommendations) | `GET /api/products/recommended` |
| auth | `POST /api/auth/login` · `GET /api/auth/me` |

## 4. Validation

```bash
bun install && bun run typecheck && bun run build
```

## 5. Phase 2 cleanup (done) & remaining work

**Completed in `feat/customer-app-implementation`:**

- **Entity slices** — `entities/products.ts` (990 lines) split into four FSD domain slices,
  each with `model.ts` (interfaces) + `api.ts` (fetch-ready mock functions) + `index.ts`:
  `entities/product` (Product, catalogue, search, recommendations),
  `entities/store` (Store, directory), `entities/category` (StoreSpecificCategory,
  related/platform categories), `entities/ad` (Ad, home/store/category carousels).
  Every api function carries a `TODO(migration)` comment naming the exact backend endpoint
  it simulates — the backend swap is a 1:1 drop-in.
- **Strict TypeScript** — `strict: true` + `noImplicitAny: true` enabled in `tsconfig.app.json`;
  the app typechecks clean.
- **Pure cart model** — cart business rules extracted to `features/cart/model/cartModel.ts`
  (add/remove/update/totals, immutable); `cartContext.tsx` is now a thin stateful wrapper.
- **Unit tests** — Vitest (`bun test`): `cartModel.test.ts` + per-entity API tests
  (`product`, `store`, `category`, `ad`) pinning the catalogue contracts.

**Still open:**

- Playwright smoke tests (login `1`/`1`, browse the three storefront pages).
- Introduce `VITE_API_URL` + replace mock APIs with `fetch` when the backend lands (Phase 4).
- `ProductCard`/`StoreCard`/`CategoryTile` intentionally stay in `shared/ui` (per
  `REFACTOR_PLAN.md` §4 — they are storefront widgets reused across pages).
