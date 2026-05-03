# Marketer — Performance Analytics

## `GET /api/marketer/performance?period=weekly|monthly&linkId=`

Returns analytics for the marketer's affiliate activity.

### Authentication

- `Authorization: Bearer <jwt_token>`
- Token role must be `marketer`

### Query Parameters

| Name     | Type   | Notes                                               |
| -------- | ------ | --------------------------------------------------- |
| `period` | string | `weekly` or `monthly`                               |
| `linkId` | string | Optional UUID filter for a specific affiliate link  |

### Response `value`

```ts
{
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarned: number;
  byLink: {
    linkId: string;
    targetNameEn: string;
    targetNameAr: string;
    clicks: number;
    conversions: number;
    earned: number;
  }[];
  timeline: {
    label: string;
    labelAr: string;
    clicks: number;
    conversions: number;
  }[];
}
```

### Notes

- Timeline labels should be aligned to the requested reporting period.
- The server should scope all results to the authenticated marketer.