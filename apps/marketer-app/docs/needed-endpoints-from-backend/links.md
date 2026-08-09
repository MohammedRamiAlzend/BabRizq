# Marketer — Affiliate Links

This document covers the endpoints used by the marketer link generator page.

---

## `GET /api/marketer/links?page=1&pageSize=10&type=all|store|product`

Returns a paginated list of affiliate links owned by the current marketer.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `marketer`

### Query Parameters

| Name       | Type   | Notes                                   |
| ---------- | ------ | --------------------------------------- |
| `page`     | number | 1-based page index                      |
| `pageSize` | number | Number of rows per page                 |
| `type`     | string | `all`, `store`, or `product`           |

### Response `value`

```ts
{
  items: AffiliateLink[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## `POST /api/marketer/links/generate`

Creates a new tracking link for a store or product target.

### Request DTO

```ts
{
  targetId: string;          // UUID
  targetType: 'store' | 'product';
}
```

### Response `value`

`AffiliateLink` (newly generated, or the existing link if already created)

---

## `DELETE /api/marketer/links/{id}`

Deletes one of the marketer's affiliate links.

### Response `value`

`null`

### Notes

- The server should ensure marketers can only delete their own links.
- The UI can use a confirmation dialog before deletion.

---

## `GET /api/marketer/targets?search=`

Returns available stores and products that can be turned into affiliate links.

### Response `value`

`AffiliateTarget[]`

### Notes

- The marketer UI uses this to populate the link generator dropdown.