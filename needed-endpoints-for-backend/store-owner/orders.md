# Store Owner — Orders

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and order statuses.

---

## Order Shape

```ts
interface Order {
  id: string;                 // UUID
  orderNumber: string;        // human-readable, e.g. "#BRQ-1042"
  date: string;               // YYYY-MM-DD
  customerNameEn: string;
  customerNameAr: string;
  customerAddress?: string;
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;            // unit price
  }[];
  total: number;              // sum of (qty × price) for all items
  currency: string;           // ISO 4217 code
  status: "pending" | "processing" | "shipped" | "delivered";
}
```

---

## GET `/api/store/orders`

Returns a paginated list of orders for the store.

### Query Parameters

| Param      | Type     | Required | Default | Description                                               |
| ---------- | -------- | -------- | ------- | --------------------------------------------------------- |
| `page`     | `number` | No       | 1       | Page number                                               |
| `pageSize` | `number` | No       | 10      | Items per page                                            |
| `search`   | `string` | No       | —       | Filter by `orderNumber` or customer name (EN or AR)       |
| `status`   | `string` | No       | —       | Filter by status: `pending`, `processing`, `shipped`, `delivered`. Omit for all. |

### Response `value`

Paginated list (see `_shared.md`), with `items: Order[]`.

---

## PUT `/api/store/orders/{id}/status`

Advances the order to the next status. Only forward transitions are allowed:  
`pending` → `processing` → `shipped` → `delivered`

### Path Parameter

| Param | Type     | Description  |
| ----- | -------- | ------------ |
| `id`  | `string` | Order UUID   |

### Request DTO

```ts
{
  status: "processing" | "shipped" | "delivered";
}
```

### Response `value`

`Order` (updated).

### Error Cases

| `topError.code`         | HTTP Status | When                                              |
| ----------------------- | ----------- | ------------------------------------------------- |
| `INVALID_STATUS_TRANSITION` | 422     | Requested status is not the valid next step        |
| `ORDER_ALREADY_DELIVERED`   | 409     | Order is already in `delivered` state (final)      |

---

## GET `/api/store/orders/{id}/receipt`

Returns a URL to a printable PDF receipt for the order.

### Path Parameter

| Param | Type     | Description  |
| ----- | -------- | ------------ |
| `id`  | `string` | Order UUID   |

### Response `value`

```ts
{
  receiptUrl: string;   // URL to the generated PDF receipt
}
```

> The PDF should include: order number, date, customer name, item list (name, qty, unit price, line total), and order total.
