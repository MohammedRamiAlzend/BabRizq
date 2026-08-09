# Marketer — Affiliate Dashboard Overview

## `GET /api/marketer/overview`

Returns the headline affiliate metrics shown on the marketer dashboard.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `marketer`

### Response `value`

```ts
{
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  balance: number;           // withdrawable balance
  topLinks: AffiliateLink[]; // top 3 by earnings
}
```

---

## `POST /api/marketer/withdraw`

Submits a withdrawal request for the marketer's available balance.

### Request DTO

```ts
{
  amount: number;
  bankIban?: string;
  walletId?: string;
}
```

### Response `value`

```ts
{
  requestId: string;         // UUID
  status: 'pending';
  estimatedDays: number;
}
```

### Notes

- The server should reject withdrawal amounts larger than the available balance.
- Either `bankIban` or `walletId` may be required depending on payout method rules.