# Back Office — Shipment Detail

> See [_shared.md](./_shared.md) for authentication headers, response envelope, FullOrder shape, and Driver shape.

The Shipment Detail page is a read-focused view of a single order.  
It reuses `GET /api/backoffice/orders/{id}` (documented in [orders.md](./orders.md)) and `PUT /api/backoffice/orders/{id}/assign-driver`.

No additional dedicated endpoints are required; the page composes the following existing calls:

---

## Endpoints Consumed by the Shipment Detail Page

| Action                        | Endpoint                                             | Notes                                              |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| Load order details            | `GET /api/backoffice/orders/{id}`                    | Returns full `FullOrder` including address & phone |
| Load driver list              | `GET /api/backoffice/drivers`                        | Populates the assign-driver modal                  |
| Assign driver                 | `PUT /api/backoffice/orders/{id}/assign-driver`      | See [orders.md](./orders.md)                       |

---

## Stock Availability Check

The shipment detail page displays whether each ordered item is in stock by comparing `item.qty` against the store's current product stock level.  
This check is performed client-side using data already returned in `FullOrder.items` together with a product-stock endpoint the store-owner side already exposes:

```
GET /api/store/products/{id}   →   { stock: number; ... }
```

Alternatively, the back office overview endpoint may include a `stockWarnings` array in `FullOrder` to avoid per-product fetches:

```ts
// Optional addition to FullOrder
stockWarnings?: {
  itemNameEn: string;
  itemNameAr: string;
  requestedQty: number;
  availableQty: number;   // 0 means out of stock
}[];
```

> **Recommendation:** Include `stockWarnings` directly in `FullOrder` so the back-office operator does not need cross-role API access.

---

## Order Timeline

The Shipment Detail page renders a 6-step status timeline:

| Step | Status       | Label (EN)      | Label (AR)          |
| ---- | ------------ | --------------- | ------------------- |
| 1    | `pending`    | Order Received  | استلام الطلب        |
| 2    | `processing` | Processing      | قيد المعالجة        |
| 3    | `assigned`   | Driver Assigned | تعيين سائق          |
| 4    | `picked_up`  | Picked Up       | استلام البضاعة      |
| 5    | `in_transit` | In Transit      | في الطريق           |
| 6    | `delivered`  | Delivered       | تم التسليم          |

The current step is derived from `FullOrder.status`.  
No additional API call is needed for the timeline.
