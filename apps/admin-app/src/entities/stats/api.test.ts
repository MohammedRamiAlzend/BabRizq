/**
 * Platform-stats API tests (admin) — real backend call through the shared
 * client, with `fetch` stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlatformStats } from './api';

/** Builds the standard backend response envelope. */
const envelope = <T>(value: T) => ({
  isSuccess: true,
  isError: false,
  errors: [],
  topError: null,
  value,
});

/** A fetch Response-like object. */
const okResponse = (value: unknown) =>
  ({ ok: true, status: 200, json: async () => value }) as Response;

describe('stats API (admin) — real backend calls', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET /admin/overview returns the platform KPIs', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        envelope({
          totalUsers: 1248,
          totalStores: 86,
          platformRevenue: 245800,
          activeMarketers: 134,
        })
      )
    );

    const stats = await getPlatformStats();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/overview'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(stats.totalUsers).toBeGreaterThan(0);
    expect(stats.totalStores).toBeGreaterThan(0);
    expect(stats.platformRevenue).toBeGreaterThan(0);
    expect(stats.activeMarketers).toBeGreaterThan(0);
  });
});
