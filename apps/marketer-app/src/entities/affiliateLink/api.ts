/**
 * Affiliate link entity — mock API (marketer).
 *
 * Simulates the marketer endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET/POST /api/marketer/links` · `GET /api/marketer/targets`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { AffiliateLink, AffiliateTarget } from './model';
import { api, ApiError, unwrapList } from '@/shared/lib/api';

/** In-memory affiliate targets. TODO(migration): replaced by `GET /api/marketer/targets`. */
export const AFFILIATE_TARGETS: AffiliateTarget[] = [
  { id: 's1', nameEn: 'TechZone', nameAr: 'تك زون', type: 'store' },
  { id: 's2', nameEn: 'Leather House', nameAr: 'بيت الجلود', type: 'store' },
  { id: 's3', nameEn: 'Time Gallery', nameAr: 'معرض الوقت', type: 'store' },
  { id: 's4', nameEn: 'Scent Palace', nameAr: 'قصر العطور', type: 'store' },
  { id: 'p1', nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة', type: 'product' },
  { id: 'p2', nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', type: 'product' },
  { id: 'p3', nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي', type: 'product' },
  { id: 'p4', nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', type: 'product' },
  { id: 'p5', nameEn: 'Leather Messenger Bag', nameAr: 'حقيبة جلدية كلاسيكية', type: 'product' },
];

/** In-memory affiliate links. TODO(migration): replaced by `GET /api/marketer/links`. */
export const INITIAL_LINKS: AffiliateLink[] = [
  { id: 'al1', url: 'babrizq.com/store/s1?ref=marketer1', targetNameEn: 'TechZone', targetNameAr: 'تك زون', type: 'store', clicks: 1243, conversions: 87, earned: 1305, createdAt: '2026-03-15' },
  { id: 'al2', url: 'babrizq.com/product/p2?ref=marketer1', targetNameEn: 'Gold Wristwatch', targetNameAr: 'ساعة يد ذهبية', type: 'product', clicks: 856, conversions: 34, earned: 782, createdAt: '2026-03-20' },
  { id: 'al3', url: 'babrizq.com/product/p3?ref=marketer1', targetNameEn: 'Arabian Oud Perfume', targetNameAr: 'عطر عود عربي', type: 'product', clicks: 2105, conversions: 156, earned: 1716, createdAt: '2026-03-22' },
  { id: 'al4', url: 'babrizq.com/store/s2?ref=marketer1', targetNameEn: 'Leather House', targetNameAr: 'بيت الجلود', type: 'store', clicks: 432, conversions: 21, earned: 378, createdAt: '2026-04-01' },
  { id: 'al5', url: 'babrizq.com/product/p1?ref=marketer1', targetNameEn: 'Premium Wireless Headphones', targetNameAr: 'سماعات لاسلكية فاخرة', type: 'product', clicks: 678, conversions: 45, earned: 675, createdAt: '2026-04-03' },
];

/** Backend `AffiliateLinkView` shape (marketer `_shared.md`) — DTO boundary. */
interface AffiliateLinkDto {
  id: string;
  url: string;
  targetId: string;
  targetNameEn: string;
  targetNameAr: string;
  type: 'store' | 'product';
  clicks: number;
  conversions: number;
  earned: number;
  createdAt: string;
}

/** Maps the backend view onto the frontend model (drops `targetId`). */
function toAffiliateLink(dto: AffiliateLinkDto): AffiliateLink {
  return {
    id: dto.id,
    url: dto.url,
    targetNameEn: dto.targetNameEn,
    targetNameAr: dto.targetNameAr,
    type: dto.type,
    clicks: dto.clicks,
    conversions: dto.conversions,
    earned: dto.earned,
    createdAt: dto.createdAt,
  };
}

/**
 * Resolves the target id/type from an affiliate URL (`/store/<id>` or
 * `/product/<id>`). The backend `POST /marketer/links/generate` contract is
 * keyed by target, not by URL — see `marketer.dto.ts`.
 */
function extractTargetId(url: string): { targetId: string; targetType: 'store' | 'product' } | null {
  const store = url.match(/(?:\/|^)store\/([^/?#]+)/i);
  if (store) return { targetId: store[1], targetType: 'store' };
  const product = url.match(/(?:\/|^)product\/([^/?#]+)/i);
  if (product) return { targetId: product[1], targetType: 'product' };
  return null;
}

/** GET /marketer/links — the marketer's links with accumulated stats. */
export async function getAffiliateLinks(): Promise<AffiliateLink[]> {
  const data = await api.get<AffiliateLinkDto[] | { items: AffiliateLinkDto[] }>('/marketer/links', {
    page: 1,
    pageSize: 100,
  });
  return unwrapList(data).map(toAffiliateLink);
}

/** GET /marketer/targets — the link-generator dropdown (stores + products). */
export async function getAffiliateTargets(): Promise<AffiliateTarget[]> {
  const data = await api.get<AffiliateTarget[]>('/marketer/targets');
  return unwrapList(data);
}

/** POST /marketer/links/generate — idempotent: reuses an existing link per target. */
export async function createAffiliateLink(
  link: Omit<AffiliateLink, 'id' | 'clicks' | 'conversions' | 'earned' | 'createdAt'>
): Promise<AffiliateLink> {
  const target = extractTargetId(link.url);
  if (!target) {
    throw new ApiError('Cannot resolve the target id from the link URL', 400, 'INVALID_LINK_URL');
  }
  const dto = await api.post<AffiliateLinkDto>('/marketer/links/generate', target);
  return toAffiliateLink(dto);
}
