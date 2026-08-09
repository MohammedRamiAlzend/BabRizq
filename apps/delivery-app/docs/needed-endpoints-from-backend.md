# Delivery Driver — Backend Endpoints Reference

This directory documents all API endpoints needed for the **Delivery Driver** role in the BabRizq SaaS platform.

The delivery role (`role: "delivery"`) is for drivers who manage assigned deliveries, update order progress, and upload proof of delivery.

---

## Table of Contents

| File                                | Domain                         | Endpoints                                                                 |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| [_shared.md](./_shared.md)          | Auth, Envelope, Core Shapes    | Auth header · Response envelope · Delivery order shape · Status flow     |
| [overview.md](./overview.md)        | Dashboard Overview             | `GET /api/delivery/orders`                                               |
| [orders.md](./orders.md)            | Active Orders                  | `GET /api/delivery/orders?status=assigned,picked_up,in_transit`         |
| [order-detail.md](./order-detail.md)| Order Detail & Actions         | `GET /api/delivery/orders/{id}` · `PUT /api/delivery/orders/{id}/status` · `PUT /api/delivery/orders/{id}/proof` |
| [history.md](./history.md)          | Delivery History               | `GET /api/delivery/orders?status=delivered`                              |
| [profile.md](./profile.md)          | My Profile & Preferences       | `GET /api/auth/me` · `POST /api/auth/logout`                             |

---

## Quick Endpoint List

```
# Overview / active delivery data
GET    /api/delivery/orders

# Active orders (filtered)
GET    /api/delivery/orders?status=assigned,picked_up,in_transit

# Order detail
GET    /api/delivery/orders/{id}
PUT    /api/delivery/orders/{id}/status
PUT    /api/delivery/orders/{id}/proof

# History
GET    /api/delivery/orders?status=delivered

# Account
GET    /api/auth/me
POST   /api/auth/logout
```

---

## Authentication

All delivery endpoints require:
- `Authorization: Bearer <jwt_token>` (token role must be `delivery`)

See [_shared.md](./_shared.md) for the full response envelope and delivery order shape.