# Delivery Driver — My Profile & Preferences

The current delivery profile page manages the signed-in driver's local preferences in the UI.

---

## `GET /api/auth/me`

Returns the current signed-in user's identity details.

### Authentication

- `Authorization: Bearer <jwt_token>`

### Response `value`

```ts
{
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: 'delivery';
}
```

---

## `POST /api/auth/logout`

Logs the current user out.

### Request DTO

None.

### Response `value`

`null`

### Notes

- The delivery profile page currently exposes language and theme preferences client-side.
- If profile editing is added later, it should use a dedicated `/api/delivery/me` or `/api/auth/me` update endpoint.