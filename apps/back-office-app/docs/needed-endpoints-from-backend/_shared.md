# Shared Conventions — Back Office API

## Authentication

Every back-office endpoint requires:

| Header          | Value                                          |
| --------------- | ---------------------------------------------- |
| `Authorization` | `Bearer <jwt_token>` (role: `back_office`)     |

The `back_office` role is enforced server-side on every route under `/api/backoffice/…`.  
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

## FullOrder Shape

Used by overview, orders list, shipment detail, and driver-assignment responses.

```ts
interface FullOrder {
  id: string;                   // UUID
  orderNumber: string;          // human-readable, e.g. "#BRQ-1042"
  date: string;                 // YYYY-MM-DD
  customerNameEn: string;
  customerNameAr: string;
  addressEn: string;            // delivery address (English)
  addressAr: string;            // delivery address (Arabic)
  customerPhone: string;        // e.g. "+966 50 123 4567"
  storeNameEn: string;
  storeNameAr: string;
  storeAddressEn: string;
  storeAddressAr: string;
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;              // unit price
  }[];
  total: number;                // sum of (qty × price) for all items
  currency: string;             // ISO 4217 code
  status: FullOrderStatus;
  assignedDriverId?: string;    // UUID of the assigned driver, if any
  assignedDriverEn?: string;    // driver name in English
  assignedDriverAr?: string;    // driver name in Arabic
  proofOfDelivery?: "photo_uploaded" | "signature_captured";
}

type FullOrderStatus =
  | "pending"
  | "processing"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered";
```

### Order Status Flow

```
pending → processing → assigned → picked_up → in_transit → delivered
```

---

## Driver Shape

```ts
interface Driver {
  id: string;         // UUID
  nameEn: string;
  nameAr: string;
  phone: string;      // e.g. "+966 50 000 0000"
  available: boolean; // false when actively on a delivery
}
```
