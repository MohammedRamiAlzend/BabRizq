# Customer — Category Catalog Page

> See [_shared.md](./_shared.md) for authentication headers, response envelope, Product shape, and the Related Categories map.

The category catalog page (`/store/c/{categoryEn}`) shows all products in a single platform category, grouped by sub-tags ("Browse by Topic"), with related categories and a category-specific ad carousel.

---

## GET `/api/storefront/categories/{categoryEn}`

Returns metadata for a platform category and all products within it.

### Path Parameter

| Param        | Type     | Description                          |
| ------------ | -------- | ------------------------------------ |
| `categoryEn` | `string` | English category name, e.g. `Electronics` |

### Query Parameters

| Param      | Type     | Required | Default | Description                              |
| ---------- | -------- | -------- | ------- | ---------------------------------------- |
| `page`     | `number` | No       | 1       | Page number for the products list        |
| `pageSize` | `number` | No       | 20      | Items per page                           |
| `search`   | `string` | No       | —       | Filter products by `nameEn` or `nameAr`  |

### Response `value`

```ts
{
  category: {
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
  };

  items: Product[];         // paginated products in this category
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;

  storeCount: number;       // number of stores that sell in this category

  ads: Ad[];                // category-specific promotional banners

  tagGroups: {
    tag: string;            // slug e.g. "wireless"
    labelEn: string;        // human label e.g. "Wireless & Bluetooth"
    labelAr: string;        // Arabic label
    products: Product[];    // products carrying this tag (within the category, unfiltered by search)
  }[];                      // at most 5 tag groups, ordered by product count descending

  relatedCategories: {
    nameEn: string;
    nameAr: string;
    productCount: number;
  }[];                      // categories related to this one (see _shared.md Related Categories Map)
}
```

### Error Cases

| `topError.code`       | HTTP Status | When                              |
| --------------------- | ----------- | --------------------------------- |
| `CATEGORY_NOT_FOUND`  | 404         | `categoryEn` is not a recognized platform category |

---

## GET `/api/storefront/categories/{categoryEn}/stores`

Returns stores that sell in this platform category. Used for the store count badge on the category hero.

### Path Parameter

| Param        | Type     | Description           |
| ------------ | -------- | --------------------- |
| `categoryEn` | `string` | Platform category name |

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

## Tag Group Logic

The server should compute `tagGroups` by:

1. Collecting all products in the category (ignoring the `search` filter — tag groups are always based on the full category set).
2. Building a map of `tag → Product[]`.
3. Including only tags that appear in **2 or more** products (or 1+ if the category has fewer than 4 products total).
4. Sorting groups by product count descending and capping at **5 groups**.

Tag human-readable labels should be stored server-side (matching the client-side `TAG_LABELS` map). Example entries:

| slug                | EN                   | AR                         |
| ------------------- | -------------------- | -------------------------- |
| `wireless`          | Wireless & Bluetooth | لاسلكي وبلوتوث             |
| `audio`             | Audio & Sound        | صوت وسماعات                |
| `flagship`          | Flagship Phones      | هواتف رائدة                |
| `leather`           | Leather Collection   | مجموعة الجلد               |
| `arabic-fragrance`  | Arabic Fragrances    | عطور عربية                 |
| `oud`               | Oud & Oriental       | عود وعطور شرقية            |
| `sneakers`          | Sneakers             | أحذية رياضية               |
| `knitwear`          | Knitwear & Wool      | تريكو وصوف                 |

_(See client source for the full list in `CategoryCatalogPage.tsx`.)_
