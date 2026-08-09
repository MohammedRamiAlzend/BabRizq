/*
 * ─── API: Delivery Driver — Delivery History ────────────────────────────────
 *
 * GET /api/delivery/orders?status=delivered
 * Headers: Authorization: Bearer <token>  (role must be "delivery")
 * Response value: DeliveryOrder[]
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { FullOrder } from '~/entities/fulfillmentData';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import Pagination from '@/shared/ui/Pagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { CheckCircle2, ArrowRight, History } from 'lucide-react';

/** The mock driver ID for the logged-in delivery user. */
const DRIVER_ID = 'd1';

/* ---------- History Row ---------- */

interface HistoryRowProps {
  order: FullOrder;
}

const HistoryRow = memo(function HistoryRow({ order }: HistoryRowProps) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
          <OrderBadge status={order.status} />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {t(order.customerNameEn, order.customerNameAr)} — {t(order.addressEn, order.addressAr)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
      </div>
      <div className="text-end shrink-0">
        <p className="text-sm font-bold text-foreground">
          {order.total} {t('SAR', 'ر.س')}
        </p>
        <Link
          to={`/delivery/order/${order.id}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
        >
          {t('View', 'عرض')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
});

/* ---------- Main Page ---------- */

const DeliveryHistory = () => {
  const { t } = useLocale();
  const { orders } = useOrders();
  const [dateFilter, setDateFilter] = useState('');

  const deliveredOrders = orders.filter(
    o => o.assignedDriverId === DRIVER_ID && o.status === 'delivered',
  );

  const filtered = dateFilter
    ? deliveredOrders.filter(o => o.date === dateFilter)
    : deliveredOrders;

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const { paged, page, totalPages, totalItems, from, to, pageSize, setPage, setPageSize } =
    usePagination(sorted);

  const totalValue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Delivery History', 'سجل التوصيل')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('All your completed deliveries', 'جميع توصيلاتك المكتملة')}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{deliveredOrders.length}</p>
            <p className="text-xs text-muted-foreground">{t('Total Delivered', 'إجمالي المُوصَّلة')}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {totalValue} <span className="text-sm font-normal">{t('SAR', 'ر.س')}</span>
            </p>
            <p className="text-xs text-muted-foreground">{t('Total Revenue', 'إجمالي القيمة')}</p>
          </div>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground shrink-0">{t('Filter by date:', 'تصفية بالتاريخ:')}</label>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {dateFilter ? (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t('Clear', 'إلغاء')}
          </button>
        ) : null}
      </div>

      {/* List */}
      {paged.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {dateFilter
              ? t('No deliveries found for this date', 'لا توجد توصيلات في هذا التاريخ')
              : t('No completed deliveries yet', 'لا توجد توصيلات مكتملة حتى الآن')}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {paged.map(order => (
            <HistoryRow key={order.id} order={order} />
          ))}
        </div>
      )}

      {totalItems > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
};

export default DeliveryHistory;









