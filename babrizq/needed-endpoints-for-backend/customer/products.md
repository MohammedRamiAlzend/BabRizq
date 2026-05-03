# Customer — Product Browsing (All Products)

> See [_shared.md](./_shared.md) for authentication headers, response envelope, Product shape, and sort options.

---

## GET `/api/storefront/products`

Returns a paginated, filterable list of all platform products. This powers the "All Products" grid on the homepage and the search results view.

### Query Parameters

| Param               | Type       | Required | Default   | Description                                                              |
| ------------------- | ---------- | -------- | --------- | ------------------------------------------------------------------------ |
| `page`              | `number`   | No       | 1         | Page number                                                              |
| `pageSize`          | `number`   | No       | 20        | Items per page                                                           |
| `search`            | `string`   | No       | —         | Full-text search on `nameEn` and `nameAr`                                |
| `priceMin`          | `number`   | No       | —         | Minimum price (SAR)                                                      |
| `priceMax`          | `number`   | No       | —         | Maximum price (SAR)                                                      |
| `stores`            | `string`   | No       | —         | Comma-separated store IDs to include, e.g. `techzone,leather-house`      |
| `categories`        | `string`   | No       | —         | Comma-separated platform category names, e.g. `Electronics,Watches`     |
| `onlyDiscounted`    | `boolean`  | No       | `false`   | When `true`, only return products with `originalPrice` set               |
| `onlyNew`           | `boolean`  | No       | `false`   | When `true`, only return products where `isNew === true`                 |
| `minRating`         | `number`   | No       | `0`       | Minimum rating (inclusive). E.g. `4` means only products rated 4.0+     |
| `sortBy`            | `string`   | No       | `default` | Sort order: `default`, `price-asc`, `price-desc`, `rating`, `newest`    |

### Response `value`

```ts
{
  items: Product[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  priceRange: {
    min: number;   // absolute minimum price across all matching (unfiltered) products
    max: number;   // absolute maximum price across all matching (unfiltered) products
  };
}
```

`priceRange` returns the global min/max (before price filters) so the client can initialize the price slider correctly.

---

## GET `/api/storefront/products/{id}`

Returns the details for a single product.

### Path Parameter

| Param | Type     | Description   |
| ----- | -------- | ------------- |
| `id`  | `string` | Product UUID  |

### Response `value`

`Product`

### Error Cases

| `topError.code`    | HTTP Status | When                              |
| ------------------ | ----------- | --------------------------------- |
| `PRODUCT_NOT_FOUND`| 404         | Product ID does not exist         |

---

## DTOs Summary

### Receive DTO (Response)

All product list responses include the full `Product` shape (see `_shared.md`). The key computed fields are:

| Field           | Computed how                                                            |
| --------------- | ----------------------------------------------------------------------- |
| `originalPrice` | Present only when a discount is active on the product                   |
| `isNew`         | Set by the store owner on product creation                              |
| `isFeatured`    | Set by the platform admin or store owner                                |
| `rating`        | Aggregated from customer reviews (server-computed)                      |
| `reviewCount`   | Count of customer reviews                                               |

### Filter State (sent as query params)

```ts
{
  search?: string;
  priceMin?: number;
  priceMax?: number;
  stores?: string;          // comma-separated store IDs
  categories?: string;      // comma-separated category names
  onlyDiscounted?: boolean;
  onlyNew?: boolean;
  minRating?: number;       // 0 | 3 | 4 | 4.5
  sortBy?: "default" | "price-asc" | "price-desc" | "rating" | "newest";
  page?: number;
  pageSize?: number;
}
```
