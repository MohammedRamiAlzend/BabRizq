# Marketer App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/MarketerLayout.tsx` | `src/pages/MarketerLayout.tsx` | copied verbatim |
| `src/pages/MarketerOverview.tsx` | `src/pages/MarketerOverview.tsx` | copied verbatim |
| `src/pages/MarketerLinks.tsx` | `src/pages/MarketerLinks.tsx` | copied verbatim |
| `src/pages/MarketerPerformance.tsx` | `src/pages/MarketerPerformance.tsx` | copied verbatim |
| `src/pages/MarketerSettings.tsx` | `src/pages/MarketerSettings.tsx` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/marketerData.ts` | `src/entities/affiliateLink/` | **Phase 2** — `model.ts` + `api.ts` + `index.ts` slice |
| `src/shared/ui/MarketerSidebar.tsx` | `src/shared/ui/MarketerSidebar.tsx` | copied verbatim |
| shared ui/contexts/hooks/lib + AppHeader/NavLink/Pagination | `packages/shared/…` | shared via aliases |
| `needed-endpoints-for-backend/marketer/*` | `docs/needed-endpoints-from-backend/…` | generated at migration time |

**Not carried over** (never routed in legacy): `Index.tsx`, `DashboardPage.tsx`, `NotFound.tsx`.

## 2. What changed vs. legacy

- **Single-role auth** — demo login `1`/`1` → marketer session (mock JWT).
- **New app shell** — configs, providers, router, role-specific `index.html`.
- **No source edits** to copied pages — the alias map re-wires every import.

## 3. Mock data & backend handoff

| Mock | Endpoint (per docs) |
|---|---|
| `AFFILIATE_TARGETS`, `INITIAL_LINKS` | `GET/POST /api/marketer/links` · `GET /api/marketer/targets` |
| link stats (clicks/orders/commissions) | `GET /api/marketer/performance` |
| settings | `GET/PUT /api/marketer/settings` |
| auth | `POST /api/auth/login` · `GET /api/auth/me` |

## 4. Validation

```bash
bun install && bun run typecheck && bun run test && bun run build
```

## 5. Phase 2 completed (entity layer cleanup)

Done on `feat/marketer-app-implementation`:

- **Entity slice** — `entities/marketerData.ts` is gone, replaced by a single FSD domain slice,
  `entities/affiliateLink/` (`model.ts` interfaces + `api.ts` fetch-ready mocks annotated with
  the endpoint they simulate via `TODO(migration)` + `index.ts` barrel).
- **Strict TypeScript** — `strict: true` + `noImplicitAny: true`; the app typechecks clean.
- **Tests** — Vitest (`bun run test`): 1 file covering the affiliate-link API (4 tests).

## 6. Future cleanup (Phase 3+)

- Add Playwright e2e coverage; introduce `VITE_API_URL` when the backend lands.
