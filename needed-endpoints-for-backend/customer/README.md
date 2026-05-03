# Customer — Backend Endpoints Reference

This directory documents all API endpoints needed for the **Customer (Storefront)** role in the BabRizq SaaS platform.

The customer role (`role: "customer"`) is for end-users who browse the marketplace, add products to cart, and place orders.

---

## Table of Contents

| File                                      | Domain                                | Endpoints                                                                                   |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| [_shared.md](./_shared.md)                | Auth, Envelope, Core Shapes           | Auth header · Envelope · Product · Store · StoreSpecificCategory · Ad · Platform categories |
| [home.md](./home.md)                      | Storefront Homepage                   | Stores list · Platform categories · Featured products · Recommendations · Platform ads      |
| [products.md](./products.md)              | All-Products Browse & Search          | `GET /api/storefront/products` · `GET /api/storefront/products/{id}`                        |
| [store-catalog.md](./store-catalog.md)    | Single Store Page                     | Store detail · Store products (with store-category filter) · Similar stores · More in category |
| [category-catalog.md](./category-catalog.md) | Single Category Page               | Category detail + products · Tag groups (Browse by Topic) · Related categories · Category stores |
| [cart.md](./cart.md)                      | Cart Management                       | Get cart · Add item · Update quantity · Remove item · Clear cart                            |
| [checkout.md](./checkout.md)              | Order Placement & History             | `POST /api/customer/orders` · `GET /api/customer/orders` · `GET /api/customer/orders/{id}` |
| [recommendations.md](./recommendations.md) | Personalized Recommendations        | `POST /api/customer/interests` · `GET /api/customer/recommendations`                        |
| [ads.md](./ads.md)                        | Promotional Banners                   | Platform ads · Store-specific ads · Category-specific ads                                   |

---

## Quick Endpoint List

```
# Homepage sections
GET    /api/storefront/stores
GET    /api/storefront/categories
GET    /api/storefront/featured
GET    /api/storefront/recommendations
GET    /api/storefront/ads

# Products (all-platform browse)
GET    /api/storefront/products
GET    /api/storefront/products/{id}

# Store catalog
GET    /api/storefront/stores/{storeId}
GET    /api/storefront/stores/{storeId}/products
GET    /api/storefront/stores/{storeId}/similar
GET    /api/storefront/stores/{storeId}/more-in-category
GET    /api/storefront/stores/{storeId}/ads

# Category catalog
GET    /api/storefront/categories/{categoryEn}
GET    /api/storefront/categories/{categoryEn}/stores
GET    /api/storefront/categories/{categoryEn}/ads

# Cart
GET    /api/customer/cart
POST   /api/customer/cart/items
PUT    /api/customer/cart/items/{productId}
DELETE /api/customer/cart/items/{productId}
DELETE /api/customer/cart

# Orders (checkout + history)
POST   /api/customer/orders
GET    /api/customer/orders
GET    /api/customer/orders/{orderId}

# Personalization
POST   /api/customer/interests
GET    /api/customer/recommendations
```

---

## Two API Route Namespaces

| Namespace            | Used for                                                      |
| -------------------- | ------------------------------------------------------------- |
| `/api/storefront/…`  | Read-only catalog data (products, stores, categories, ads). May eventually be accessible without login for SEO. |
| `/api/customer/…`    | Customer-specific state (cart, orders, interests). Always requires authentication. |

---

## Authentication

- All `/api/customer/…` endpoints require: `Authorization: ****** (role `customer`)
- `/api/storefront/…` endpoints require authentication in the current UI (`role: "customer"`), but may be made public in future for SEO/sharing.

See [_shared.md](./_shared.md) for the full response envelope, Product, Store, and Ad shapes.
