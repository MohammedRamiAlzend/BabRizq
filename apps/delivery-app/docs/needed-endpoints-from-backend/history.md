# Delivery Driver — Delivery History

## `GET /api/delivery/orders?status=delivered`

Returns the driver’s completed deliveries.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `delivery`

### Response `value`

`DeliveryOrder[]`

### Notes

- The server should filter by the authenticated driver’s GUID.
- The UI can sort these results newest-first and derive date-based filters locally.