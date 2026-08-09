# Back Office — Notifications

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## Notification Shape

```ts
interface BackOfficeNotification {
  id: string;                       // UUID
  type: BackOfficeNotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  timestamp: string;                // ISO 8601 datetime
  isRead: boolean;
  orderId?: string;                 // UUID of related order (when type is 'new_order' or 'driver_update' or 'delivery_confirmed')
}

type BackOfficeNotificationType =
  | "new_order"          // a new order was placed on the platform
  | "driver_update"      // a driver picked up or delivered an order
  | "delivery_confirmed" // an order status changed to 'delivered'
  | "customer_message";  // a customer sent a chat message
```

---

## GET `/api/backoffice/notifications`

Returns a paginated list of notifications for the authenticated back-office operator.

### Query Parameters

| Param      | Type     | Required | Default | Description                                                                                                            |
| ---------- | -------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `page`     | `number` | No       | 1       | Page number                                                                                                            |
| `pageSize` | `number` | No       | 20      | Items per page                                                                                                         |
| `type`     | `string` | No       | —       | Filter by type: `new_order`, `driver_update`, `delivery_confirmed`, `customer_message`. Omit to return all types.      |

### Response `value`

Paginated list (see `_shared.md`), with `items: BackOfficeNotification[]`.  
Items should be ordered newest-first (descending `timestamp`).

---

## PUT `/api/backoffice/notifications/read`

Marks one or more notifications as read.  
The notification badge count in the sidebar is updated client-side after this call succeeds.

### Request DTO

```ts
{
  ids: string[];   // required; array of notification UUIDs to mark as read; must not be empty
}
```

### Response `value`

`null`

### Error Cases

| `topError.code`           | HTTP Status | When                                         |
| ------------------------- | ----------- | -------------------------------------------- |
| `EMPTY_IDS`               | 400         | `ids` array is empty                         |
| `NOTIFICATION_NOT_FOUND`  | 404         | One or more IDs do not exist or do not belong to this operator |

---

## Server-Sent Notifications (Real-Time)

New notifications can be delivered via WebSocket or Server-Sent Events so the badge count updates without polling:

```
ws://<host>/api/backoffice/notifications/ws?token=<jwt_token>
```

### Server → Client Push Event

```ts
{
  type: "new_notification";
  data: BackOfficeNotification;
}
```

The client should prepend the received notification to the local list and increment the unread badge count.

---

## Notification Triggers (Backend Logic)

| Notification type    | Created when                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `new_order`          | A customer places a new order on any store                       |
| `driver_update`      | A driver's status changes (picked up / en route)                 |
| `delivery_confirmed` | An order's status is set to `delivered`                          |
| `customer_message`   | A customer sends a chat message to the back office               |
