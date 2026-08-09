# Customer — Storefront Homepage

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and core shapes.

The homepage is composed of several independent sections. To avoid one large monolithic endpoint, the backend should expose **per-section endpoints** so the frontend can load them in parallel.

---

## GET `/api/storefront/stores`

Returns all stores visible on the platform, used for the "Browse by Store" horizontal scroll.

### Query Parameters

_None_

### Response `value`

```ts
{
  stores: (Store & { productCount: number })[];
}
```

`productCount` is the total number of products listed in that store.

---

## GET `/api/storefront/categories`

Returns the list of platform-level categories with deal indicators, used for the "Shop by Category" tile grid.

### Response `value`

```ts
{
  categories: {
    nameEn: string;
    nameAr: string;
    hasDeals: boolean;   // true if at least one discounted product exists in this category
  }[];
}
```

---

## GET `/api/storefront/featured`

Returns products that are featured or on sale, used for the "Flash Deals" horizontal scroll.

### Query Parameters

| Param  | Type     | Required | Default | Description                          |
| ------ | -------- | -------- | ------- | ------------------------------------ |
| `limit`| `number` | No       | 12      | Maximum number of products to return |

### Response `value`

```ts
{
  products: Product[];
}
```

Products are filtered to those where `isFeatured === true` or `originalPrice` is set.

---

## GET `/api/storefront/recommendations`

Returns personalized product recommendations based on the customer's interest categories.

### Query Parameters

| Param        | Type     | Required | Description                                                          |
| ------------ | -------- | -------- | -------------------------------------------------------------------- |
| `categories` | `string` | Yes      | Comma-separated list of category names the customer has interacted with, ordered by recency. e.g. `Electronics,Watches,Accessories` |
| `limit`      | `number` | No       | Max products to return. Default: 8                                   |

### Response `value`

```ts
{
  products: Product[];
}
```

Products are filtered to those whose `categoryEn` appears in the `categories` param.  
If `categories` is empty or omitted, returns an empty list.

> **Note:** Interest tracking is currently handled client-side via `localStorage`. When a backend is integrated, the client should POST interest events (see [recommendations.md](./recommendations.md)).

---

## GET `/api/storefront/ads`

Returns the global promotional banners shown in the main homepage ad carousel.

### Response `value`

```ts
{
  ads: Ad[];
}
```

See `Ad` shape in [_shared.md](./_shared.md).
