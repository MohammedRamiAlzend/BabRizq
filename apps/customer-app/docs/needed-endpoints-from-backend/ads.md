# Customer — Ads & Promotional Banners

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and Ad shape.

---

## Overview

Three types of ad carousels appear in the storefront:

| Context           | Where shown                              | Endpoint                            |
| ----------------- | ---------------------------------------- | ----------------------------------- |
| **Platform Ads**  | Homepage (shown to all customers)        | `GET /api/storefront/ads`           |
| **Store Ads**     | Individual store catalog page            | `GET /api/storefront/stores/{id}/ads` |
| **Category Ads**  | Individual category catalog page         | `GET /api/storefront/categories/{categoryEn}/ads` |

---

## GET `/api/storefront/ads`

Returns all active platform-wide promotional banners, displayed in the main homepage ad carousel.

### Response `value`

```ts
{
  ads: Ad[];
}
```

Ads should be ordered by `position` (ascending) or by relevance/recency as configured by the admin.

---

## GET `/api/storefront/stores/{storeId}/ads`

Returns store-specific promotional banners, displayed in the ad carousel on a store's catalog page.

### Path Parameter

| Param     | Type     | Description     |
| --------- | -------- | --------------- |
| `storeId` | `string` | Store slug/UUID |

### Response `value`

```ts
{
  ads: Ad[];   // empty array if the store has no ads
}
```

---

## GET `/api/storefront/categories/{categoryEn}/ads`

Returns promotional banners specific to a platform category, displayed on the category catalog page.

### Path Parameter

| Param        | Type     | Description             |
| ------------ | -------- | ----------------------- |
| `categoryEn` | `string` | Platform category name  |

### Response `value`

```ts
{
  ads: Ad[];   // empty array if the category has no ads
}
```

---

## Ad Shape (reference)

```ts
interface Ad {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;           // call-to-action button text
  ctaAr: string;
  emoji: string;
  gradient: string;        // Tailwind gradient class, e.g. "from-blue-600 to-indigo-700"
  linkType?: "category" | "store";
  linkValue?: string;      // category name (e.g. "Electronics") or store slug (e.g. "techzone")
}
```

### Ad Click Behavior

| `linkType`   | Navigation target          |
| ------------ | -------------------------- |
| `"category"` | `/store/c/{linkValue}`     |
| `"store"`    | `/store/s/{linkValue}`     |
| `undefined`  | No navigation (banner only) |

---

## Notes

- If an endpoint returns an empty `ads` array, the client should hide the carousel section entirely.
- Ads are managed by the platform admin (platform ads and category ads) or by the store owner (store ads).
- Ad management endpoints are documented in the **Admin** and **Store Owner** endpoint docs respectively.
