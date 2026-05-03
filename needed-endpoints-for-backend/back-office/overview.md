# Back Office — Dashboard Overview

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and FullOrder shape.

---

## GET `/api/backoffice/overview`

Returns the aggregated real-time dashboard summary for the back-office operator.

### Query Parameters

_None_

### Response `value`

```ts
{
  ordersToday: number;        // total orders with date == today (any status)
  pendingOrders: number;      // orders in 'pending' or 'processing' (need driver assignment)
  activeDeliveries: number;   // orders with status == 'in_transit'
  completedToday: number;     // orders delivered today (status == 'delivered' && date == today)

  recentOrders: FullOrder[];  // last 5 orders across all stores, sorted newest first

  driverSummary: {
    available: number;        // drivers with available == true
    busy: number;             // drivers with available == false
    drivers: Driver[];        // full driver list with current assignment info
  };
}
```

### DTOs

| Field              | Type           | Description                                                  |
| ------------------ | -------------- | ------------------------------------------------------------ |
| `ordersToday`      | `number`       | Count of all orders placed today (any status)                |
| `pendingOrders`    | `number`       | Orders needing a driver (status `pending` or `processing`)   |
| `activeDeliveries` | `number`       | Orders currently en route (`in_transit`)                     |
| `completedToday`   | `number`       | Orders delivered today                                       |
| `recentOrders`     | `FullOrder[]`  | Up to 5 most recent orders across all stores                 |
| `driverSummary`    | object         | Driver availability counts + full driver list                |

> The `Driver` objects inside `driverSummary.drivers` should each include an optional `activeOrderId` field indicating which order (if any) the driver is currently assigned to.
