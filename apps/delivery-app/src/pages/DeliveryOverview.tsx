/*
 * ─── API: Delivery Driver — Overview ────────────────────────────────────────
 *
 * GET /api/delivery/orders
 * Headers: Authorization: Bearer <token>  (role must be "delivery")
 * Response value: DeliveryOrder[]  (see DeliveryOrders for shape)
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import type { FullOrder } from '~/entities/order';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import { todayDate } from '@/shared/lib/utils';
import { Package, Truck, CheckCircle2, Banknote, ArrowRight } from 'lucide-react';

/** The mock driver ID for the logged-in delivery user. */
const DRIVER_ID = 'd1';

/* ---------- Stat Card ---------- */

interface StatCardProps {
  icon: React.ElementType;
  iconClass: string;
  value: number | string;
  labelEn: string;
  labelAr: string;
}

const StatCard = memo(function StatCard({ icon: Icon, iconClass, value, labelEn, labelAr }: StatCardProps) {
  const { t } = useLocale();
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{t(labelEn, labelAr)}</p>
      </div>
    </div>
  );
});

/* ---------- Active Order Summary Card ---------- */

interface ActiveOrderCardProps {
  order: FullOrder;
}

const ActiveOrderCard = memo(function ActiveOrderCard({ order }: ActiveOrderCardProps) {
  const { t } = useLocale();
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{order.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {order.total} {t('SAR', 'ر.س')}
          </span>
          <OrderBadge status={order.status} />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">{t('Customer', 'الزبون')}</p>
          <p className="text-sm font-medium text-foreground">
            {t(order.customerNameEn, order.customerNameAr)}
          </p>
          <p className="text-xs text-muted-foreground">{t(order.addressEn, order.addressAr)}</p>
        </div>
        <Link
          to={`/delivery/order/${order.id}`}
          className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          {t('Details', 'التفاصيل')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
});

/* ---------- Main Page ---------- */

const DeliveryOverview = () => {
  const { t } = useLocale();
  const { orders } = useOrders();

  const today = todayDate();

  const myOrders = orders.filter(o => o.assignedDriverId === DRIVER_ID);
  const activeOrders = myOrders.filter(o => o.status !== 'delivered');
  const assignedCount = myOrders.filter(o => o.status === 'assigned').length;
  const inTransitCount = myOrders.filter(o => o.status === 'in_transit').length;
  const deliveredToday = myOrders.filter(o => o.status === 'delivered' && o.date === today);
  const totalRevenue = deliveredToday.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Overview', 'نظرة عامة')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("Today's delivery summary", 'ملخص التوصيل اليوم')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          iconClass="text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30"
          value={assignedCount}
          labelEn="Assigned"
          labelAr="مُسنَدة"
        />
        <StatCard
          icon={Truck}
          iconClass="text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30"
          value={inTransitCount}
          labelEn="In Transit"
          labelAr="في الطريق"
        />
        <StatCard
          icon={CheckCircle2}
          iconClass="text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"
          value={deliveredToday.length}
          labelEn="Delivered Today"
          labelAr="مُوصَّلة اليوم"
        />
        <StatCard
          icon={Banknote}
          iconClass="text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"
          value={`${totalRevenue} ${t('SAR', 'ر.س')}`}
          labelEn="Revenue Today"
          labelAr="قيمة اليوم"
        />
      </div>

      {/* Active orders list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">{t('Active Orders', 'الطلبات النشطة')}</h2>
          <Link
            to="/delivery/orders"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {t('View all', 'عرض الكل')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('No active deliveries', 'لا توجد توصيلات نشطة')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map(order => (
              <ActiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOverview;









