# Marketer — Backend Endpoints Reference

This directory documents all API endpoints needed for the **Marketer** role in the BabRizq SaaS platform.

The marketer role (`role: "marketer"`) manages affiliate links, tracks performance, and requests withdrawals.

---

## Table of Contents

| File                                | Domain                         | Endpoints                                                                 |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| [_shared.md](./_shared.md)          | Auth, Envelope, Core Shapes    | Auth header · Response envelope · Pagination · AffiliateLink · Target    |
| [overview.md](./overview.md)        | Affiliate Dashboard Overview   | `GET /api/marketer/overview` · `POST /api/marketer/withdraw`             |
| [links.md](./links.md)              | Affiliate Link Management      | `GET /api/marketer/links` · `POST /api/marketer/links/generate` · `DELETE /api/marketer/links/{id}` · `GET /api/marketer/targets` |
| [performance.md](./performance.md)  | Analytics & Performance        | `GET /api/marketer/performance`                                           |
| [settings.md](./settings.md)        | Payout & Notification Settings  | `GET/PUT /api/marketer/settings`                                         |

---

## Quick Endpoint List

```
# Dashboard
GET    /api/marketer/overview
POST   /api/marketer/withdraw

# Affiliate links
GET    /api/marketer/links
POST   /api/marketer/links/generate
DELETE /api/marketer/links/{id}
GET    /api/marketer/targets

# Performance
GET    /api/marketer/performance

# Settings
GET    /api/marketer/settings
PUT    /api/marketer/settings
```

---

## Authentication

All marketer endpoints require:
- `Authorization: Bearer <jwt_token>` (token role must be `marketer`)

See [_shared.md](./_shared.md) for the full response envelope, pagination shape, and DTO primitives.