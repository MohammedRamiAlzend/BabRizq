# API Conventions

## Base URL & docs

- Base: `/api/v1` (configurable via `API_PREFIX` / `API_VERSION`)
- Swagger UI: `/docs`

## Authentication

All endpoints except those marked `@Public()` (login/register/refresh/logout, health) require:

```
Authorization: Bearer <accessToken>
```

Roles are enforced with `@Roles(...)` + the global `RolesGuard`. The six roles:
`customer`, `store_owner`, `back_office`, `delivery`, `marketer`, `admin`.

## Response envelope

Every response uses the same envelope (matches the frontend contracts):

### Success

```json
{
  "isSuccess": true,
  "isError": false,
  "errors": [],
  "topError": null,
  "value": { }
}
```

### Error

```json
{
  "isSuccess": false,
  "isError": true,
  "errors": ["Human-readable message"],
  "topError": { "code": "Bad Request", "httpStatus": 400 },
  "value": null
}
```

### Pagination (list endpoints)

```json
{
  "value": {
    "items": [],
    "totalItems": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 0
  }
}
```

Common list query params: `page` (≥1), `pageSize` (1–100), `orderBy`, `orderDirection` (`asc|desc`).

## Error codes (top-level HTTP statuses)

| Status | Meaning |
|---|---|
| 400 | Validation failed / bad request |
| 401 | Missing/invalid token or credentials |
| 403 | Authenticated but not allowed (role / suspended account) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 429 | Rate limited |
| 500 | Internal error (details never leaked) |
