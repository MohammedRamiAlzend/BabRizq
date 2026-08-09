/**
 * Marketer application service — affiliate-link use cases.
 *
 * Everything is scoped to the authenticated marketer (`userId`); a marketer
 * can never see or mutate another marketer's links. Balance = total earned
 * across links minus withdrawal amounts that are not rejected (pending,
 * approved, or paid are all reserved).
 *
 * NOTE (performance timeline): the schema tracks *aggregate* clicks per
 * link, not per-day events, so the timeline is a deterministic split of the
 * aggregates across the requested period weighted by how long the marketer
 * has had links. Real per-day attribution arrives with the click-redirect
 * tracking pipeline in the integrations phase.
 */
import { Injectable } from '@nestjs/common';
import { AffiliateLink } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import {
  AffiliateLinkView,
  AffiliateTargetView,
  MarketerSettingsView,
  toAffiliateLinkView,
  toMarketerSettingsView,
  toProductTargetView,
  toStoreTargetView,
} from './marketer.mapper';

/** Public base used when generating shareable tracking URLs. */
const PUBLIC_BASE_URL = 'https://babrizq.app';

/** Weekday labels, Sunday-first (KSA week convention) — EN + AR. */
const WEEKDAY_LABELS: { en: string; ar: string }[] = [
  { en: 'Sun', ar: 'الأحد' },
  { en: 'Mon', ar: 'الاثنين' },
  { en: 'Tue', ar: 'الثلاثاء' },
  { en: 'Wed', ar: 'الأربعاء' },
  { en: 'Thu', ar: 'الخميس' },
  { en: 'Fri', ar: 'الجمعة' },
  { en: 'Sat', ar: 'السبت' },
];

/** Arabic-Indic digits used for monthly week labels. */
const ARABIC_DIGITS = ['١', '٢', '٣', '٤'];

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Sums a numeric field across rows (typed helper for the aggregates below). */
const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);

/** YYYY-MM-DD for the link's `createdAt` (used in the timeline weighting). */
const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

