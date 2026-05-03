# Store Owner — Backend Endpoints Reference

This directory documents all API endpoints needed for the **Store Owner** role in the BabRizq SaaS platform.

---

## Table of Contents

| File                          | Domain                          | Endpoints                                                                                                   |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [_shared.md](./_shared.md)    | Auth, Envelope, Primitives      | Auth headers · Response envelope · Pagination shape · Currency list · Order statuses                       |
| [overview.md](./overview.md)  | Dashboard Overview              | `GET /api/store/overview`                                                                                   |
| [products.md](./products.md)  | Product Management              | `GET/POST /api/store/products` · `PUT/DELETE /api/store/products/{id}` · price-history · QR · image upload |
| [categories.md](./categories.md) | Store-Specific Categories   | `GET/POST /api/store/categories` · `PUT/DELETE /api/store/categories/{id}`                                  |
| [orders.md](./orders.md)      | Order Management                | `GET /api/store/orders` · `PUT /api/store/orders/{id}/status` · `GET /api/store/orders/{id}/receipt`        |
| [offers.md](./offers.md)      | Offers & Discounts              | `GET/POST /api/store/offers` · `PUT/DELETE /api/store/offers/{id}` · `PATCH /api/store/offers/{id}/toggle` |
| [sales.md](./sales.md)        | Sales Records & Export          | `GET /api/store/sales` · `GET /api/store/sales/export`                                                      |
| [reports.md](./reports.md)    | Reports & Analytics             | `GET /api/store/reports/sales` · `GET /api/store/reports/products` · `GET /api/store/reports/revenue-by-currency` · `GET /api/store/reports/summary` |
| [accounting.md](./accounting.md) | Accounting & Finance        | `GET /api/store/accounting/summary` · `GET/POST /api/store/accounting/invoices` · `GET/POST /api/store/accounting/expenses` |
| [warehouse.md](./warehouse.md) | Warehouse & Inventory          | Inventory list + adjust · Stock movements · Supplier CRUD                                                   |
| [chat.md](./chat.md)          | Support Chat                    | `GET/POST /api/store/chat/messages` · `PUT /api/store/chat/messages/read` · WebSocket                      |
| [settings.md](./settings.md)  | Store Settings & Account        | `GET/PUT /api/store/settings` · logo/cover upload · `POST /api/store/settings/change-password`             |

---

## Quick Endpoint List

```
# Dashboard
GET    /api/store/overview

# Products
GET    /api/store/products
POST   /api/store/products
PUT    /api/store/products/{id}
DELETE /api/store/products/{id}
GET    /api/store/products/{id}/price-history
GET    /api/store/products/{id}/qr
POST   /api/store/products/{id}/images

# Categories (store-specific)
GET    /api/store/categories
POST   /api/store/categories
PUT    /api/store/categories/{id}
DELETE /api/store/categories/{id}?force=true|false

# Orders
GET    /api/store/orders
PUT    /api/store/orders/{id}/status
GET    /api/store/orders/{id}/receipt

# Offers
GET    /api/store/offers
POST   /api/store/offers
PUT    /api/store/offers/{id}
PATCH  /api/store/offers/{id}/toggle
DELETE /api/store/offers/{id}

# Sales
GET    /api/store/sales
GET    /api/store/sales/export

# Reports
GET    /api/store/reports/sales
GET    /api/store/reports/products
GET    /api/store/reports/revenue-by-currency
GET    /api/store/reports/summary

# Accounting
GET    /api/store/accounting/summary
GET    /api/store/accounting/invoices
POST   /api/store/accounting/invoices
GET    /api/store/accounting/expenses
POST   /api/store/accounting/expenses

# Warehouse
GET    /api/store/warehouse/inventory
PUT    /api/store/warehouse/inventory/{productId}/adjust
GET    /api/store/warehouse/movements
GET    /api/store/warehouse/suppliers
POST   /api/store/warehouse/suppliers
PUT    /api/store/warehouse/suppliers/{id}
DELETE /api/store/warehouse/suppliers/{id}

# Support Chat (REST)
GET    /api/store/chat/messages
POST   /api/store/chat/messages
PUT    /api/store/chat/messages/read

# Support Chat (WebSocket)
WS     /api/store/chat/ws?token={jwt}

# Settings
GET    /api/store/settings
PUT    /api/store/settings
PUT    /api/store/settings/logo       (multipart/form-data)
PUT    /api/store/settings/cover      (multipart/form-data)
POST   /api/store/settings/change-password
```

---

## Authentication

All endpoints require:
- `Authorization: Bearer <jwt_token>` (token role must be `store_owner`)
- `X-Store-Id: {storeId}` (UUID of the authenticated store)

See [_shared.md](./_shared.md) for the full response envelope, pagination shape, and DTO primitive types.
