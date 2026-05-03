# Customer — Personalized Recommendations

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and Product shape.

---

## Overview

The storefront shows a **"Recommended for You"** section that is personalized based on the customer's browsing history. Currently this is handled entirely client-side:

- When a customer clicks a product, store, or category tile, `trackInterest(categoryName)` is called.
- The interest list is persisted in `localStorage` under the key `customer_interests_v1`.
- A maximum of 15 category names are stored, ordered by recency (most recent first).
- Products from the top 3 most recent interest categories (up to 8 products) are shown.

When integrating a real backend, the following endpoints should be implemented.

---

## POST `/api/customer/interests`

Records a customer interest event. Called whenever the customer interacts with a product, category tile, or store card.

### Request DTO

```ts
{
  categoryEn: string;   // required; platform category name, e.g. "Electronics"
}
```

### Response `value`

`null`

### Behavior

- The server maintains an ordered list of up to 15 categories per customer (most recent first).
- Duplicate categories are moved to the front rather than appended.
- This endpoint is fire-and-forget: failures should be silently swallowed on the client.

---

## GET `/api/customer/recommendations`

Returns personalized product recommendations for the customer based on their stored interest history.

### Query Parameters

| Param   | Type     | Required | Default | Description                         |
| ------- | -------- | -------- | ------- | ----------------------------------- |
| `limit` | `number` | No       | 8       | Maximum number of products to return |

### Response `value`

```ts
{
  products: Product[];
  basedOnCategories: string[];   // top categories used for recommendation
}
```

### Algorithm

1. Fetch the customer's top 3 most recently interacted categories.
2. Filter platform products whose `categoryEn` matches any of these categories.
3. Return up to `limit` products (mixed from matching categories).
4. If the customer has no interests, return an empty list.

---

## Notes on Client-Side Fallback

Until a backend is available, the client uses `localStorage` exclusively:

- **Storage key:** `customer_interests_v1`
- **Format:** `string[]` — JSON array of category names, most recent first
- **Max entries:** 15
- **Triggers:** clicking any `ProductCard`, `CategoryTile`, or `StoreCard`
