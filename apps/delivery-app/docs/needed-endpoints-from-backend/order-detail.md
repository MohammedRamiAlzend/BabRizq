# Delivery Driver — Order Detail & Actions

This page covers the order detail view and the driver action workflow.

---

## `GET /api/delivery/orders/{id}`

Returns a single delivery order.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `delivery`

### Response `value`

`DeliveryOrder` (full shape)

---

## `PUT /api/delivery/orders/{id}/status`

Updates delivery progress.

### Request DTO

```ts
{
  status: 'picked_up' | 'in_transit' | 'delivered';
}
```

### Response `value`

`DeliveryOrder` (updated)

### Notes

- The driver should only transition forward in the status flow.
- The server should reject requests for orders not assigned to the authenticated driver.

---

## `PUT /api/delivery/orders/{id}/proof`

Uploads proof of delivery.

### Request DTO

- `multipart/form-data`
- Field name: `file` (image)

### Response `value`

```ts
{
  proofUrl: string;
}
```

### Notes

- Typically used when marking an order as delivered.
- The uploaded proof URL should be persisted with the order record.