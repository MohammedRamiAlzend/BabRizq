# Store Owner — Dashboard Overview

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## GET `/api/store/overview`

Returns the aggregated dashboard summary for the authenticated store.

### Query Parameters

_None_

### Response `value`

```ts
{
  totalSales: number;           // e.g. 24580 (in the store's primary currency)
  totalOrders: number;          // total order count (all statuses)
  netProfit: number;
  lowStockCount: number;        // products with stock ≤ threshold (default 5)

  monthlySales: {
    month: string;              // e.g. "Jan"
    monthAr: string;            // e.g. "يناير"
    sales: number;
    orders: number;
  }[];

  ordersByStatus: {
    status: "pending" | "processing" | "shipped" | "delivered";
    count: number;
  }[];

  topProducts: {
    id: string;                 // product UUID
    nameEn: string;
    nameAr: string;
    sold: number;               // units sold
    revenue: number;
  }[];

  revenueByCurrency: {
    currency: string;           // ISO 4217 code
    symbol: string;
    amount: number;
    trend: string;              // e.g. "+12.5%"
  }[];

  recentOrders: Order[];        // last 4–5 orders (see orders.md for Order shape)
}
```

---

## DTOs

### Request DTO
_None — GET with no body._

### Response DTO

| Field              | Type                          | Description                              |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `totalSales`       | `number`                      | Total revenue across all delivered orders |
| `totalOrders`      | `number`                      | Count of all orders (all statuses)       |
| `netProfit`        | `number`                      | Revenue minus expenses                   |
| `lowStockCount`    | `number`                      | Products at or below low-stock threshold  |
| `monthlySales`     | `MonthlySalesEntry[]`         | 12-month sales chart data                |
| `ordersByStatus`   | `OrderStatusCount[]`          | Breakdown by status for pie chart        |
| `topProducts`      | `TopProduct[]`                | Best-selling products by revenue         |
| `revenueByCurrency`| `CurrencyRevenue[]`           | Revenue grouped by currency              |
| `recentOrders`     | `Order[]`                     | Most recent orders (partial list)        |
