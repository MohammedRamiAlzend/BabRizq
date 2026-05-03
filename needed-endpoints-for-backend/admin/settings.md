# Admin — Platform Settings

## `GET /api/admin/settings`

Returns the platform-wide settings used by the admin settings page.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `admin`

### Response `value`

```ts
{
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
  maintenanceMode: boolean;
}
```

---

## `PUT /api/admin/settings`

Updates platform-wide settings.

### Request DTO

```ts
{
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
  maintenanceMode: boolean;
}
```

### Response `value`

Updated platform settings object.

### Notes

- `commissionRate` should be validated server-side to stay between `0` and `100`.
- `supportEmail` should be a valid email address.