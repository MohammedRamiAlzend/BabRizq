# Store Owner — Warehouse & Inventory

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## Shapes

### InventoryItem

```ts
interface InventoryItem {
  id: string;         // UUID (same as product id)
  nameEn: string;
  nameAr: string;
  stock: number;      // current quantity on hand
  sku?: string;       // stock-keeping unit
}
```

### StockMovement

```ts
interface StockMovement {
  id: string;               // UUID
  productId: string;        // UUID
  productNameEn: string;
  productNameAr: string;
  type: "in" | "out" | "adjustment";
  quantity: number;         // always positive; direction is determined by `type`
  reason: string;           // English description
  reasonAr: string;         // Arabic description
  date: string;             // YYYY-MM-DD
  supplierId?: string;      // UUID; present when type === "in"
  supplierNameEn?: string;
  supplierNameAr?: string;
  reference?: string;       // e.g. purchase order number "PO-2026-041"
}
```

### Supplier

```ts
interface Supplier {
  id: string;               // UUID
  nameEn: string;
  nameAr: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: number; // computed: count of products from this supplier
}
```

---

## Inventory

### GET `/api/store/warehouse/inventory`

Returns a paginated list of products with their current stock levels.

#### Query Parameters

| Param      | Type     | Required | Default | Description                                              |
| ---------- | -------- | -------- | ------- | -------------------------------------------------------- |
| `page`     | `number` | No       | 1       | Page number                                              |
| `pageSize` | `number` | No       | 10      | Items per page                                           |
| `search`   | `string` | No       | —       | Filter by product name (EN or AR)                        |
| `filter`   | `string` | No       | `all`   | `all` \| `low` (stock ≤ threshold) \| `out` (stock = 0) |

#### Response `value`

Paginated list (see `_shared.md`), with `items: InventoryItem[]`.

---

### PUT `/api/store/warehouse/inventory/{productId}/adjust`

Adjusts the stock level for a product (positive = restock, negative = removal).

#### Path Parameter

| Param       | Type     | Description     |
| ----------- | -------- | --------------- |
| `productId` | `string` | Product UUID    |

#### Request DTO

```ts
{
  delta: number;    // required; positive to add stock, negative to remove
  note?: string;    // optional reason / reference
}
```

#### Response `value`

`InventoryItem` (with updated `stock`).

#### Error Cases

| `topError.code`         | HTTP Status | When                          |
| ----------------------- | ----------- | ----------------------------- |
| `STOCK_CANNOT_BE_NEGATIVE` | 422      | `current stock + delta < 0`  |

---

## Stock Movements

### GET `/api/store/warehouse/movements`

Returns a paginated log of all stock movements (in, out, adjustment).

#### Query Parameters

| Param      | Type     | Required | Default | Description     |
| ---------- | -------- | -------- | ------- | --------------- |
| `page`     | `number` | No       | 1       | Page number     |
| `pageSize` | `number` | No       | 10      | Items per page  |

#### Response `value`

Paginated list (see `_shared.md`), with `items: StockMovement[]`.

---

## Suppliers

### GET `/api/store/warehouse/suppliers`

Returns a paginated list of suppliers.

#### Query Parameters

| Param      | Type     | Required | Default | Description     |
| ---------- | -------- | -------- | ------- | --------------- |
| `page`     | `number` | No       | 1       | Page number     |
| `pageSize` | `number` | No       | 10      | Items per page  |

#### Response `value`

Paginated list (see `_shared.md`), with `items: Supplier[]`.

---

### POST `/api/store/warehouse/suppliers`

Adds a new supplier.

#### Request DTO

```ts
{
  nameEn: string;       // required
  nameAr: string;       // required
  contactName: string;  // required; name of the contact person
  phone: string;        // required
  email: string;        // required; valid email
  address: string;      // required
}
```

#### Response `value`

`Supplier` (newly created, `productsSupplied: 0`).

---

### PUT `/api/store/warehouse/suppliers/{id}`

Updates an existing supplier. All fields are optional.

#### Path Parameter

| Param | Type     | Description   |
| ----- | -------- | ------------- |
| `id`  | `string` | Supplier UUID |

#### Request DTO

```ts
Partial<Omit<Supplier, "id" | "productsSupplied">>
```

#### Response `value`

`Supplier` (updated).

---

### DELETE `/api/store/warehouse/suppliers/{id}`

Deletes a supplier.

#### Path Parameter

| Param | Type     | Description   |
| ----- | -------- | ------------- |
| `id`  | `string` | Supplier UUID |

#### Response `value`

`null`
