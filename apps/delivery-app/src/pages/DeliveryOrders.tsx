/*
 * ─── API: Delivery Driver — Active Orders ───────────────────────────────────
 *
 * GET /api/delivery/orders?status=assigned,picked_up,in_transit
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
import type { FullOrder, FullOrderStatus } from '~/entities/order';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import Pagination from '@/shared/ui/Pagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { MapPin, Store, Phone, ArrowRight, Truck } from 'lucide-react';

/** The mock driver ID for the logged-in delivery user. */
const DRIVER_ID = 'd1';

type StatusFilter = 'all' | 'assigned' | 'picked_up' | 'in_transit';

/* ---------- Order Card ---------- */

interface OrderCardProps {
  order: FullOrder;
}

const OrderCard = memo(function OrderCard({ order }: OrderCardProps) {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
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

      {/* Pickup */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('Pickup from', 'الاستلام من')}</p>
            <p className="text-sm font-medium text-foreground">{t(order.storeNameEn, order.storeNameAr)}</p>
            <p className="text-xs text-muted-foreground">{t(order.storeAddressEn, order.storeAddressAr)}</p>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mt-0.5">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('Deliver to', 'التوصيل إلى')}</p>
            <p className="text-sm font-medium text-foreground">{t(order.customerNameEn, order.customerNameAr)}</p>
            <p className="text-xs text-muted-foreground">{t(order.addressEn, order.addressAr)}</p>
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-1 text-xs text-primary mt-1"
            >
              <Phone className="h-3 w-3" />
              {order.customerPhone}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3">
        <Link
          to={`/delivery/order/${order.id}`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {t('View Details & Actions', 'التفاصيل والإجراءات')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
});

/* ---------- Main Page ---------- */

const ACTIVE_STATUSES: FullOrderStatus[] = ['assigned', 'picked_up', 'in_transit'];

const FILTER_LABELS: Record<StatusFilter, { en: string; ar: string }> = {
  all: { en: 'All', ar: 'الكل' },
  assigned: { en: 'Assigned', ar: 'مُسنَد' },
  picked_up: { en: 'Picked Up', ar: 'تم الاستلام' },
  in_transit: { en: 'In Transit', ar: 'في الطريق' },
};

const DeliveryOrders = () => {
  const { t } = useLocale();
  const { orders } = useOrders();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const myActiveOrders = orders.filter(
    o => o.assignedDriverId === DRIVER_ID && ACTIVE_STATUSES.includes(o.status),
  );

  const filtered =
    filter === 'all' ? myActiveOrders : myActiveOrders.filter(o => o.status === filter);

  const { paged, page, totalPages, totalItems, from, to, pageSize, setPage, setPageSize } =
    usePagination(filtered);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Active Orders', 'الطلبات النشطة')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Orders assigned and awaiting delivery', 'طلبات مُسنَدة وتنتظر التوصيل')}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium border transition-colors ${filter === key
              ? 'gradient-gold text-primary-foreground border-transparent'
              : 'border-border text-muted-foreground hover:bg-accent'
              }`}
          >
            {t(FILTER_LABELS[key].en, FILTER_LABELS[key].ar)}
            <span className="ms-1.5 text-[11px] opacity-70">
              ({key === 'all' ? myActiveOrders.length : myActiveOrders.filter(o => o.status === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {paged.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('No orders in this category', 'لا توجد طلبات في هذه الفئة')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paged.map(order => (
            <OrderCard key={order.id} order={order} />
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

export default DeliveryOrders;









