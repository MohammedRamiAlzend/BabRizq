# Shared Conventions — Store Owner API

## Authentication

Every store-owner endpoint requires:

| Header            | Value                                      |
| ----------------- | ------------------------------------------ |
| `Authorization`   | `Bearer <jwt_token>` (role: `store_owner`) |
| `X-Store-Id`      | `{storeId}` (UUID of the authenticated store) |

---

## Standard Response Envelope

All endpoints wrap their payload in this envelope:

```json
{
  "isSuccess": true,
  "isError": false,
  "errors": [],
  "topError": null,
  "value": { /* endpoint-specific payload */ }
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

| Type            | Format / Notes                                                                 |
| --------------- | ------------------------------------------------------------------------------ |
| `id`            | UUID (GUID) string, e.g. `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`             |
| `date`          | ISO 8601 date string `YYYY-MM-DD`                                              |
| `timestamp`     | ISO 8601 datetime string `YYYY-MM-DDTHH:MM:SSZ`                                |
| `currency`      | ISO 4217 code: `"SAR"`, `"USD"`, `"AED"`, `"SYP"`, `"EUR"`, `"GBP"`, etc.    |
| Bilingual names | Always provided as a pair: `nameEn` (English) and `nameAr` (Arabic)           |

---

## Supported Currencies

| Code | Symbol | Name (EN)       |
| ---- | ------ | --------------- |
| SAR  | ر.س    | Saudi Riyal     |
| USD  | $      | US Dollar       |
| AED  | د.إ    | UAE Dirham      |
| SYP  | ل.س    | Syrian Pound    |
| EUR  | €      | Euro            |
| GBP  | £      | British Pound   |
| KWD  | د.ك    | Kuwaiti Dinar   |
| QAR  | ر.ق    | Qatari Riyal    |
| TRY  | ₺      | Turkish Lira    |

---

## Order Statuses

`pending` → `processing` → `shipped` → `delivered`
