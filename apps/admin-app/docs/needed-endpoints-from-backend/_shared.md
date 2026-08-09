# Shared Conventions — Admin API

## Authentication

Every admin endpoint requires:

| Header          | Value                                      |
| --------------- | ------------------------------------------ |
| `Authorization` | `Bearer <jwt_token>` (role: `admin`)       |

The `admin` role is enforced server-side on every route under `/api/admin/…`.
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
| `currency`  | ISO 4217 code: `"SAR"`, `"USD"`, `"AED"`, `"SYP"`, `"EUR"`, `"GBP"`, etc. |
| Bilingual   | Names are always a pair: `nameEn` (English) + `nameAr` (Arabic)            |

---

## Platform User Shape

```ts
interface PlatformUser {
  id: string; // UUID
  name: string;
  nameAr: string;
  email: string;
  role: 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';
  status: 'active' | 'suspended';
  joinedDate: string; // YYYY-MM-DD
}
```

---

## Platform Settings Shape

```ts
interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;   // 0-100 percentage
  maintenanceMode: boolean;
}
```

---

## Admin Profile Shape

```ts
interface AdminProfile {
  id: string; // UUID
  name: string;
  nameAr: string;
  email: string;
  role: 'admin';
  joinedDate: string; // YYYY-MM-DD
}
```