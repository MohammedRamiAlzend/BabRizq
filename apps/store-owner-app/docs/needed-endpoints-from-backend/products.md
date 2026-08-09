# Store Owner — Products

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## Product Shape

```ts
interface Product {
  id: string;                   // UUID
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionEn2?: string;      // secondary description (optional)
  descriptionAr2?: string;
  images: string[];             // array of image URLs
  price: number;                // base price in primary currency (SAR)
  currencyPrices: {
    currency: string;           // ISO 4217 code
    amount: number;
  }[];
  stock: number;
  categoryId: string;           // UUID of a store-specific category
  sku?: string;
  barcode?: string;
  hasOffer: boolean;            // computed: true if an active offer targets this product
}
```

---

## GET `/api/store/products`

Returns a paginated list of the store's products.

### Query Parameters

| Param        | Type     | Required | Default | Description                         |
| ------------ | -------- | -------- | ------- | ----------------------------------- |
| `page`       | `number` | No       | 1       | Page number                         |
| `pageSize`   | `number` | No       | 10      | Items per page                      |
| `search`     | `string` | No       | —       | Filter by name (EN or AR)           |
| `categoryId` | `string` | No       | —       | Filter by store-specific category UUID |

### Response `value`

Paginated list (see `_shared.md`), with `items: Product[]`.

---

## POST `/api/store/products`

Creates a new product.

### Request DTO

```ts
{
  nameEn: string;               // required
  nameAr: string;               // required
  descriptionEn: string;        // required
  descriptionAr: string;        // required
  descriptionEn2?: string;
  descriptionAr2?: string;
  images?: string[];            // array of image URLs (upload separately if needed)
  price: number;                // required; base SAR price
  currencyPrices: {
    currency: string;
    amount: number;
  }[];
  stock: number;                // required; initial stock quantity
  categoryId: string;           // required; UUID of a store-specific category
  sku?: string;
  barcode?: string;
}
```

### Response `value`

`Product` (newly created, with server-generated `id` and `hasOffer: false`).

---

## PUT `/api/store/products/{id}`

Updates an existing product. All fields are optional (partial update).

### Path Parameter

| Param | Type   | Description     |
| ----- | ------ | --------------- |
| `id`  | `string` | Product UUID  |

### Request DTO

```ts
Partial<Omit<Product, "id" | "hasOffer">>
```

### Response `value`

`Product` (updated).

---

## DELETE `/api/store/products/{id}`

Deletes a product.

### Path Parameter

| Param | Type   | Description     |
| ----- | ------ | --------------- |
| `id`  | `string` | Product UUID  |

### Response `value`

`null`

---

## GET `/api/store/products/{id}/price-history`

Returns the price history log for a product.

### Response `value`

```ts
{
  entries: {
    currency: string;   // ISO 4217
    amount: number;
    date: string;       // YYYY-MM-DD
  }[];
}
```

---

## GET `/api/store/products/{id}/qr`

Generates a QR code for the product (links to the storefront product page).

### Response `value`

```ts
{
  qrDataUrl: string;   // base-64 encoded PNG, e.g. "data:image/png;base64,..."
}
```

---

## Image Upload

To attach images to a product, use a separate multipart upload:

```
POST /api/store/products/{id}/images   (multipart/form-data, field: "file")
Response value: { url: string }
```

Then include the returned URL in the `images` array when creating/updating the product.
