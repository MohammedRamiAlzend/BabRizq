# Marketer — Payout & Notification Settings

## `GET /api/marketer/settings`

Returns the marketer's payout and notification preferences.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `marketer`

### Response `value`

```ts
{
  payoutMethod: 'bank' | 'wallet';
  bankIban?: string;
  walletId?: string;
  notifications: {
    newConversion: boolean;
    payoutProcessed: boolean;
    promotions: boolean;
  };
}
```

---

## `PUT /api/marketer/settings`

Updates payout and notification preferences.

### Request DTO

```ts
Partial<{
  payoutMethod: 'bank' | 'wallet';
  bankIban: string;
  walletId: string;
  notifications: {
    newConversion: boolean;
    payoutProcessed: boolean;
    promotions: boolean;
  };
}>
```

### Response `value`

Updated marketer settings object.

### Notes

- If `payoutMethod` is `bank`, `bankIban` should be validated.
- If `payoutMethod` is `wallet`, `walletId` should be validated.