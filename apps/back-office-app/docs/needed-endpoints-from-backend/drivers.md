# Back Office — Driver Management

> See [_shared.md](./_shared.md) for authentication headers, response envelope, and Driver shape.

---

## GET `/api/backoffice/drivers`

Returns the complete list of all delivery drivers registered on the platform.

### Query Parameters

_None_ — the driver list is small enough to return in full without pagination.

### Response `value`

```ts
Driver[]
```

Each `Driver` object may optionally include an `activeOrderId` field:

```ts
interface Driver {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  available: boolean;
  activeOrderId?: string;   // UUID of the order currently assigned, if any
}
```

---

## PATCH `/api/backoffice/drivers/{id}/availability`

Toggles a driver's availability status.  
Used by the Drivers page to mark a driver as available or busy without changing any order assignment.

### Path Parameter

| Param | Type     | Description |
| ----- | -------- | ----------- |
| `id`  | `string` | Driver UUID |

### Request DTO

```ts
{
  available: boolean;   // true = mark available; false = mark busy
}
```

### Response `value`

`Driver` (updated).

### Error Cases

| `topError.code`          | HTTP Status | When                                                      |
| ------------------------ | ----------- | --------------------------------------------------------- |
| `DRIVER_NOT_FOUND`       | 404         | No driver with that UUID                                  |
| `DRIVER_HAS_ACTIVE_ORDER`| 409         | Cannot mark available while driver has an `in_transit` order |

---

## Driver Statistics

The driver list page displays the following quick statistics.  
These can be computed client-side from the `Driver[]` array returned by `GET /api/backoffice/drivers`, or returned pre-computed by the overview endpoint (`GET /api/backoffice/overview`):

| Stat             | Derivation                                      |
| ---------------- | ----------------------------------------------- |
| Total drivers    | `drivers.length`                                |
| Available        | `drivers.filter(d => d.available).length`       |
| Busy             | `drivers.filter(d => !d.available).length`      |
| Active deliveries | Count of `in_transit` orders from orders list  |
