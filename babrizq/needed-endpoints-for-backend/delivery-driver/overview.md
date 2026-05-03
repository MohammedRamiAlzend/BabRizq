# Delivery Driver — Overview

## `GET /api/delivery/orders`

Returns the driver’s assigned deliveries. The overview page uses this data to compute active counts, delivered today, and revenue.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `delivery`

### Response `value`

`DeliveryOrder[]`

### Notes

- The server should filter orders by the driver's GUID from the token.
- The UI can derive stats client-side from this list.