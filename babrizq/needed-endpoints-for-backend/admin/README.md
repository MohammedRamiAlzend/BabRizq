# Admin — Backend Endpoints Reference

This directory documents all API endpoints needed for the **Admin** role in the BabRizq SaaS platform.

The admin role (`role: "admin"`) manages platform-wide settings, users, and account/security preferences.

---

## Table of Contents

| File                                 | Domain                           | Endpoints                                                                 |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------- |
| [_shared.md](./_shared.md)           | Auth, Envelope, Core Shapes      | Auth header · Response envelope · Pagination · PlatformUser · Settings   |
| [overview.md](./overview.md)         | Dashboard Overview               | `GET /api/admin/overview`                                                 |
| [users.md](./users.md)               | Users Management                 | `GET/POST /api/admin/users` · `PUT /api/admin/users/{id}/role` · `PUT /api/admin/users/{id}/status` · `DELETE /api/admin/users/{id}` |
| [settings.md](./settings.md)         | Platform Settings                | `GET/PUT /api/admin/settings`                                             |
| [profile.md](./profile.md)           | My Account & Security            | `GET /api/admin/me` · `PUT /api/admin/me` · `POST /api/admin/me/change-password` |

---

## Quick Endpoint List

```
# Dashboard
GET    /api/admin/overview

# Users
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/{id}/role
PUT    /api/admin/users/{id}/status
DELETE /api/admin/users/{id}

# Platform Settings
GET    /api/admin/settings
PUT    /api/admin/settings

# My Account
GET    /api/admin/me
PUT    /api/admin/me
POST   /api/admin/me/change-password
```

---

## Authentication

All admin endpoints require:
- `Authorization: Bearer <jwt_token>` (token role must be `admin`)

See [_shared.md](./_shared.md) for the full response envelope, pagination shape, and DTO primitives.