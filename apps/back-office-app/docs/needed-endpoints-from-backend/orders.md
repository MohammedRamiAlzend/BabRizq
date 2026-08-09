# Back Office — Order Management

> See [_shared.md](./_shared.md) for authentication headers, response envelope, FullOrder shape, and order status flow.

---

## GET `/api/backoffice/orders`

Returns a paginated list of **all orders across all stores** on the platform.

### Query Parameters

| Param      | Type     | Required | Default | Description                                                                                    |
| ---------- | -------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `page`     | `number` | No       | 1       | Page number (1-based)                                                                          |
| `pageSize` | `number` | No       | 10      | Items per page                                                                                 |
| `search`   | `string` | No       | —       | Filter by `orderNumber`, customer name (EN or AR), or store name (EN or AR)                    |
| `status`   | `string` | No       | —       | Filter by status: `pending`, `processing`, `assigned`, `picked_up`, `in_transit`, `delivered`. Omit for all. |

### Response `value`

Paginated list (see `_shared.md`), with `items: FullOrder[]`.

---

## GET `/api/backoffice/orders/{id}`

Returns the full detail of a single order by its UUID.  
Used by the Shipment Detail page to load order info, items, customer address, store info, and driver.

### Path Parameter

| Param | Type     | Description |
| ----- | -------- | ----------- |
| `id`  | `string` | Order UUID  |

### Response `value`

`FullOrder` (complete shape including `addressEn`, `addressAr`, `customerPhone`, `storeAddressEn`, `storeAddressAr`, and `proofOfDelivery`).

### Error Cases

| `topError.code`  | HTTP Status | When                   |
| ---------------- | ----------- | ---------------------- |
| `ORDER_NOT_FOUND` | 404        | No order with that UUID |

---

## PUT `/api/backoffice/orders/{id}/assign-driver`

Assigns a driver to an order and advances the order status from `pending`/`processing` → `assigned`.

### Path Parameter

| Param | Type     | Description |
| ----- | -------- | ----------- |
| `id`  | `string` | Order UUID  |

### Request DTO

```ts
{
  driverId: string;   // UUID of the driver to assign; driver must have available == true
}
```

### Response `value`

`FullOrder` (updated — `status` becomes `"assigned"`, `assignedDriverId`, `assignedDriverEn`, and `assignedDriverAr` are populated).

### Side Effects

- The assigned driver's `available` flag is set to `false`.
- A `driver_update` notification is created and pushed to back-office operators.

### Error Cases

| `topError.code`          | HTTP Status | When                                              |
| ------------------------ | ----------- | ------------------------------------------------- |
| `ORDER_NOT_FOUND`        | 404         | No order with that UUID                           |
| `DRIVER_NOT_FOUND`       | 404         | No driver with that UUID                          |
| `DRIVER_NOT_AVAILABLE`   | 409         | Driver's `available` flag is `false`              |
| `INVALID_ORDER_STATUS`   | 422         | Order is not in `pending` or `processing` state   |
