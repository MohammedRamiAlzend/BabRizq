/**
 * Store-overview application service — aggregated dashboard (overview.md).
 *
 * Money is summed from DELIVERED orders (the store-owner contract defines
 * `totalSales` as delivered revenue); `netProfit` subtracts the store's
 * recorded expenses. Monthly bucketing and trend math are done in JS (SQLite
 * has no date-part functions that read cleanly here).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreOrderView, toStoreOrderView } from './store.mapper';
import { resolveOwnedStore } from './store-context';

/** English + Arabic month names, Jan → Dec. */
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const CURRENCY_SYMBOLS: Record<string, string> = { SAR: 'ر.س', USD: '$', AED: 'د.إ', SYP: 'ل.س', EUR: '€', GBP: '£' };

/** Pure helper (unit-testable): buckets delivered orders into 12 monthly slots. */
export function bucketMonthly(
  orders: { createdAt: Date; total: number }[],
  now = new Date(),
): { month: string; monthAr: string; sales: number; orders: number }[] {
  const slots: { month: string; monthAr: string; sales: number; orders: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    slots.push({
      month: MONTHS_EN[date.getMonth()],
      monthAr: MONTHS_AR[date.getMonth()],
      sales: 0,
      orders: 0,
    });
  }
  for (const order of orders) {
    const index = (order.createdAt.getFullYear() - now.getFullYear()) * 12 +
      (order.createdAt.getMonth() - now.getMonth()) + 11;
    if (index >= 0 && index < 12) {
      slots[index].sales = Math.round((slots[index].sales + order.total) * 100) / 100;
      slots[index].orders += 1;
    }
  }
  return slots;
}

/** Pure helper: month-over-month trend percentage for a currency. */
export function trendPercent(current: number, previous: number): string {
  if (previous <= 0) return current > 0 ? '+100%' : '0%';
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

@Injectable()
export class StoreOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/overview — full dashboard payload. */
  async getOverview(ownerUserId: string, storeId: string | undefined) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const settings = await this.prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: { lowStockThreshold: true },
    });
    const lowStockThreshold = settings?.lowStockThreshold ?? 5;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      deliveredAgg,
      totalOrders,
      expensesAgg,
      lowStockCount,
      statusGroups,
      deliveredOrders,
      deliveredItems,
      thisMonthAgg,
      prevMonthAgg,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { storeId: store.id, status: 'delivered' },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { storeId: store.id } }),
      this.prisma.expense.aggregate({
        where: { storeId: store.id },
        _sum: { amount: true },
      }),
      this.prisma.product.count({
        where: { storeId: store.id, stock: { lte: lowStockThreshold } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { storeId: store.id },
        _count: true,
      }),
      // Delivered orders in the last 12 months (for the sales chart).
      this.prisma.order.findMany({
        where: {
          storeId: store.id,
          status: 'delivered',
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
        },
        select: { createdAt: true, total: true },
      }),
      // All delivered order items — aggregated in JS below (one query, no N+1).
      this.prisma.orderItem.findMany({
        where: {
          order: { storeId: store.id, status: 'delivered' },
          productId: { not: null },
        },
        select: { productId: true, qty: true, price: true },
      }),
      this.prisma.order.aggregate({
        where: { storeId: store.id, status: 'delivered', createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          storeId: store.id,
          status: 'delivered',
          createdAt: { gte: prevMonthStart, lt: monthStart },
        },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { storeId: store.id },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Aggregate sold units + revenue per product from the item rows.
    const byProduct = new Map<
      string,
      { sold: number; revenue: number }
    >();
    for (const item of deliveredItems) {
      const id = item.productId!;
      const entry = byProduct.get(id) ?? { sold: 0, revenue: 0 };
      entry.sold += item.qty;
      entry.revenue = Math.round((entry.revenue + item.qty * item.price) * 100) / 100;
      byProduct.set(id, entry);
    }

    const productIds = [...byProduct.keys()];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, nameEn: true, nameAr: true },
        })
      : [];
    const productNames = new Map(products.map((p) => [p.id, p]));

    const totalSales = deliveredAgg._sum.total ?? 0;
    const expenses = expensesAgg._sum.amount ?? 0;

    return {
      totalSales,
      totalOrders,
      netProfit: Math.round((totalSales - expenses) * 100) / 100,
      lowStockCount,
      monthlySales: bucketMonthly(deliveredOrders, now),
      ordersByStatus: statusGroups.map((group) => ({
        status: group.status,
        count: group._count,
      })),
      topProducts: [...byProduct.entries()]
        .map(([productId, entry]) => {
          const product = productNames.get(productId);
          return {
            id: productId,
            nameEn: product?.nameEn ?? 'Deleted product',
            nameAr: product?.nameAr ?? 'منتج محذوف',
            sold: entry.sold,
            revenue: entry.revenue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      revenueByCurrency: [
        {
          currency: 'SAR',
          symbol: CURRENCY_SYMBOLS.SAR,
          amount: totalSales,
          trend: trendPercent(thisMonthAgg._sum.total ?? 0, prevMonthAgg._sum.total ?? 0),
        },
      ],
      recentOrders: recentOrders.map((order) => toStoreOrderView(order)),
    };
  }
}
