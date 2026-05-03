# Shared Conventions — Customer (Storefront) API

## Authentication

Customer endpoints require the authenticated user to have the `customer` role.

| Header          | Value                                                    |
| --------------- | -------------------------------------------------------- |
| `Authorization` | `****** (role must be `customer`) |

> Some read-only endpoints (product listing, store info) may be accessible without authentication in future, but the current UI enforces login for the `customer` role.

---

## Standard Response Envelope

All endpoints wrap their payload in this envelope:

```json
{
  "isSuccess": true,
  "isError": false,
  "errors": [],
  "topError": null,
  "value": { /* endpoint-specific payload */ }
}
```

On failure:

```json
{
  "isSuccess": false,
  "isError": true,
  "errors": ["Human-readable error message"],
  "topError": {
    "code": "ERROR_CODE",
    "httpStatus": 400
  },
  "value": null
}
```

---

## Paginated Response Shape

List endpoints return this structure inside `value`:

```json
{
  "items": [],
  "totalItems": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

---

## Core Shapes

### Product

```ts
interface Product {
  id: string;               // UUID
  nameEn: string;
  nameAr: string;
  price: number;            // current price (SAR)
  originalPrice?: number;   // original price before discount (SAR); omitted if no discount
  descriptionEn: string;
  descriptionAr: string;
  storeId: string;          // UUID of the owning store
  storeNameEn: string;
  storeNameAr: string;
  imageUrl: string;         // primary product image URL
  /** Platform-level category (controlled by admin) */
  categoryEn: string;       // e.g. "Electronics"
  categoryAr: string;       // e.g. "إلكترونيات"
  /** Store-specific sub-category ID (controlled by store owner) */
  storeCategoryId: string;
  /** Hashtag slugs for "Browse by Topic" grouping, e.g. ["wireless","audio"] */
  tags: string[];
  rating: number;           // 0.0–5.0
  reviewCount: number;
  isNew?: boolean;          // true if product is recently added
  isFeatured?: boolean;     // true if product is promoted (appears in Flash Deals)
}
```

### Store

```ts
interface Store {
  id: string;               // URL-safe slug, e.g. "techzone"
  nameEn: string;
  nameAr: string;
  emoji: string;            // single emoji used as logo, e.g. "📱"
  descriptionEn: string;
  descriptionAr: string;
  /** Platform-level category this store belongs to */
  categoryEn: string;
  categoryAr: string;
}
```

### StoreSpecificCategory

```ts
interface StoreSpecificCategory {
  id: string;               // UUID
  storeId: string;          // store slug
  nameEn: string;
  nameAr: string;
  emoji: string;
}
```

### Ad (Promotional Banner)

```ts
interface Ad {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;            // call-to-action button text
  ctaAr: string;
  emoji: string;
  gradient: string;         // Tailwind gradient utility for banner background
  linkType?: "category" | "store";
  linkValue?: string;       // category name (e.g. "Electronics") or store slug
}
```

---

## Platform Categories

| Code          | Arabic name    |
| ------------- | -------------- |
| `Electronics` | إلكترونيات     |
| `Accessories` | إكسسوارات      |
| `Watches`     | ساعات          |
| `Shoes`       | أحذية          |
| `Perfumes`    | عطور           |
| `Fashion`     | أزياء          |

---

## Sort Options

| Value        | Meaning                     |
| ------------ | --------------------------- |
| `default`    | Platform default order      |
| `price-asc`  | Price: low to high          |
| `price-desc` | Price: high to low          |
| `rating`     | Highest rated first         |
| `newest`     | New arrivals first          |

---

## Related Categories Map

The server should return related categories (for "You Might Also Like" sections) based on this mapping:

```
Electronics  → [Watches]
Watches      → [Electronics, Accessories]
Accessories  → [Fashion, Shoes]
Shoes        → [Fashion, Accessories]
Perfumes     → [Accessories]
Fashion      → [Shoes, Accessories]
```
