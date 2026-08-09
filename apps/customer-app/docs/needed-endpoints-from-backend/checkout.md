# Customer — Checkout & Order Placement

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## POST `/api/customer/orders`

Places an order using the customer's current cart contents. The cart is cleared on success.

### Request DTO

```ts
{
  fullName: string;       // required; customer's full name
  phone: string;          // required; valid phone number, e.g. "+966 5XX XXX XXXX"
  deliveryAddress: string; // required; complete delivery address
  paymentMethod?: string; // optional; e.g. "cash", "card", "mada". Defaults to "cash".
  notes?: string;         // optional; delivery instructions or order notes
}
```

### Response `value`

```ts
{
  orderId: string;          // UUID of the newly created order
  orderNumber: string;      // human-readable reference, e.g. "#BRQ-1043"
  status: "pending";        // initial status is always "pending"
  items: {
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;          // unit price at time of order
  }[];
  total: number;            // SAR amount
  currency: "SAR";
  estimatedDeliveryDays: number;   // from the store's shipping settings
  createdAt: string;        // ISO 8601 timestamp
}
```

### Business Rules

- The order is created from the items currently in the customer's cart (server-side cart).
- Each item's `price` is locked at the time of order placement (not subject to later price changes).
- Stock is decremented for each product upon successful order creation.
- The cart is automatically cleared after a successful order.
- If any product in the cart is out of stock at order time, the request fails with `INSUFFICIENT_STOCK`.

### Error Cases

| `topError.code`      | HTTP Status | When                                                       |
| -------------------- | ----------- | ---------------------------------------------------------- |
| `CART_EMPTY`         | 400         | The customer's cart has no items                           |
| `INSUFFICIENT_STOCK` | 409         | One or more products no longer have sufficient stock       |
| `PRODUCT_NOT_FOUND`  | 404         | A product in the cart was deleted since it was added       |

---

## GET `/api/customer/orders`

Returns the customer's order history.

### Query Parameters

| Param      | Type     | Required | Default | Description                                             |
| ---------- | -------- | -------- | ------- | ------------------------------------------------------- |
| `page`     | `number` | No       | 1       | Page number                                             |
| `pageSize` | `number` | No       | 10      | Items per page                                          |
| `status`   | `string` | No       | —       | Filter by status: `pending`, `processing`, `shipped`, `delivered` |

### Response `value`

```ts
{
  items: {
    orderId: string;
    orderNumber: string;
    date: string;           // YYYY-MM-DD
    status: "pending" | "processing" | "shipped" | "delivered";
    total: number;
    currency: string;       // ISO 4217
    itemCount: number;
  }[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## GET `/api/customer/orders/{orderId}`

Returns the full details of a specific order.

### Path Parameter

| Param     | Type     | Description  |
| --------- | -------- | ------------ |
| `orderId` | `string` | Order UUID   |

### Response `value`

```ts
{
  orderId: string;
  orderNumber: string;
  date: string;                     // YYYY-MM-DD
  status: "pending" | "processing" | "shipped" | "delivered";
  fullName: string;
  phone: string;
  deliveryAddress: string;
  items: {
    productId: string;
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  currency: string;
  estimatedDeliveryDays: number;
  notes?: string;
  createdAt: string;                // ISO 8601
}
```

### Error Cases

| `topError.code`    | HTTP Status | When                              |
| ------------------ | ----------- | --------------------------------- |
| `ORDER_NOT_FOUND`  | 404         | Order does not exist or belongs to another customer |
