import { describe, expect, it } from 'vitest';
import { MOCK_DRIVERS, getDrivers } from './api';

describe('driver API (delivery)', () => {
  it('returns the driver roster', async () => {
    const drivers = await getDrivers();
    expect(drivers).toHaveLength(MOCK_DRIVERS.length);
  });

  it('every driver has bilingual names and a phone number', async () => {
    const drivers = await getDrivers();
    for (const driver of drivers) {
      expect(driver.nameEn).toBeTruthy();
      expect(driver.nameAr).toBeTruthy();
      expect(driver.phone).toMatch(/^\+966/);
    }
  });

  it('contains at least one available driver', async () => {
    const drivers = await getDrivers();
    expect(drivers.some(d => d.available)).toBe(true);
  });
});
