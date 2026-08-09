/**
 * Affiliate-link API tests (marketer) — the entity functions now call the real
 * backend through the shared API client, so `fetch` is stubbed and the tests
 * assert the URL/method/body that would be sent and the envelope unwrapping.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAffiliateLink, getAffiliateLinks, getAffiliateTargets } from './api';

/** Builds the standard backend response envelope. */
const envelope = <T>(value: T) => ({
  isSuccess: true,
  isError: false,
  errors: [],
  topError: null,
  value,
});

/** A fetch Response-like object. */
const okResponse = (value: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => value }) as Response;

describe('affiliateLink API (marketer) — real backend calls', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET /marketer/links maps backend links onto the frontend model', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        envelope([
          {
            id: 'al1',
            url: 'babrizq.com/store/s1?ref=m1',
            targetId: 's1',
            targetNameEn: 'TechZone',
            targetNameAr: 'تك زون',
            type: 'store',
            clicks: 10,
            conversions: 2,
            earned: 50,
            createdAt: '2026-03-15',
          },
        ])
      )
    );

    const links = await getAffiliateLinks();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/marketer/links'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      id: 'al1',
      targetNameEn: 'TechZone',
      clicks: 10,
      conversions: 2,
      earned: 50,
      createdAt: '2026-03-15',
    });
  });

  it('GET /marketer/targets returns both store and product targets', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        envelope([
          { id: 's1', nameEn: 'TechZone', nameAr: 'تك زون', type: 'store' },
          { id: 'p2', nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', type: 'product' },
        ])
      )
    );

    const targets = await getAffiliateTargets();

    expect(targets.some(t => t.type === 'store')).toBe(true);
    expect(targets.some(t => t.type === 'product')).toBe(true);
  });

  it('POST /marketer/links/generate resolves the target from the link URL', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        envelope({
          id: 'al9',
          url: 'babrizq.com/product/p3?ref=m1',
          targetId: 'p3',
          targetNameEn: 'Arabian Oud Perfume',
          targetNameAr: 'عطر عود عربي',
          type: 'product',
          clicks: 0,
          conversions: 0,
          earned: 0,
          createdAt: '2026-04-10',
        }),
        201
      )
    );

    const created = await createAffiliateLink({
      url: 'babrizq.com/product/p3?ref=marketer1',
      targetNameEn: 'Arabian Oud Perfume',
      targetNameAr: 'عطر عود عربي',
      type: 'product',
    });

    expect(created.clicks).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/marketer/links/generate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ targetId: 'p3', targetType: 'product' }),
      })
    );
  });
});
