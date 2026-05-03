# Admin — Users Management

This document covers the endpoints used by the admin users page.

---

## `GET /api/admin/users?page=1&pageSize=10&search=&role=`

Returns a paginated list of platform users.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `admin`

### Query Parameters

| Name       | Type   | Notes                       |
| ---------- | ------ | --------------------------- |
| `page`     | number | 1-based page index          |
| `pageSize` | number | Number of rows per page     |
| `search`   | string | Matches name or email      |
| `role`     | string | Optional role filter       |

### Response `value`

```ts
{
  items: PlatformUser[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## `POST /api/admin/users`

Creates a new platform user.

### Request DTO

```ts
{
  name: string;
  nameAr: string;
  email: string;
  role: 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';
}
```

### Response `value`

`PlatformUser` (newly created)

---

## `PUT /api/admin/users/{id}/role`

Updates the selected user's role.

### Request DTO

```ts
{
  role: 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';
}
```

### Response `value`

`PlatformUser` (updated)

---

## `PUT /api/admin/users/{id}/status`

Updates the selected user's active/suspended state.

### Request DTO

```ts
{
  status: 'active' | 'suspended';
}
```

### Response `value`

`PlatformUser` (updated)

---

## `DELETE /api/admin/users/{id}`

Deletes a platform user.

### Response `value`

`null`

### Notes

- Admin UIs should prevent accidental self-deletion.
- Server-side authorization should still reject unsafe deletes.

---

## Common Failures

| `topError.code`        | HTTP Status | When                                   |
| ---------------------- | ----------- | -------------------------------------- |
| `USER_NOT_FOUND`       | 404         | The target user does not exist         |
| `EMAIL_ALREADY_EXISTS` | 409         | Another user already uses the email    |
| `INVALID_ROLE`         | 422         | Role value is not recognized           |
| `CANNOT_DELETE_SELF`   | 400/403     | Admin tries to delete their own account |