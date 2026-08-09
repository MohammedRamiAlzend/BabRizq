/*
 * ─── API: Store Owner — Reports ─────────────────────────────────────────────
 *
 * GET /api/store/reports/sales?period=weekly|monthly
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Response value:
 *   { data: { label: string; labelAr: string; sales: number; orders: number }[] }
 *
 * GET /api/store/reports/products?page=1&pageSize=10
 * Paginated response value:
 *   { items: { id: string (GUID); nameEn: string; nameAr: string; sold: number; revenue: number }[];
 *     totalItems, page, pageSize, totalPages }
 *
 * GET /api/store/reports/revenue-by-currency
 * Response value:
 *   { currencies: { currency: string; symbol: string; amount: number }[] }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { STORE_ORDERS } from '~/entities/order';
import { MONTHLY_SALES_DATA, CURRENCY_REVENUE } from '~/entities/sales';
import { STORE_PRODUCTS } from '~/entities/product';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

type Period = 'weekly' | 'monthly';

const WEEKLY_DATA = [
  { label: 'Mon', labelAr: 'الاثنين', sales: 2400, orders: 14 },
  { label: 'Tue', labelAr: 'الثلاثاء', sales: 3100, orders: 19 },
  { label: 'Wed', labelAr: 'الأربعاء', sales: 1800, orders: 11 },
  { label: 'Thu', labelAr: 'الخميس', sales: 4200, orders: 27 },
  { label: 'Fri', labelAr: 'الجمعة', sales: 5800, orders: 38 },
  { label: 'Sat', labelAr: 'السبت', sales: 4600, orders: 30 },
  { label: 'Sun', labelAr: 'الأحد', sales: 2900, orders: 17 },
];

const TOP_PRODUCTS = [
  { nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', sold: 42, revenue: 37758 },
  { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', sold: 37, revenue: 16983 },
  { nameEn: 'Premium Headphones', nameAr: 'سماعات لاسلكية', sold: 34, revenue: 10166 },
  { nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي', sold: 28, revenue: 6132 },
  { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', sold: 21, revenue: 2709 },
];

const StoreOwnerReports = () => {
  const { t, lang } = useLocale();
  const [period, setPeriod] = useState<Period>('monthly');

  const topProductsPagination = usePagination(TOP_PRODUCTS);

  const chartData = period === 'monthly'
    ? MONTHLY_SALES_DATA.map(d => ({ ...d, label: lang === 'ar' ? d.monthAr : d.month }))
    : WEEKLY_DATA.map(d => ({ ...d, label: lang === 'ar' ? d.labelAr : d.label }));

  const deliveredOrders = STORE_ORDERS.filter(o => o.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0);
  const lowStockCount = STORE_PRODUCTS.filter(p => p.stock <= 5).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Reports & Analytics', 'التقارير والتحليلات')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Track your store performance.', 'تتبع أداء متجرك.')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">{t('Total Revenue (SAR)', 'إجمالي الإيرادات (ر.س)')}</p>
          <p className="text-3xl font-bold text-foreground">{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">{t('Delivered Orders', 'الطلبات المسلّمة')}</p>
          <p className="text-3xl font-bold text-foreground">{deliveredOrders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">{t('Low Stock Products', 'منتجات منخفضة المخزون')}</p>
          <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>{lowStockCount}</p>
        </div>
      </div>

      {/* Sales chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{t('Sales Overview', 'نظرة على المبيعات')}</h2>
          <div className="flex gap-2">
            {(['weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-xl px-3 py-1 text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}>
                {p === 'weekly' ? t('Weekly', 'أسبوعي') : t('Monthly', 'شهري')}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => [`${v.toLocaleString()} ${t('SAR', 'ر.س')}`, t('Sales', 'المبيعات')]}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Orders trend line chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">{t('Orders Trend', 'اتجاه الطلبات')}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={MONTHLY_SALES_DATA.map(d => ({ ...d, label: lang === 'ar' ? d.monthAr : d.month }))} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="orders" name={t('Orders', 'الطلبات')} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top products table */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">{t('Top Selling Products', 'أكثر المنتجات مبيعاً')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Product', 'المنتج')}</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Sold', 'مباع')}</th>
                  <th className="text-end px-4 py-3 font-medium text-muted-foreground">{t('Revenue', 'الإيراد')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topProductsPagination.paged.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-semibold">
                      {(topProductsPagination.page - 1) * topProductsPagination.pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{t(p.nameEn, p.nameAr)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.sold}</td>
                    <td className="px-4 py-3 text-end font-semibold text-foreground">{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <Pagination
              page={topProductsPagination.page}
              totalPages={topProductsPagination.totalPages}
              totalItems={topProductsPagination.totalItems}
              from={topProductsPagination.from}
              to={topProductsPagination.to}
              pageSize={topProductsPagination.pageSize}
              onPageChange={topProductsPagination.setPage}
              onPageSizeChange={topProductsPagination.setPageSize}
            />
          </div>
        </div>

        {/* Currency revenue */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">{t('Revenue by Currency', 'الإيرادات بالعملات')}</h2>
          </div>
          <div className="divide-y divide-border">
            {CURRENCY_REVENUE.map(c => (
              <div key={c.currency} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-primary">{c.symbol}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{c.currency}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 rounded-full px-2.5 py-1">
                  {c.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreOwnerReports;









