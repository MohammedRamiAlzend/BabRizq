# Customer — Cart Management

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

The cart is currently managed **client-side** (in React state via `CartContext`). When moving to a real backend, the following REST endpoints should be implemented to persist the cart server-side per authenticated customer.

---

## CartItem Shape

```ts
interface CartItem {
  productId: string;    // UUID
  quantity: number;     // must be ≥ 1
  product: Product;     // resolved product details (read-only in responses)
}
```

---

## GET `/api/customer/cart`

Returns the current customer's cart contents.

### Response `value`

```ts
{
  items: CartItem[];
  totalItems: number;   // sum of all quantities
  totalPrice: number;   // sum of (product.price × quantity) for each item
}
```

---

## POST `/api/customer/cart/items`

Adds a product to the cart. If the product is already in the cart, its quantity is incremented by 1.

### Request DTO

```ts
{
  productId: string;   // required; UUID of the product to add
}
```

### Response `value`

```ts
{
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
```

### Error Cases

| `topError.code`      | HTTP Status | When                                                    |
| -------------------- | ----------- | ------------------------------------------------------- |
| `PRODUCT_NOT_FOUND`  | 404         | Product UUID does not exist                             |
| `OUT_OF_STOCK`       | 409         | Product stock is 0                                      |

---

## PUT `/api/customer/cart/items/{productId}`

Updates the quantity of a specific product in the cart.  
If `quantity` is 0 or less, the item is removed.

### Path Parameter

| Param       | Type     | Description     |
| ----------- | -------- | --------------- |
| `productId` | `string` | Product UUID    |

### Request DTO

```ts
{
  quantity: number;   // required; set to 0 to remove the item
}
```

### Response `value`

```ts
{
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
```

### Error Cases

| `topError.code`          | HTTP Status | When                               |
| ------------------------ | ----------- | ---------------------------------- |
| `ITEM_NOT_IN_CART`       | 404         | Product is not in the cart         |
| `INSUFFICIENT_STOCK`     | 409         | Requested quantity exceeds stock   |

---

## DELETE `/api/customer/cart/items/{productId}`

Removes a product from the cart entirely.

### Path Parameter

| Param       | Type     | Description     |
| ----------- | -------- | --------------- |
| `productId` | `string` | Product UUID    |

### Response `value`

```ts
{
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
```

---

## DELETE `/api/customer/cart`

Clears the entire cart (all items removed). Called automatically after a successful order placement.

### Response `value`

`null`
