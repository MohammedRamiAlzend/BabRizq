# Store Owner — Settings

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## StoreSettings Shape

```ts
interface StoreSettings {
  // Store Info
  storeNameEn: string;
  storeNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logoUrl: string;               // URL of the store logo image
  contactEmail: string;
  phone: string;
  address: string;
  taxRate: number;               // percentage, e.g. 15

  // Payment & Currencies
  acceptedCurrencies: string[];  // ISO 4217 codes, e.g. ["SAR", "USD", "AED"]
  paymentMethods: string[];      // e.g. ["cash", "card", "mada"]

  // Notifications
  notifyNewOrder: boolean;
  notifyLowStock: boolean;
  lowStockThreshold: number;     // units; alert when stock ≤ this value

  // Shipping
  deliveryFee: number;           // in primary currency (SAR)
  freeShippingThreshold: number; // order total above which shipping is free
  estimatedDeliveryDays: number;
}
```

### Supported Payment Method IDs

| ID           | Label (EN)               |
| ------------ | ------------------------ |
| `cash`       | Cash on Delivery         |
| `card`       | Credit / Debit Card      |
| `transfer`   | Bank Transfer            |
| `mada`       | Mada                     |
| `stc`        | STC Pay                  |
| `apple_pay`  | Apple Pay                |

---

## GET `/api/store/settings`

Returns the current settings for the store.

### Response `value`

`StoreSettings`

---

## PUT `/api/store/settings`

Updates store settings. Accepts a **partial** object — only the provided fields are updated.  
This single endpoint covers all settings tabs (Store Info, Payment, Notifications, Shipping).

### Request DTO

```ts
Partial<StoreSettings>
```

### Response `value`

`StoreSettings` (updated, full object).

---

## PUT `/api/store/settings/logo`

Uploads a new store logo.

Content-Type: `multipart/form-data`  
Form field name: `file`

### Response `value`

```ts
{
  url: string;   // public URL of the uploaded logo
}
```

After a successful upload, the client should call `PUT /api/store/settings` with `{ logoUrl: url }` to persist the new URL.

---

## PUT `/api/store/settings/cover`

Uploads a new store cover image.

Content-Type: `multipart/form-data`  
Form field name: `file`

### Response `value`

```ts
{
  url: string;   // public URL of the uploaded cover image
}
```

---

## POST `/api/store/settings/change-password`

Changes the store owner's account password.

### Request DTO

```ts
{
  currentPassword: string;    // required; must match the current password
  newPassword: string;        // required; minimum 8 characters
  confirmPassword: string;    // required; must match newPassword
}
```

### Response `value`

`null`

### Error Cases

| `topError.code`           | HTTP Status | When                                       |
| ------------------------- | ----------- | ------------------------------------------ |
| `WRONG_CURRENT_PASSWORD`  | 401         | `currentPassword` does not match           |
| `PASSWORDS_DO_NOT_MATCH`  | 422         | `newPassword !== confirmPassword`           |
| `PASSWORD_TOO_SHORT`      | 422         | `newPassword` is fewer than 8 characters   |
