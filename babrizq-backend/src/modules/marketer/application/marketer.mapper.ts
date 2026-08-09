/**
 * Marketer mapper — converts Prisma rows into the exact shapes the marketer
 * app's `needed-endpoints-from-backend` docs define (AffiliateLink,
 * AffiliateTarget, marketer settings). Dates are normalized to `YYYY-MM-DD`
 * strings per the shared "date" primitive.
 */
import { AffiliateLink, MarketerSettings, Product, Store } from '@prisma/client';

/** AffiliateLink shape from `_shared.md`. */
export interface AffiliateLinkView {
  id: string;
  url: string;
  targetId: string;
  targetNameEn: string;
  targetNameAr: string;
  type: 'store' | 'product';
  clicks: number;
  conversions: number;
  earned: number;
  createdAt: string; // YYYY-MM-DD
}

/** AffiliateTarget shape from `_shared.md` (link-generator dropdown). */
export interface AffiliateTargetView {
  id: string;
  nameEn: string;
  nameAr: string;
  type: 'store' | 'product';
}

/** Marketer settings shape from `settings.md`. */
export interface MarketerSettingsView {
  payoutMethod: 'bank' | 'wallet';
  bankIban?: string;
  walletId?: string;
  notifications: {
    newConversion: boolean;
    payoutProcessed: boolean;
    promotions: boolean;
  };
}

/** Maps an AffiliateLink row → the documented view (targetId resolved from the nullable FKs). */
export function toAffiliateLinkView(link: AffiliateLink): AffiliateLinkView {
  return {
    id: link.id,
    url: link.url,
    targetId: (link.type === 'store' ? link.storeId : link.productId) ?? '',
    targetNameEn: link.targetNameEn,
    targetNameAr: link.targetNameAr,
    type: link.type as 'store' | 'product',
    clicks: link.clicks,
    conversions: link.conversions,
    earned: link.earned,
    createdAt: link.createdAt.toISOString().slice(0, 10),
  };
}

/** Maps a Store row → an AffiliateTargetView of type `store`. */
export function toStoreTargetView(store: Pick<Store, 'id' | 'nameEn' | 'nameAr'>): AffiliateTargetView {
  return { id: store.id, nameEn: store.nameEn, nameAr: store.nameAr, type: 'store' };
}

/** Maps a Product row → an AffiliateTargetView of type `product`. */
export function toProductTargetView(product: Pick<Product, 'id' | 'nameEn' | 'nameAr'>): AffiliateTargetView {
  return { id: product.id, nameEn: product.nameEn, nameAr: product.nameAr, type: 'product' };
}

/** Maps a MarketerSettings row → the documented settings view. */
export function toMarketerSettingsView(settings: MarketerSettings): MarketerSettingsView {
  return {
    payoutMethod: settings.payoutMethod as 'bank' | 'wallet',
    ...(settings.bankIban ? { bankIban: settings.bankIban } : {}),
    ...(settings.walletId ? { walletId: settings.walletId } : {}),
    notifications: {
      newConversion: settings.notifyNewConversion,
      payoutProcessed: settings.notifyPayoutProcessed,
      promotions: settings.notifyPromotions,
    },
  };
}
