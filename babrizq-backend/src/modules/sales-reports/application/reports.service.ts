/**
 * Reports service — the store owner's analytics endpoints (`reports.md`).
 *
 * All aggregations run over `delivered` orders (a sale is complete once an
 * order reaches `delivered`), so the sales list and the report KPIs agree.
 */
import { Injectable } from '@nestjs/common';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';

const round2 = (value: number): number => Math.round(value * 100) / 100;

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: 'ر.س',
  USD: '$',
  EUR: '€',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
};

/** Aggregated product performance (reports.md). */
export interface ProductReportItem {
  id: string;
  nameEn: string;
  nameAr: string;
  sold: number;
  revenue: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/reports/sales — weekly (Mon–Sun) or monthly (Jan–Dec) buckets. */
  async salesReport(
    ownerUserId: string,
    storeId: string | undefined,
    period: 'weekly' | 'monthly',
  ): Promise<{ data: { label: string; labelAr: string; sales: number; orders: number }[] }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const now = new Date();
    const { from, to, labels, labelsAr } =
      period === 'monthly'
        ? {
            from: new Date(now.getFullYear(), 0, 1),
            to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
            labels: MONTHS_EN,
            labelsAr: MONTHS_AR,
          }
        : {
            from: this.startOfWeek(now),
            to: new Date(now.getTime() + 6 * 86_400_000),
            labels: WEEKDAYS_EN,
            labelsAr: WEEKDAYS_AR,
          };

    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id, status: 'delivered', orderDate: { gte: from, lte: to } },
      select: { orderDate: true, total: true },
    });

    const size = labels.length;
    const buckets = Array.from({ length: size }, () => ({ sales: 0, orders: 0 }));
    for (const order of orders) {
      const index = period === 'monthly'
        ? order.orderDate.getMonth()
        : (order.orderDate.getDay() + 6) % 7; // Sun=0 → Mon=0
      if (index >= 0 && index < size) {
        buckets[index].sales = round2(buckets[index].sales + order.total);
        buckets[index].orders += 1;
      }
    }

    return {
      data: labels.map((label, index) => ({
        label,
        labelAr: labelsAr[index],
        sales: buckets[index].sales,
        orders: buckets[index].orders,
      })),
    };
  }

  /** GET /store/reports/products — top-selling products by revenue (paginated). */
  async productsReport(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; minSold?: number },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const items = await this.prisma.orderItem.findMany({
      where: { order: { storeId: store.id, status: 'delivered' } },
      select: {
        productId: true,
        nameEn: true,
        nameAr: true,
        qty: true,
        price: true,
      },
    });

    // Aggregate in memory (per-product). Items without a live product link
    // fall back to the snapshot name under their own id.
    const agg = new Map<
      string,
      { nameEn: string; nameAr: string; sold: number; revenue: number }
    >();
    for (const item of items) {
      const key = item.productId ?? itemKey(item.nameEn, item.nameAr);
      const current = agg.get(key) ?? { nameEn: item.nameEn, nameAr: item.nameAr, sold: 0, revenue: 0 };
      current.sold += item.qty;
      current.revenue = round2(current.revenue + item.qty * item.price);
      agg.set(key, current);
    }

    let rows = [...agg.entries()].map(([id, value]): ProductReportItem => ({ id, ...value }));
    rows.sort((a, b) => b.revenue - a.revenue || b.sold - a.sold);
    if (query.minSold !== undefined) {
      rows = rows.filter((row) => row.sold >= (query.minSold ?? 0));
    }

    const totalItems = rows.length;
    const pageRows = rows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    return buildPaginated(pageRows, totalItems, query.page, query.pageSize);
  }

  /** GET /store/reports/revenue-by-currency — totals + month-over-month trend. */
  async revenueByCurrency(
    ownerUserId: string,
    storeId: string | undefined,
  ): Promise<{ currencies: { currency: string; symbol: string; amount: number; trend: string }[] }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const current = await this.revenueByCurrencyInRange(store.id, monthStart, now);
    const previous = await this.revenueByCurrencyInRange(store.id, prevStart, monthStart);

    const currencies = [...new Set([...current.keys(), ...previous.keys()])].map((currency) => {
      const amount = current.get(currency) ?? 0;
      const prev = previous.get(currency) ?? 0;
      const trend =
        prev > 0 ? `${((amount - prev) / prev) * 100 >= 0 ? '+' : ''}${round2(((amount - prev) / prev) * 100).toFixed(1)}%` : '+0.0%';
      return {
        currency,
        symbol: CURRENCY_SYMBOLS[currency] ?? currency,
        amount,
        trend,
      };
    });

    return { currencies };
  }

  /** GET /store/reports/summary — the reports-page KPI cards. */
  async summary(
    ownerUserId: string,
    storeId: string | undefined,
  ): Promise<{ totalRevenue: number; deliveredOrders: number; lowStockCount: number }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const [aggregate, deliveredOrders, settings, lowStockCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: { storeId: store.id, status: 'delivered' },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { storeId: store.id, status: 'delivered' } }),
      this.prisma.storeSettings.findUnique({
        where: { storeId: store.id },
        select: { lowStockThreshold: true },
      }),
      this.prisma.product.count({
        where: { storeId: store.id, stock: { lte: 0 } },
      }),
    ]);

    const threshold = settings?.lowStockThreshold ?? 10;
    const lowStock = await this.prisma.product.count({
      where: { storeId: store.id, stock: { gt: 0, lte: threshold } },
    });

    return {
      totalRevenue: round2(aggregate._sum.total ?? 0),
      deliveredOrders,
      lowStockCount: lowStockCount + lowStock,
    };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private async revenueByCurrencyInRange(
    storeId: string,
    from: Date,
    to: Date,
  ): Promise<Map<string, number>> {
    const orders = await this.prisma.order.findMany({
      where: { storeId, status: 'delivered', orderDate: { gte: from, lte: to } },
      select: { total: true, currency: true },
    });
    const totals = new Map<string, number>();
    for (const order of orders) {
      totals.set(order.currency, round2((totals.get(order.currency) ?? 0) + order.total));
    }
    return totals;
  }

  /** Monday-starting Date for a given date. */
  private startOfWeek(date: Date): Date {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (copy.getDay() + 6) % 7; // Mon = 0
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
}

/** Deterministic fallback key for snapshot-only order items (no product link). */
function itemKey(nameEn: string, nameAr: string): string {
  return `snapshot:${nameEn}:${nameAr}`;
}
