# Shared Conventions — Delivery Driver API

## Authentication

Every delivery endpoint requires:

| Header          | Value                                        |
| --------------- | -------------------------------------------- |
| `Authorization` | `Bearer <jwt_token>` (role: `delivery`)      |

The `delivery` role is enforced server-side on every route under `/api/delivery/…`.
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

## Primitive DTO Types

| Type        | Format / Notes                                                             |
| ----------- | -------------------------------------------------------------------------- |
| `id`        | UUID (GUID) string, e.g. `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`         |
| `date`      | ISO 8601 date string `YYYY-MM-DD`                                          |
| `timestamp` | ISO 8601 datetime string `YYYY-MM-DDTHH:MM:SSZ`                            |
| `currency`  | ISO 4217 code such as `"SAR"`                                              |
| Bilingual   | Names are always a pair: `nameEn` (English) + `nameAr` (Arabic)            |

---

## Delivery Order Shape

```ts
interface DeliveryOrder {
  id: string;                 // UUID
  orderNumber: string;        // e.g. "#BRQ-1042"
  date: string;               // YYYY-MM-DD
  customerNameEn: string;
  customerNameAr: string;
  addressEn: string;
  addressAr: string;
  customerPhone: string;
  storeNameEn: string;
  storeNameAr: string;
  storeAddressEn: string;
  storeAddressAr: string;
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price?: number;
  }[];
  total: number;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  assignedDriverId?: string;
  proofOfDelivery?: string;   // URL to uploaded proof image
}
```

---

## Order Status Flow

```
assigned → picked_up → in_transit → delivered
```

### Notes

- A delivery driver should only be able to mutate orders assigned to their own driver GUID.
- The server should validate status transitions and reject invalid jumps.