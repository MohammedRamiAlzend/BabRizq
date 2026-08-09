/**
 * Map entity — mock API (back office).
 *
 * Simulates live driver tracking (`GET /api/backoffice/map/drivers` /
 * `GET /api/backoffice/drivers/locations` per
 * `docs/needed-endpoints-from-backend.md`). Seed data is copied verbatim from
 * the legacy monolith.
 */
import { DriverLocation } from './model';

/** In-memory driver positions. TODO(migration): replaced by the live locations endpoint. */
export const DRIVER_LOCATIONS: DriverLocation[] = [
  { driverId: 'd1', x: 30, y: 40, status: 'in_transit' },
  { driverId: 'd2', x: 65, y: 55, status: 'assigned' },
  { driverId: 'd3', x: 50, y: 25, status: 'available' },
  { driverId: 'd4', x: 78, y: 70, status: 'available' },
];

/** Simulates `GET /api/backoffice/map/drivers`. */
export async function getDriverLocations(): Promise<DriverLocation[]> {
  return new Promise(resolve => setTimeout(() => resolve(DRIVER_LOCATIONS), 100));
}
