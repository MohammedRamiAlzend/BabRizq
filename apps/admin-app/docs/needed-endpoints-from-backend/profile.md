# Admin — My Account & Security

This document covers the endpoints used by the admin profile page.

---

## `GET /api/admin/me`

Returns the current admin's account details.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `admin`

### Response `value`

```ts
{
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: 'admin';
  joinedDate: string;
}
```

---

## `PUT /api/admin/me`

Updates editable admin profile fields.

### Request DTO

```ts
{
  name?: string;
  nameAr?: string;
  email?: string;
}
```

### Response `value`

Updated admin profile object.

---

## `POST /api/admin/me/change-password`

Changes the current admin password.

### Request DTO

```ts
{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

### Response `value`

`null`

### Error Cases

| `topError.code`           | HTTP Status | When                                     |
| ------------------------- | ----------- | ---------------------------------------- |
| `WRONG_CURRENT_PASSWORD`  | 401         | `currentPassword` does not match         |
| `PASSWORDS_DO_NOT_MATCH`  | 422         | `newPassword !== confirmPassword`        |
| `PASSWORD_TOO_SHORT`      | 422         | `newPassword` is fewer than 8 characters |