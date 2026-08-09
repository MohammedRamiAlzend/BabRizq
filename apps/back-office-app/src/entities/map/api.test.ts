import { describe, expect, it } from 'vitest';
import { DRIVER_LOCATIONS, getDriverLocations } from './api';

describe('map API (back office)', () => {
  it('returns live driver positions', async () => {
    const locations = await getDriverLocations();
    expect(locations).toHaveLength(DRIVER_LOCATIONS.length);
  });

  it('every driver position has valid coordinates and a status', async () => {
    const locations = await getDriverLocations();
    for (const location of locations) {
      expect(location.x).toBeGreaterThanOrEqual(0);
      expect(location.x).toBeLessThanOrEqual(100);
      expect(location.y).toBeGreaterThanOrEqual(0);
      expect(location.y).toBeLessThanOrEqual(100);
      expect(['available', 'assigned', 'in_transit']).toContain(location.status);
    }
  });
});
