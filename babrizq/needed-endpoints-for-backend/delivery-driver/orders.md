# Delivery Driver — Active Orders

## `GET /api/delivery/orders?status=assigned,picked_up,in_transit`

Returns the driver’s active orders.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `delivery`

### Query Parameters

| Name     | Type   | Notes                                                        |
| -------- | ------ | ------------------------------------------------------------ |
| `status` | string | Comma-separated status filter for active orders              |

### Response `value`

`DeliveryOrder[]`

### Notes

- Orders should be restricted to the authenticated driver.
- Only `assigned`, `picked_up`, and `in_transit` statuses should be returned.