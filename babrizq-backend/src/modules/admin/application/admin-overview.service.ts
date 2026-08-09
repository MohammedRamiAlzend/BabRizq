/**
 * Admin overview service — platform-wide KPIs (`overview.md`).
 *
 * `platformRevenue` is the platform's commission share of delivered orders
 * at the current `commissionRate` (a delivered order only contributes once
 * it is actually completed, so unshipped/pending orders are excluded).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const round2 = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /admin/overview — totalUsers, totalStores, platformRevenue, activeMarketers. */
  async getOverview() {
    const [totalUsers, totalStores, deliveredOrders, activeMarketers, settings] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.store.count(),
        this.prisma.order.findMany({
          where: { status: 'delivered' },
          select: { total: true },
        }),
        this.prisma.user.count({
          where: { role: 'marketer', status: 'active' },
        }),
        this.prisma.platformSetting.findUnique({ where: { id: 1 } }),
      ]);

    const commissionRate = (settings?.commissionRate ?? 5.5) / 100;
    const platformRevenue = round2(
      deliveredOrders.reduce((acc, order) => acc + order.total * commissionRate, 0),
    );

    return { totalUsers, totalStores, platformRevenue, activeMarketers };
  }
}
