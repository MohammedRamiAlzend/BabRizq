/*
 * ─── API: Back Office — Dashboard Overview ───────────────────────────────────
 *
 * GET /api/backoffice/overview
 * Headers: Authorization: ******  (role must be "back_office")
 * Response value:
 *   {
 *     ordersToday: number; pendingOrders: number;
 *     activeDeliveries: number; completedToday: number;
 *     recentOrders: FullOrder[];
 *     driverSummary: { available: number; busy: number }
 *   }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { Link } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { MOCK_DRIVERS } from '~/entities/driver';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import { ClipboardList, Truck, CheckCircle2, AlertCircle, Users, ChevronRight } from 'lucide-react';
import { todayDate } from '@/shared/lib/utils';

const BackOfficeOverview = () => {
  const { t } = useLocale();
  const { orders } = useOrders();

  const today = todayDate();
  const ordersToday = orders.filter(o => o.date === today);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
  const activeDeliveries = orders.filter(o => o.status === 'in_transit');
  const completedToday = orders.filter(o => o.status === 'delivered' && o.date === today);

  const recentOrders = [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const availableDrivers = MOCK_DRIVERS.filter(d => d.available);
  const busyDrivers = MOCK_DRIVERS.filter(d => !d.available);

  const stats = [
    {
      titleEn: "Today's Orders",
      titleAr: 'طلبات اليوم',
      value: ordersToday.length,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    },
    {
      titleEn: 'Pending / Unassigned',
      titleAr: 'معلّقة / بدون سائق',
      value: pendingOrders.length,
      icon: AlertCircle,
      color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    },
    {
      titleEn: 'Active Deliveries',
      titleAr: 'توصيلات نشطة',
      value: activeDeliveries.length,
      icon: Truck,
      color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30',
    },
    {
      titleEn: 'Completed Today',
      titleAr: 'مكتملة اليوم',
      value: completedToday.length,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Back Office Overview', 'نظرة عامة — المكتب الخلفي')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Monitor orders, drivers, and deliveries in real time.', 'تابع الطلبات والسائقين والتوصيلات في الوقت الفعلي.')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.titleEn} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(stat.titleEn, stat.titleAr)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">{t('Recent Orders', 'آخر الطلبات')}</h2>
            <Link
              to="/back-office/orders"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {t('View all', 'عرض الكل')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-start px-5 py-2.5 text-xs font-medium text-muted-foreground">{t('Order', 'الطلب')}</th>
                  <th className="text-start px-5 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">{t('Customer', 'العميل')}</th>
                  <th className="text-start px-5 py-2.5 text-xs font-medium text-muted-foreground">{t('Total', 'المبلغ')}</th>
                  <th className="text-start px-5 py-2.5 text-xs font-medium text-muted-foreground">{t('Status', 'الحالة')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                      {t(order.customerNameEn, order.customerNameAr)}
                    </td>
                    <td className="px-5 py-3 text-foreground">{order.total} {t('SAR', 'ر.س')}</td>
                    <td className="px-5 py-3"><OrderBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Summary */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">{t('Drivers', 'السائقون')}</h2>
            <Link
              to="/back-office/drivers"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {t('Manage', 'إدارة')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{availableDrivers.length}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{t('Available', 'متاح')}</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-3 text-center">
                <p className="text-xl font-bold text-destructive">{busyDrivers.length}</p>
                <p className="text-xs text-destructive mt-0.5">{t('Busy', 'مشغول')}</p>
              </div>
            </div>

            {/* Driver list */}
            <div className="space-y-2">
              {MOCK_DRIVERS.map(driver => {
                const assignedOrder = orders.find(o => o.assignedDriverId === driver.id && o.status !== 'delivered');
                return (
                  <div key={driver.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {t(driver.nameEn, driver.nameAr).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t(driver.nameEn, driver.nameAr)}</p>
                      {assignedOrder ? (
                        <p className="text-xs text-muted-foreground truncate">{assignedOrder.orderNumber}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('No active order', 'لا يوجد طلب نشط')}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 ${driver.available
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-destructive/10 text-destructive'
                      }`}>
                      {driver.available ? t('Available', 'متاح') : t('Busy', 'مشغول')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackOfficeOverview;