@Injectable()
export class MarketerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** GET /marketer/links — paginated, filterable by type (all|store|product). */
  async listLinks(
    userId: string,
    query: { page: number; pageSize: number; type?: string },
  ) {
    const where = {
      marketerUserId: userId,
      ...(query.type && query.type !== 'all' ? { type: query.type } : {}),
    };
    const [links, totalItems] = await Promise.all([
      this.prisma.affiliateLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.affiliateLink.count({ where }),
    ]);

    return buildPaginated(
      links.map(toAffiliateLinkView),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /** GET /marketer/targets — stores + products for the link-generator dropdown. */
  async listTargets(search?: string): Promise<AffiliateTargetView[]> {
    const match = search
      ? {
          OR: [
            { nameEn: { contains: search } },
            { nameAr: { contains: search } },
          ],
        }
      : {};

    const [stores, products] = await Promise.all([
      this.prisma.store.findMany({
        where: { status: 'active', ...match },
        select: { id: true, nameEn: true, nameAr: true },
        take: 20,
      }),
      this.prisma.product.findMany({
        where: { status: 'active', ...match },
        select: { id: true, nameEn: true, nameAr: true },
        take: 20,
      }),
    ]);

    return [
      ...stores.map(toStoreTargetView),
      ...products.map(toProductTargetView),
    ];
  }

  /**
   * POST /marketer/links/generate — returns the existing link when one for
   * this target already exists (per `links.md`), otherwise creates a new one
   * with zero stats.
   */
  async generateLink(
    userId: string,
    dto: { targetId: string; targetType: 'store' | 'product' },
  ): Promise<AffiliateLinkView> {
    if (dto.targetType === 'store') {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.targetId },
      });
      if (!store) {
        throw ApiError.notFound('TARGET_NOT_FOUND', 'Store not found');
      }
      const existing = await this.prisma.affiliateLink.findFirst({
        where: { marketerUserId: userId, storeId: store.id },
      });
      if (existing) return toAffiliateLinkView(existing);

      const link = await this.prisma.affiliateLink.create({
        data: {
          marketerUserId: userId,
          storeId: store.id,
          url: `${PUBLIC_BASE_URL}/s/${store.id}?ref=${userId}`,
          targetNameEn: store.nameEn,
          targetNameAr: store.nameAr,
          type: 'store',
        },
      });
      return toAffiliateLinkView(link);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.targetId },
    });
    if (!product) {
      throw ApiError.notFound('TARGET_NOT_FOUND', 'Product not found');
    }
    const existing = await this.prisma.affiliateLink.findFirst({
      where: { marketerUserId: userId, productId: product.id },
    });
    if (existing) return toAffiliateLinkView(existing);

    const link = await this.prisma.affiliateLink.create({
      data: {
        marketerUserId: userId,
        productId: product.id,
        url: `${PUBLIC_BASE_URL}/p/${product.id}?ref=${userId}`,
        targetNameEn: product.nameEn,
        targetNameAr: product.nameAr,
        type: 'product',
      },
    });
    return toAffiliateLinkView(link);
  }

  /** DELETE /marketer/links/:id — ownership enforced (only own links). */
  async deleteLink(userId: string, linkId: string): Promise<null> {
    const link = await this.prisma.affiliateLink.findFirst({
      where: { id: linkId, marketerUserId: userId },
    });
    if (!link) {
      throw ApiError.notFound('LINK_NOT_FOUND', 'Affiliate link not found');
    }
    await this.prisma.affiliateLink.delete({ where: { id: linkId } });
    return null;
  }

  /** GET /marketer/overview — headline KPIs + top 3 links by earnings. */
  async overview(userId: string) {
    const [links, withdrawals] = await Promise.all([
      this.prisma.affiliateLink.findMany({ where: { marketerUserId: userId } }),
      this.prisma.withdrawalRequest.findMany({
        where: { marketerUserId: userId },
      }),
    ]);

    const totalClicks = sum(links.map((l) => l.clicks));
    const totalConversions = sum(links.map((l) => l.conversions));
    const totalEarned = round2(sum(links.map((l) => l.earned)));
    // Pending/approved/paid withdrawals are reserved; rejected ones are not.
    const reserved = round2(
      sum(
        withdrawals
          .filter((w) => w.status !== 'rejected')
          .map((w) => w.amount),
      ),
    );

    return {
      totalClicks,
      totalConversions,
      totalEarned,
      balance: round2(Math.max(0, totalEarned - reserved)),
      topLinks: [...links]
        .sort((a, b) => b.earned - a.earned)
        .slice(0, 3)
        .map(toAffiliateLinkView),
    };
  }

  /**
   * POST /marketer/withdraw — requests a payout of part of the balance.
   * The payout destination is validated against the marketer's saved
   * payout method (bank → IBAN required, wallet → wallet id required).
   */
  async withdraw(
    userId: string,
    dto: { amount: number; bankIban?: string; walletId?: string },
  ): Promise<{ requestId: string; status: string; estimatedDays: number }> {
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new ApiError(
        'INVALID_PAYOUT_AMOUNT',
        400,
        'Withdrawal amount must be greater than zero',
      );
    }

    const settings = await this.prisma.marketerSettings.findUnique({
      where: { userId },
    });
    const payoutMethod =
      settings?.payoutMethod ??
      (dto.bankIban ? 'bank' : dto.walletId ? 'wallet' : 'bank');

    if (payoutMethod === 'bank' && !dto.bankIban) {
      throw new ApiError(
        'BANK_IBAN_REQUIRED',
        422,
        'A bank IBAN is required for bank payouts',
      );
    }
    if (payoutMethod === 'wallet' && !dto.walletId) {
      throw new ApiError(
        'WALLET_ID_REQUIRED',
        422,
        'A wallet id is required for wallet payouts',
      );
    }

    if (dto.amount > (await this.getBalance(userId))) {
      throw new ApiError(
        'INSUFFICIENT_BALANCE',
        422,
        'Withdrawal amount exceeds the available balance',
      );
    }

    const request = await this.prisma.withdrawalRequest.create({
      data: {
        marketerUserId: userId,
        amount: round2(dto.amount),
        bankIban: dto.bankIban ?? null,
        walletId: dto.walletId ?? null,
      },
    });

    // Acknowledge the request so the marketer knows the money is moving.
    await this.notifications.create(userId, {
      type: 'payout',
      titleEn: 'Withdrawal requested',
      titleAr: 'طلب سحب',
      bodyEn: `Your withdrawal of ${round2(dto.amount)} SAR is being processed (est. ${request.estimatedDays} days).`,
      bodyAr: `طلب السحب بمبلغ ${round2(dto.amount)} ريال قيد المعالجة (متوقع ${request.estimatedDays} يوم).`,
    });
    return {
      requestId: request.id,
      status: request.status,
      estimatedDays: request.estimatedDays,
    };
  }

  /** GET /marketer/performance — aggregates, per-link breakdown, timeline. */
  async performance(
    userId: string,
    query: { period: 'weekly' | 'monthly'; linkId?: string },
  ) {
    const where = {
      marketerUserId: userId,
      ...(query.linkId ? { id: query.linkId } : {}),
    };
    const links = await this.prisma.affiliateLink.findMany({ where });
    if (query.linkId && links.length === 0) {
      throw ApiError.notFound('LINK_NOT_FOUND', 'Affiliate link not found');
    }

    const totalClicks = sum(links.map((l) => l.clicks));
    const totalConversions = sum(links.map((l) => l.conversions));
    const totalEarned = round2(sum(links.map((l) => l.earned)));

    return {
      totalClicks,
      totalConversions,
      conversionRate:
        totalClicks > 0 ? round2((totalConversions / totalClicks) * 100) : 0,
      totalEarned,
      byLink: links.map((l) => ({
        linkId: l.id,
        targetNameEn: l.targetNameEn,
        targetNameAr: l.targetNameAr,
        clicks: l.clicks,
        conversions: l.conversions,
        earned: l.earned,
      })),
      timeline: this.buildTimeline(links, query.period),
    };
  }

  /** GET /marketer/settings — payout + notification preferences (lazy default). */
  async getSettings(userId: string): Promise<MarketerSettingsView> {
    let settings = await this.prisma.marketerSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      settings = await this.prisma.marketerSettings.create({
        data: { userId },
      });
    }
    return toMarketerSettingsView(settings);
  }

  /** PUT /marketer/settings — partial update with payout-method validation. */
  async updateSettings(
    userId: string,
    dto: {
      payoutMethod?: string;
      bankIban?: string;
      walletId?: string;
      notifications?: {
        newConversion?: boolean;
        payoutProcessed?: boolean;
        promotions?: boolean;
      };
    },
  ): Promise<MarketerSettingsView> {
    const existing = await this.prisma.marketerSettings.findUnique({
      where: { userId },
    });

    // Resolve the effective payout method (provided value, else saved value).
    const payoutMethod = dto.payoutMethod ?? existing?.payoutMethod;
    const bankIban = dto.bankIban ?? existing?.bankIban ?? undefined;
    const walletId = dto.walletId ?? existing?.walletId ?? undefined;

    if (payoutMethod === 'bank' && !bankIban) {
      throw new ApiError(
        'BANK_IBAN_REQUIRED',
        422,
        'A bank IBAN is required when payout method is bank',
      );
    }
    if (payoutMethod === 'wallet' && !walletId) {
      throw new ApiError(
        'WALLET_ID_REQUIRED',
        422,
        'A wallet id is required when payout method is wallet',
      );
    }

    const data = {
      ...(dto.payoutMethod !== undefined ? { payoutMethod: dto.payoutMethod } : {}),
      ...(dto.bankIban !== undefined ? { bankIban: dto.bankIban } : {}),
      ...(dto.walletId !== undefined ? { walletId: dto.walletId } : {}),
      ...(dto.notifications
        ? {
            notifyNewConversion:
              dto.notifications.newConversion ?? existing?.notifyNewConversion,
            notifyPayoutProcessed:
              dto.notifications.payoutProcessed ??
              existing?.notifyPayoutProcessed,
            notifyPromotions:
              dto.notifications.promotions ?? existing?.notifyPromotions,
          }
        : {}),
    };

    const settings = await this.prisma.marketerSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return toMarketerSettingsView(settings);
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /** Withdrawable balance = total earned − reserved (non-rejected) withdrawals. */
  private async getBalance(userId: string): Promise<number> {
    const overview = await this.overview(userId);
    return overview.balance;
  }

  /**
   * Deterministic placeholder timeline (see the header comment). Weekly =
   * last 7 days with weekday labels; monthly = last 4 weeks. Each bucket
   * gets clicks/conversions in proportion to how many bucket days fall
   * after the marketer's first link creation.
   */
  private buildTimeline(
    links: AffiliateLink[],
    period: 'weekly' | 'monthly',
  ): { label: string; labelAr: string; clicks: number; conversions: number }[] {
    const buckets: { start: Date; label: string; labelAr: string }[] =
      period === 'weekly'
        ? Array.from({ length: 7 }, (_, i) => {
            const day = startOfDay(new Date());
            day.setDate(day.getDate() - (6 - i));
            const labels = WEEKDAY_LABELS[day.getDay()];
            return { start: day, label: labels.en, labelAr: labels.ar };
          })
        : Array.from({ length: 4 }, (_, i) => {
            const weekStart = startOfDay(new Date());
            weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
            return {
              start: weekStart,
              label: `W${i + 1}`,
              labelAr: `أسبوع ${ARABIC_DIGITS[i]}`,
            };
          });

    // No links → every bucket is zero.
    if (links.length === 0) {
      return buckets.map((b) => ({ ...b, clicks: 0, conversions: 0 }));
    }

    const earliestDay = startOfDay(
      new Date(Math.min(...links.map((l) => l.createdAt.getTime()))),
    ).getTime();
    const weights = buckets.map((b) => (b.start.getTime() >= earliestDay ? 1 : 0));
    const totalWeight = sum(weights);

    const distribute = (total: number): number[] => {
      if (totalWeight === 0) {
        const out = new Array(buckets.length).fill(0);
        out[out.length - 1] = total;
        return out;
      }
      const out = buckets.map(
        (_, i) => Math.floor((total * weights[i]) / totalWeight),
      );
      // Keep the split exact: give the remainder to the newest bucket.
      out[out.length - 1] += total - sum(out);
      return out;
    };

    const clicks = distribute(sum(links.map((l) => l.clicks)));
    const conversions = distribute(sum(links.map((l) => l.conversions)));
    return buckets.map((b, i) => ({
      label: b.label,
      labelAr: b.labelAr,
      clicks: clicks[i],
      conversions: conversions[i],
    }));
  }
}
