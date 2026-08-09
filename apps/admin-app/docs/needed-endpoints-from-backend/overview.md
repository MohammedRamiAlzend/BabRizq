# Admin — Dashboard Overview

## `GET /api/admin/overview`

Returns the top-level platform metrics displayed on the admin dashboard.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `admin`

### Response `value`

```ts
{
  totalUsers: number;
  totalStores: number;
  platformRevenue: number;  // SAR
  activeMarketers: number;
}
```

### Example Response

```json
{
  "isSuccess": true,
  "isError": false,
  "errors": [],
  "topError": null,
  "value": {
    "totalUsers": 1248,
    "totalStores": 86,
    "platformRevenue": 245800,
    "activeMarketers": 134
  }
}
```