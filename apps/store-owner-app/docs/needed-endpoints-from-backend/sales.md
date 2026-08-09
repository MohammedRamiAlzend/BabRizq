# Store Owner — Sales

> See [_shared.md](./_shared.md) for authentication headers and response envelope.  
> Sales records are orders that have reached `delivered` status.

---

## SaleRecord Shape

```ts
interface SaleRecord {
  id: string;               // UUID (same as order id)
  orderNumber: string;      // e.g. "#BRQ-1032"
  date: string;             // YYYY-MM-DD
  customerNameEn: string;
  customerNameAr: string;
  total: number;
  currency: string;         // ISO 4217
  status: "delivered";      // always "delivered" in this context
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;          // unit price
  }[];
}
```

---

## GET `/api/store/sales`

Returns a paginated list of delivered orders (completed sales), with summary statistics.

### Query Parameters

| Param      | Type     | Required | Default | Description                                          |
| ---------- | -------- | -------- | ------- | ---------------------------------------------------- |
| `page`     | `number` | No       | 1       | Page number                                          |
| `pageSize` | `number` | No       | 10      | Items per page                                       |
| `search`   | `string` | No       | —       | Filter by order number or customer name (EN or AR)   |
| `currency` | `string` | No       | —       | Filter by ISO 4217 currency code                     |
| `minAmount`| `number` | No       | —       | Minimum order total                                  |
| `maxAmount`| `number` | No       | —       | Maximum order total                                  |
| `fromDate` | `string` | No       | —       | Start of date range (`YYYY-MM-DD`)                   |
| `toDate`   | `string` | No       | —       | End of date range (`YYYY-MM-DD`)                     |

### Response `value`

```ts
{
  items: SaleRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    byCurrency: {
      currency: string;
      amount: number;
    }[];
  };
}
```

---

## GET `/api/store/sales/export`

Downloads a CSV or Excel file of the filtered sales records.

### Query Parameters

Same filters as `GET /api/store/sales`, plus:

| Param      | Type     | Required | Default | Description                            |
| ---------- | -------- | -------- | ------- | -------------------------------------- |
| `format`   | `string` | No       | `csv`   | `csv` or `xlsx`                        |
| `currency` | `string` | No       | —       | Filter by currency (same as list endpoint) |

### Response

A file download:
- `text/csv` for `format=csv`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` for `format=xlsx`

CSV columns: `Order, Customer, Date, Amount, Currency, Status`

---

## DTOs Summary

### Request DTOs

| Endpoint                   | Body DTO | Notes                                    |
| -------------------------- | -------- | ---------------------------------------- |
| `GET /api/store/sales`     | None     | Query params only                        |
| `GET /api/store/sales/export` | None  | Query params only; returns file download |

### Response DTOs

All `GET` responses follow the standard paginated envelope. See shapes above.
