# Back Office — Backend Endpoints Reference

This directory documents all API endpoints needed for the **Back Office** role in the BabRizq SaaS platform.

The back-office role (`role: "back_office"`) covers operators who manage cross-platform order fulfillment: assigning drivers, monitoring deliveries, tracking driver locations in real time, handling customer & store communications, and receiving operational notifications.

---

## Table of Contents

| File                                        | Domain                        | Endpoints                                                                                                     |
| ------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [_shared.md](./_shared.md)                  | Auth, Envelope, Core Shapes   | Auth header · Response envelope · Pagination · FullOrder shape · Driver shape · Order status flow             |
| [overview.md](./overview.md)                | Dashboard Overview            | `GET /api/backoffice/overview`                                                                                |
| [orders.md](./orders.md)                    | Order Management              | `GET /api/backoffice/orders` · `GET /api/backoffice/orders/{id}` · `PUT /api/backoffice/orders/{id}/assign-driver` |
| [shipments.md](./shipments.md)              | Shipment Detail               | Composed from orders + drivers; optional `stockWarnings` field; order timeline reference                      |
| [drivers.md](./drivers.md)                  | Driver Management             | `GET /api/backoffice/drivers` · `PATCH /api/backoffice/drivers/{id}/availability`                             |
| [map.md](./map.md)                          | Live Driver Map               | `GET /api/backoffice/drivers/locations` · WebSocket `ws://…/api/backoffice/drivers/locations`                 |
| [notifications.md](./notifications.md)      | Notifications                 | `GET /api/backoffice/notifications` · `PUT /api/backoffice/notifications/read` · WebSocket                    |
| [chat.md](./chat.md)                        | Multi-Party Chat              | `GET/POST /api/backoffice/chat/conversations/{id}/messages` · `GET /api/backoffice/chat/conversations` · WebSocket |

---

## Quick Endpoint List

```
# Dashboard
GET    /api/backoffice/overview

# Orders
GET    /api/backoffice/orders
GET    /api/backoffice/orders/{id}
PUT    /api/backoffice/orders/{id}/assign-driver

# Drivers
GET    /api/backoffice/drivers
PATCH  /api/backoffice/drivers/{id}/availability

# Live Map (REST polling fallback)
GET    /api/backoffice/drivers/locations

# Live Map (WebSocket — real-time GPS)
WS     /api/backoffice/drivers/locations?token={jwt}

# Notifications
GET    /api/backoffice/notifications
PUT    /api/backoffice/notifications/read

# Notifications (WebSocket — real-time push)
WS     /api/backoffice/notifications/ws?token={jwt}

# Chat
GET    /api/backoffice/chat/conversations
GET    /api/backoffice/chat/conversations/{id}/messages
POST   /api/backoffice/chat/conversations/{id}/messages

# Chat (WebSocket — real-time messages)
WS     /api/backoffice/chat/ws?token={jwt}
```

---

## Authentication

All endpoints require:

```
Authorization: Bearer <jwt_token>
```

The token's role must be `back_office`.  
Requests from other roles must be rejected with **403 Forbidden**.

See [_shared.md](./_shared.md) for the full response envelope, FullOrder shape, Driver shape, and primitive DTO types.

---

## WebSocket Summary

| WebSocket URL                                       | Purpose                                   | Push Event Types                                      |
| --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `/api/backoffice/drivers/locations?token=…`         | Real-time GPS updates for all drivers     | `location_update`, `status_change`, `driver_offline`  |
| `/api/backoffice/notifications/ws?token=…`          | Real-time notification delivery           | `new_notification`                                    |
| `/api/backoffice/chat/ws?token=…`                   | Real-time chat message delivery           | `new_message`, `conversation_updated`                 |

All WebSocket connections authenticate via the `token` query parameter (same JWT as REST headers).
