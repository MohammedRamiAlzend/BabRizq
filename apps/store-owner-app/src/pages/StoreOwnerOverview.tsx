/*
 * ─── API: Store Owner — Dashboard Overview ───────────────────────────────────
 *
 * GET /api/store/overview
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Response value:
 *   {
 *     totalSales: number;
 *     totalOrders: number;
 *     netProfit: number;
 *     lowStockCount: number;
 *     monthlySales: { month: string; monthAr: string; sales: number }[];
 *     ordersByStatus: { status: string; count: number }[];
 *     topProducts: { id: string (GUID); nameEn: string; nameAr: string; sold: number; revenue: number }[];
 *     revenueByCurrency: { currency: string; symbol: string; amount: number }[];
 *     recentOrders: Order[];   // see StoreOwnerOrders for Order shape
 *   }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { STORE_ORDERS } from '~/entities/order';
import { STORE_PRODUCTS } from '~/entities/product';
import { MONTHLY_SALES_DATA, CURRENCY_REVENUE } from '~/entities/sales';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const stats = [
  {
    titleEn: 'Total Sales', titleAr: 'إجمالي المبيعات',
    value: '24,580', suffix: { en: 'SAR', ar: 'ر.س' },
    changeEn: '+12.5% this month', changeAr: '+12.5% هذا الشهر',
    icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
  },
  {
    titleEn: 'Total Orders', titleAr: 'إجمالي الطلبات',
    value: '156', suffix: { en: 'orders', ar: 'طلب' },
    changeEn: '+8 today', changeAr: '+8 اليوم',
    icon: ShoppingCart, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  },
  {
    titleEn: 'Net Profit', titleAr: 'صافي الربح',
    value: '8,230', suffix: { en: 'SAR', ar: 'ر.س' },
    changeEn: '+5.2% this month', changeAr: '+5.2% هذا الشهر',
    icon: TrendingUp, color: 'text-primary bg-primary/10',
  },
  {
    titleEn: 'Low Stock Alerts', titleAr: 'تنبيهات المخزون',
    value: String(STORE_PRODUCTS.filter(p => p.stock <= 5).length),
    suffix: { en: 'products', ar: 'منتج' },
    changeEn: 'Needs attention', changeAr: 'يحتاج انتباه',
    icon: AlertTriangle, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  },
];

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981'];

const TOP_PRODUCTS = [
  { nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', sold: 42, revenue: 37758 },
  { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', sold: 37, revenue: 16983 },
  { nameEn: 'Premium Headphones', nameAr: 'سماعات لاسلكية', sold: 34, revenue: 10166 },
  { nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي', sold: 28, revenue: 6132 },
  { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', sold: 21, revenue: 2709 },
];

const StoreOwnerOverview = () => {
  const { t, lang } = useLocale();

  const pendingOrders = STORE_ORDERS.filter(o => o.status === 'pending' || o.status === 'processing');
  const deliveredOrders = STORE_ORDERS.filter(o => o.status === 'delivered');

  const orderStatusData = [
    { name: t('Pending', 'معلّق'), value: STORE_ORDERS.filter(o => o.status === 'pending').length },
    { name: t('Processing', 'قيد المعالجة'), value: STORE_ORDERS.filter(o => o.status === 'processing').length },
    { name: t('Shipped', 'تم الشحن'), value: STORE_ORDERS.filter(o => o.status === 'shipped').length },
    { name: t('Delivered', 'تم التوصيل'), value: STORE_ORDERS.filter(o => o.status === 'delivered').length },
  ].filter(d => d.value > 0);

  const chartData = MONTHLY_SALES_DATA.map(d => ({
    ...d,
    label: lang === 'ar' ? d.monthAr : d.month,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Dashboard', 'لوحة التحكم')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("Welcome back! Here's your store summary.", 'مرحباً! إليك ملخص متجرك.')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{t(stat.titleEn, stat.titleAr)}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stat.value} <span className="text-sm font-normal text-muted-foreground">{t(stat.suffix.en, stat.suffix.ar)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t(stat.changeEn, stat.changeAr)}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly sales bar chart */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">{t('Monthly Sales', 'المبيعات الشهرية')}</h2>
          <ResponsiveContainer width="100%" height={220}>
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

        {/* Orders pie chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">{t('Orders by Status', 'توزيع الطلبات')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {orderStatusData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">{t('Top Products', 'أكثر المنتجات مبيعاً')}</h2>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t(p.nameEn, p.nameAr)}</p>
                  <p className="text-xs text-muted-foreground">{p.sold} {t('units sold', 'وحدة مباعة')}</p>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0">{p.revenue.toLocaleString()} <span className="text-muted-foreground font-normal text-xs">{t('SAR', 'ر.س')}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Currency revenue */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">{t('Revenue by Currency', 'الإيرادات بالعملات')}</h2>
          </div>
          <div className="divide-y divide-border">
            {CURRENCY_REVENUE.map(c => (
              <div key={c.currency} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{c.symbol}</span>
                  <span className="text-sm text-muted-foreground">{c.currency}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {/* Quick stats */}
          <div className="px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {pendingOrders.length} {t('orders pending · ', 'طلب معلّق · ')}
              {deliveredOrders.length} {t('delivered', 'تم تسليمها')}
            </p>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t('Recent Orders', 'الطلبات الأخيرة')}</h2>
          <span className="text-xs text-muted-foreground">{pendingOrders.length} {t('pending', 'معلّق')}</span>
        </div>
        <div className="divide-y divide-border">
          {STORE_ORDERS.slice(0, 4).map(order => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground truncate">{t(order.customerNameEn, order.customerNameAr)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{order.total} {t('SAR', 'ر.س')}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const OrderStatusBadge = ({ status }: { status: string }) => {
  const { t } = useLocale();
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  const labels: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Pending', ar: 'معلّق' },
    processing: { en: 'Processing', ar: 'قيد المعالجة' },
    shipped: { en: 'Shipped', ar: 'تم الشحن' },
    delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${styles[status] || ''}`}>
      {t(labels[status]?.en || status, labels[status]?.ar || status)}
    </span>
  );
};

export default StoreOwnerOverview;









