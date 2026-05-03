# Store Owner — Accounting & Finance

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## Shapes

### Invoice

```ts
interface Invoice {
  id: string;                       // UUID
  invoiceNumber: string;            // auto-generated, e.g. "INV-2026-0042"
  orderId: string;                  // UUID of the linked order
  orderNumber: string;              // e.g. "#BRQ-1042"
  customerNameEn: string;
  customerNameAr: string;
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;                  // unit price
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;                 // ISO 4217
  date: string;                     // YYYY-MM-DD (issue date)
  status: "paid" | "unpaid" | "cancelled";
}
```

### Expense

```ts
interface Expense {
  id: string;                       // UUID
  titleEn: string;
  titleAr: string;
  category: "rent" | "salary" | "marketing" | "shipping" | "utilities" | "other";
  amount: number;
  currency: string;                 // ISO 4217
  date: string;                     // YYYY-MM-DD
  note?: string;
}
```

---

## GET `/api/store/accounting/summary`

Returns the Profit & Loss summary for the store.

### Response `value`

```ts
{
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;             // percentage, e.g. 33.5
  pnlByMonth: {
    month: string;                  // e.g. "Jan"
    monthAr: string;
    revenue: number;
    expenses: number;
  }[];
}
```

---

## GET `/api/store/accounting/invoices`

Returns a paginated list of invoices.

### Query Parameters

| Param      | Type     | Required | Default | Description                                      |
| ---------- | -------- | -------- | ------- | ------------------------------------------------ |
| `page`     | `number` | No       | 1       | Page number                                      |
| `pageSize` | `number` | No       | 10      | Items per page                                   |
| `search`   | `string` | No       | —       | Filter by invoice number or customer name        |
| `status`   | `string` | No       | —       | `paid` \| `unpaid` \| `cancelled`                |

### Response `value`

Paginated list (see `_shared.md`), with `items: Invoice[]`.

---

## POST `/api/store/accounting/invoices`

Creates a new invoice manually (not auto-generated from an order).

### Request DTO

```ts
{
  orderId: string;              // required; UUID of the linked order
  orderNumber: string;          // required
  customerNameEn: string;       // required
  customerNameAr: string;       // required
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;
  }[];
  subtotal: number;             // required
  discount: number;             // required; 0 if no discount
  tax: number;                  // required; 0 if no tax
  total: number;                // required; subtotal - discount + tax
  currency: string;             // required; ISO 4217
  date: string;                 // required; YYYY-MM-DD
  status: "paid" | "unpaid" | "cancelled";  // required
}
```

### Response `value`

`Invoice` (newly created, with server-generated `id` and `invoiceNumber`).

---

## GET `/api/store/accounting/expenses`

Returns a paginated list of expenses.

### Query Parameters

| Param      | Type     | Required | Default | Description                |
| ---------- | -------- | -------- | ------- | -------------------------- |
| `page`     | `number` | No       | 1       | Page number                |
| `pageSize` | `number` | No       | 10      | Items per page             |

### Response `value`

Paginated list (see `_shared.md`), with `items: Expense[]`.

---

## POST `/api/store/accounting/expenses`

Records a new expense.

### Request DTO

```ts
{
  titleEn: string;              // required
  titleAr: string;              // required
  category: "rent" | "salary" | "marketing" | "shipping" | "utilities" | "other";  // required
  amount: number;               // required; > 0
  currency: string;             // required; ISO 4217
  date: string;                 // required; YYYY-MM-DD
  note?: string;
}
```

### Response `value`

`Expense` (newly created).
