# Store Owner — Categories

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## Category Shape

These are **store-specific** categories — created and managed by the store owner, and visible only on the store's own storefront page.  
Platform-level categories (created by the platform admin) are **read-only** for store owners and returned by a separate admin endpoint.

```ts
interface Category {
  id: string;           // UUID
  nameEn: string;
  nameAr: string;
  iconOrEmoji: string;  // a single emoji character, e.g. "📱"
  productsCount: number; // computed: number of products linked to this category
}
```

---

## GET `/api/store/categories`

Returns all store-specific categories.

### Query Parameters

_None_

### Response `value`

```ts
Category[]
```

---

## POST `/api/store/categories`

Creates a new store-specific category.

### Request DTO

```ts
{
  nameEn: string;        // required
  nameAr: string;        // required
  iconOrEmoji: string;   // required; single emoji e.g. "📱"
}
```

### Response `value`

`Category` (newly created, `productsCount: 0`).

---

## PUT `/api/store/categories/{id}`

Updates an existing category.

### Path Parameter

| Param | Type     | Description    |
| ----- | -------- | -------------- |
| `id`  | `string` | Category UUID  |

### Request DTO

```ts
{
  nameEn?: string;
  nameAr?: string;
  iconOrEmoji?: string;
}
```

### Response `value`

`Category` (updated).

---

## DELETE `/api/store/categories/{id}`

Deletes a category. Fails with `409` if products are still linked, unless `force=true` is passed.

### Path Parameter

| Param | Type     | Description    |
| ----- | -------- | -------------- |
| `id`  | `string` | Category UUID  |

### Query Parameters

| Param   | Type      | Required | Default | Description                                              |
| ------- | --------- | -------- | ------- | -------------------------------------------------------- |
| `force` | `boolean` | No       | `false` | If `true`, unlinks all products and deletes the category |

### Response `value`

`null`

### Error Cases

| `topError.code`           | HTTP Status | When                                                      |
| ------------------------- | ----------- | --------------------------------------------------------- |
| `CATEGORY_HAS_PRODUCTS`   | 409         | Category has linked products and `force` is not `true`    |

---

## Notes

- **Platform categories** (e.g. Electronics, Accessories, Watches) are managed by the platform admin. The store owner can read them (via an admin endpoint) but cannot create, edit, or delete them.
- A product's `categoryId` should reference a store-specific category UUID. Products may also reference a `platformCategoryId` set by the admin.
