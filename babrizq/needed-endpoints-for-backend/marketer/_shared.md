# Shared Conventions — Marketer API

## Authentication

Every marketer endpoint requires:

| Header          | Value                                      |
| --------------- | ------------------------------------------ |
| `Authorization` | `Bearer <jwt_token>` (role: `marketer`)    |

The `marketer` role is enforced server-side on every route under `/api/marketer/…`.
Requests made with a token that has a different role must be rejected with **403 Forbidden**.

---

## Standard Response Envelope

All endpoints wrap their payload in this envelope:

```json
{
  "isSuccess": true,
  "isError": false,
  "errors": [],
  "topError": null,
  "value": { }
}
```

On failure:

```json
{
  "isSuccess": false,
  "isError": true,
  "errors": ["Human-readable error message"],
  "topError": {
    "code": "ERROR_CODE",
    "httpStatus": 400
  },
  "value": null
}
```

---

## Paginated Response Shape

Endpoints that return lists use this structure inside `value`:

```json
{
  "items": [],
  "totalItems": 0,
  "page": 1,
  "pageSize": 10,
  "totalPages": 0
}
```

---

## Primitive DTO Types

| Type        | Format / Notes                                                             |
| ----------- | -------------------------------------------------------------------------- |
| `id`        | UUID (GUID) string, e.g. `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`         |
| `date`      | ISO 8601 date string `YYYY-MM-DD`                                          |
| `timestamp` | ISO 8601 datetime string `YYYY-MM-DDTHH:MM:SSZ`                            |
| `currency`  | ISO 4217 code such as `"SAR"`                                              |
| Bilingual   | Names are always a pair: `nameEn` (English) + `nameAr` (Arabic)            |

---

## Affiliate Link Shape

```ts
interface AffiliateLink {
  id: string;                 // UUID
  url: string;
  targetId: string;           // UUID
  targetNameEn: string;
  targetNameAr: string;
  type: 'store' | 'product';
  clicks: number;
  conversions: number;
  earned: number;
  createdAt: string;          // YYYY-MM-DD
}
```

---

## Affiliate Target Shape

```ts
interface AffiliateTarget {
  id: string;                 // UUID
  nameEn: string;
  nameAr: string;
  type: 'store' | 'product';
}
```