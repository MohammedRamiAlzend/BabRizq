import { describe, expect, it } from 'vitest';
import { getPlatformStats, platformStats } from './api';

describe('stats API (admin)', () => {
  it('returns the platform KPIs', async () => {
    const stats = await getPlatformStats();
    expect(stats).toEqual(platformStats);
  });

  it('KPIs are positive numbers', async () => {
    const stats = await getPlatformStats();
    expect(stats.totalUsers).toBeGreaterThan(0);
    expect(stats.totalStores).toBeGreaterThan(0);
    expect(stats.platformRevenue).toBeGreaterThan(0);
    expect(stats.activeMarketers).toBeGreaterThan(0);
  });
});
