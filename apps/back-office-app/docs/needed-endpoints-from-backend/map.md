# Back Office — Live Driver Map

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

> **Note:** The current UI renders a **visual placeholder** map canvas.  
> In production this page must be integrated with a real mapping SDK such as  
> **Mapbox GL JS** (`https://docs.mapbox.com/mapbox-gl-js/`) or  
> **Google Maps Platform** (`https://developers.google.com/maps/documentation/javascript`).  
> Replace the placeholder `<div>` in `BackOfficeMap.tsx` with the real map component once the SDK is chosen.

---

## REST — Polling Fallback

### GET `/api/backoffice/drivers/locations`

Returns the latest known GPS coordinates and status for every driver.  
Use this endpoint when the WebSocket connection is unavailable (fallback polling, e.g. every 15 s).

#### Query Parameters

_None_

#### Response `value`

```ts
DriverLocation[]
```

```ts
interface DriverLocation {
  driverId: string;       // UUID — matches Driver.id from GET /api/backoffice/drivers
  lat: number;            // WGS-84 latitude
  lng: number;            // WGS-84 longitude
  heading?: number;       // 0–359 degrees (optional, for animated arrow icon)
  speed?: number;         // km/h (optional)
  status: DriverLocationStatus;
  updatedAt: string;      // ISO 8601 timestamp of the last GPS ping
}

type DriverLocationStatus = "available" | "assigned" | "in_transit";
```

---

## Real-Time (WebSocket)

```
ws://<host>/api/backoffice/drivers/locations?token=<jwt_token>
```

The server **pushes** location updates whenever a driver's position changes.  
The client should update the driver's pin on the map in real time.

### Server → Client Push Event

```ts
{
  type: "location_update";
  data: DriverLocation;
}
```

### Additional Server Push Events

| `type`             | When fired                                                  | `data` shape     |
| ------------------ | ----------------------------------------------------------- | ---------------- |
| `location_update`  | Driver moves (GPS ping received)                            | `DriverLocation` |
| `status_change`    | Driver status changes (e.g. `assigned` → `in_transit`)      | `DriverLocation` |
| `driver_offline`   | Driver disconnects or GPS signal lost for > 2 minutes       | `{ driverId: string }` |

No messages are sent from the client over WebSocket — use the REST endpoints for commands (e.g. assign driver, toggle availability).

---

## Map Pin Color Conventions

| Status       | Color   | Hex       |
| ------------ | ------- | --------- |
| `available`  | Green   | `#22c55e` |
| `assigned`   | Amber   | `#f59e0b` |
| `in_transit` | Blue    | `#3b82f6` |
