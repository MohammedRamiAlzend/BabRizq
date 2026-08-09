# Admin App — Migration Plan

## 1. Source mapping (legacy monolith → this app)

| Legacy file | Destination | Notes |
|---|---|---|
| `src/pages/AdminLayout.tsx` | `src/pages/AdminLayout.tsx` | copied verbatim |
| `src/pages/AdminOverview.tsx` | `src/pages/AdminOverview.tsx` | copied verbatim |
| `src/pages/AdminUsers.tsx` | `src/pages/AdminUsers.tsx` | copied verbatim |
| `src/pages/AdminSettings.tsx` | `src/pages/AdminSettings.tsx` | copied verbatim |
| `src/pages/AdminProfile.tsx` | `src/pages/AdminProfile.tsx` | copied verbatim |
| `src/pages/LoginPage.tsx` | `src/pages/LoginPage.tsx` | **rewritten** — single-role |
| `src/entities/adminData.ts` | `src/entities/{user,stats,settings}/` | **Phase 2** — three FSD slices |
| `src/shared/ui/AdminSidebar.tsx` | `src/shared/ui/AdminSidebar.tsx` | copied verbatim |
| shared ui/contexts/hooks/lib + AppHeader/NavLink/Pagination | `packages/shared/…` | shared via aliases |
| `needed-endpoints-for-backend/admin/*` | `docs/needed-endpoints-from-backend/…` | generated at migration time |

**Not carried over** (never routed in legacy): `Index.tsx`, `DashboardPage.tsx`, `NotFound.tsx`.

## 2. What changed vs. legacy

- **Single-role auth** — demo login `1`/`1` → admin session (mock JWT).
- **New app shell** — configs, providers, router, `index.html` (role-specific title).
- **No source edits** to copied pages — the alias map re-wires every import.

## 3. Mock data & backend handoff

| Mock | Endpoint (per docs) |
|---|---|
| `platformStats` | `GET /api/admin/overview` |
| `platformUsers` / `platformUsers` mutations | `GET/POST /api/admin/users` · `PUT /api/admin/users/{id}/role` · `PUT /api/admin/users/{id}/status` · `DELETE /api/admin/users/{id}` |
| `DEFAULT_PLATFORM_SETTINGS` | `GET/PUT /api/admin/settings` |
| profile page | `GET/PUT /api/admin/me` · `POST /api/admin/me/change-password` |
| auth | `POST /api/auth/login` · `GET /api/auth/me` |

## 4. Validation

```bash
bun install && bun run typecheck && bun run test && bun run build
```

## 5. Phase 2 completed (entity layer cleanup)

Done on `feat/admin-app-implementation`:

- **Entity slices** — `entities/adminData.ts` is gone, replaced by three FSD domain slices,
  each `model.ts` (interfaces) + `api.ts` (fetch-ready mocks annotated with the endpoint they
  simulate via `TODO(migration)`) + `index.ts` (barrel):
  `entities/user` (PlatformUser, role mutations), `entities/stats` (platform KPIs),
  `entities/settings` (platform config).
- **Strict TypeScript** — `strict: true` + `noImplicitAny: true`; the app typechecks clean.
- **Tests** — Vitest (`bun run test`): 3 files covering the user/stats/settings APIs (11 tests).

## 6. Future cleanup (Phase 3+)

- Add Playwright e2e coverage; introduce `VITE_API_URL` when the backend lands.
