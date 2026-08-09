/**
 * Back-office overview service — real-time platform dashboard (overview.md).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FullOrderView, toDriverView, toFullOrderView } from './backoffice.mapper';

@Injectable()
export class BackofficeOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /backoffice/overview — KPIs, recent orders, and driver summary. */
  async getOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      ordersToday,
      pendingOrders,
      activeDeliveries,
      completedToday,
      recentOrders,
      drivers,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.count({
        where: { status: { in: ['pending', 'processing'] } },
      }),
      this.prisma.order.count({ where: { status: 'in_transit' } }),
      this.prisma.order.count({
        where: { status: 'delivered', createdAt: { gte: todayStart } },
      }),
      this.prisma.order.findMany({
        include: { items: true, store: { include: { settings: true } }, driver: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.user.findMany({
        where: { role: 'delivery' },
        include: { driverProfile: true },
        orderBy: { nameEn: 'asc' },
      }),
    ]);

    const driverViews = drivers.map((driver) => toDriverView(driver));

    return {
      ordersToday,
      pendingOrders,
      activeDeliveries,
      completedToday,
      recentOrders: recentOrders.map((order) => toFullOrderView(order)),
      driverSummary: {
        available: driverViews.filter((d) => d.available).length,
        busy: driverViews.filter((d) => !d.available).length,
        drivers: driverViews,
      },
    };
  }
}
