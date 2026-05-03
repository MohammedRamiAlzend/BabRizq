# Store Owner — Reports & Analytics

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## GET `/api/store/reports/sales`

Returns sales and orders data grouped by period (weekly or monthly).

### Query Parameters

| Param    | Type     | Required | Default    | Description                  |
| -------- | -------- | -------- | ---------- | ---------------------------- |
| `period` | `string` | No       | `monthly`  | `weekly` or `monthly`        |

### Response `value`

```ts
{
  data: {
    label: string;      // e.g. "Jan" (monthly) or "Mon" (weekly)
    labelAr: string;    // Arabic label, e.g. "يناير" or "الاثنين"
    sales: number;      // total sales amount for the period
    orders: number;     // number of orders for the period
  }[];
}
```

#### Weekly data shape (7 entries: Mon–Sun)

```ts
{ label: "Mon", labelAr: "الاثنين", sales: 2400, orders: 14 }
```

#### Monthly data shape (12 entries: Jan–Dec)

```ts
{ month: "Jan", monthAr: "يناير", sales: 18500, orders: 112 }
```

---

## GET `/api/store/reports/products`

Returns a paginated list of top-selling products by revenue.

### Query Parameters

| Param      | Type     | Required | Default | Description     |
| ---------- | -------- | -------- | ------- | --------------- |
| `page`     | `number` | No       | 1       | Page number     |
| `pageSize` | `number` | No       | 10      | Items per page  |

### Response `value`

```ts
{
  items: {
    id: string;       // product UUID
    nameEn: string;
    nameAr: string;
    sold: number;     // total units sold
    revenue: number;  // total revenue from this product
  }[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## GET `/api/store/reports/revenue-by-currency`

Returns total revenue broken down by currency.

### Query Parameters

_None_

### Response `value`

```ts
{
  currencies: {
    currency: string;  // ISO 4217 code
    symbol: string;    // e.g. "ر.س"
    amount: number;    // total revenue in this currency
    trend: string;     // e.g. "+12.5%" — percentage change vs. previous period
  }[];
}
```

---

## GET `/api/store/reports/summary`

Returns the key KPI cards for the reports page.

### Response `value`

```ts
{
  totalRevenue: number;       // sum of all delivered orders
  deliveredOrders: number;    // count of delivered orders
  lowStockCount: number;      // products at or below low-stock threshold
}
```

---

## DTOs Summary

All report endpoints are read-only (`GET`). No request body is needed — only query params for pagination and period selection.
