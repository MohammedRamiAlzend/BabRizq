# Customer — Store Catalog Page

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and core shapes.

The store catalog page (`/store/s/{storeId}`) shows a single store's full details, its products (filterable by the store's own sub-categories), similar stores, and related products from the same platform category.

---

## GET `/api/storefront/stores/{storeId}`

Returns the full details of a single store including its store-specific categories and an ad carousel.

### Path Parameter

| Param     | Type     | Description         |
| --------- | -------- | ------------------- |
| `storeId` | `string` | Store slug/UUID     |

### Response `value`

```ts
{
  store: Store;
  storeCategories: StoreSpecificCategory[];   // sub-categories managed by the store owner
  ads: Ad[];                                  // store-specific promotional banners
  productCount: number;                       // total products in this store
}
```

### Error Cases

| `topError.code`  | HTTP Status | When                    |
| ---------------- | ----------- | ----------------------- |
| `STORE_NOT_FOUND`| 404         | Store slug does not exist |

---

## GET `/api/storefront/stores/{storeId}/products`

Returns the products for a specific store, optionally filtered by the store's own sub-category and a search query.

### Path Parameter

| Param     | Type     | Description     |
| --------- | -------- | --------------- |
| `storeId` | `string` | Store slug/UUID |

### Query Parameters

| Param             | Type     | Required | Default | Description                                            |
| ----------------- | -------- | -------- | ------- | ------------------------------------------------------ |
| `page`            | `number` | No       | 1       | Page number                                            |
| `pageSize`        | `number` | No       | 20      | Items per page                                         |
| `search`          | `string` | No       | —       | Filter by `nameEn` or `nameAr`                         |
| `storeCategoryId` | `string` | No       | —       | Filter by store-specific category ID. Omit for all.    |

### Response `value`

```ts
{
  items: Product[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryProductCounts: Record<string, number>;   // storeCategoryId → count
}
```

`categoryProductCounts` lets the client display the product count badge on each category chip without extra requests.

---

## GET `/api/storefront/stores/{storeId}/similar`

Returns stores in the same platform category (excluding the current store), used for the "Similar Stores" section.

### Path Parameter

| Param     | Type     | Description     |
| --------- | -------- | --------------- |
| `storeId` | `string` | Store slug/UUID |

### Query Parameters

| Param   | Type     | Required | Default | Description          |
| ------- | -------- | -------- | ------- | -------------------- |
| `limit` | `number` | No       | 6       | Max stores to return |

### Response `value`

```ts
{
  stores: (Store & { productCount: number })[];
}
```

---

## GET `/api/storefront/stores/{storeId}/more-in-category`

Returns products from the same platform category but belonging to other stores. Powers the "More in [Category]" section.

### Path Parameter

| Param     | Type     | Description     |
| --------- | -------- | --------------- |
| `storeId` | `string` | Store slug/UUID |

### Query Parameters

| Param   | Type     | Required | Default | Description          |
| ------- | -------- | -------- | ------- | -------------------- |
| `limit` | `number` | No       | 8       | Max products to return |

### Response `value`

```ts
{
  categoryEn: string;
  categoryAr: string;
  products: Product[];
}
```
