# Store Owner — Offers / Discounts

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## Offer Shape

```ts
interface Offer {
  id: string;                       // UUID
  nameEn: string;
  nameAr: string;
  type: "product" | "category" | "segment";
  targetId: string;                 // UUID of the product/category, or segment key
  targetNameEn: string;
  targetNameAr: string;
  discountType: "percent" | "fixed";
  discountValue: number;            // e.g. 15 (for 15%) or 50 (for 50 SAR off)
  currency?: string;                // ISO 4217 — only when discountType === "fixed"
  startDate: string;                // YYYY-MM-DD
  endDate: string;                  // YYYY-MM-DD
  isActive: boolean;
}
```

### Offer Status (computed client-side / server-side)

| Status      | Condition                                              |
| ----------- | ------------------------------------------------------ |
| `active`    | `isActive = true` AND today is between start and end   |
| `upcoming`  | `isActive = true` AND `startDate > today`              |
| `ended`     | `isActive = false` OR `endDate < today`                |

### Supported Segments

| `targetId` | Name (EN)         | Name (AR)          |
| ---------- | ----------------- | ------------------ |
| `vip`      | VIP Members       | أعضاء VIP          |
| `new`      | New Customers     | عملاء جدد          |
| `loyal`    | Loyal Customers   | عملاء مخلصون       |

---

## GET `/api/store/offers`

Returns all offers for the store, with optional status filter.

### Query Parameters

| Param    | Type     | Required | Default | Description                                      |
| -------- | -------- | -------- | ------- | ------------------------------------------------ |
| `status` | `string` | No       | `all`   | `all` \| `active` \| `upcoming` \| `ended`       |

### Response `value`

```ts
Offer[]
```

---

## POST `/api/store/offers`

Creates a new offer.

### Request DTO

```ts
{
  nameEn: string;                   // required
  nameAr: string;                   // required
  type: "product" | "category" | "segment";  // required
  targetId: string;                 // required; UUID or segment key
  targetNameEn: string;             // required
  targetNameAr: string;             // required
  discountType: "percent" | "fixed"; // required
  discountValue: number;            // required; > 0
  currency?: string;                // required when discountType === "fixed"
  startDate: string;                // required; YYYY-MM-DD
  endDate: string;                  // required; YYYY-MM-DD; must be ≥ startDate
  isActive: boolean;                // required
}
```

### Response `value`

`Offer` (newly created).

---

## PUT `/api/store/offers/{id}`

Updates an existing offer. All fields optional.

### Path Parameter

| Param | Type     | Description  |
| ----- | -------- | ------------ |
| `id`  | `string` | Offer UUID   |

### Request DTO

```ts
Partial<Omit<Offer, "id">>
```

### Response `value`

`Offer` (updated).

---

## PATCH `/api/store/offers/{id}/toggle`

Toggles the `isActive` flag on an offer without changing other fields.

### Path Parameter

| Param | Type     | Description  |
| ----- | -------- | ------------ |
| `id`  | `string` | Offer UUID   |

### Request DTO

```ts
{
  isActive: boolean;
}
```

### Response `value`

`Offer` (updated).

---

## DELETE `/api/store/offers/{id}`

Deletes an offer.

### Path Parameter

| Param | Type     | Description  |
| ----- | -------- | ------------ |
| `id`  | `string` | Offer UUID   |

### Response `value`

`null`
