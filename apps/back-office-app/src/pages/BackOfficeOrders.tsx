/*
 * ─── API: Back Office — Order Management ────────────────────────────────────
 *
 * GET /api/backoffice/orders?page=1&pageSize=10&search=&status=
 * Headers: Authorization: ******  (role must be "back_office")
 * Paginated response value:
 *   {
 *     items: FullOrder[];
 *     totalItems, page, pageSize, totalPages;
 *   }
 *   FullOrder: {
 *     id: string (GUID); orderNumber: string; date: string (YYYY-MM-DD);
 *     customerNameEn: string; customerNameAr: string;
 *     storeNameEn: string; storeNameAr: string;
 *     total: number; currency: string;
 *     status: 'pending'|'processing'|'assigned'|'picked_up'|'in_transit'|'delivered';
 *     assignedDriverId?: string (GUID);
 *     assignedDriverEn?: string; assignedDriverAr?: string;
 *   }
 *
 * PUT /api/backoffice/orders/{id}/assign-driver
 * DTO: { driverId: string (GUID) }
 * Response value: FullOrder (updated with driver info)
 *
 * GET /api/backoffice/drivers
 * Response value: Driver[]
 *   Driver: { id: string (GUID); nameEn: string; nameAr: string; phone: string; available: boolean }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { MOCK_DRIVERS } from '~/entities/fulfillmentData';
import { STORE_PRODUCTS } from '~/entities/storeOwnerData';
import { FullOrder } from '~/entities/fulfillmentData';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import { UserPlus, X, Search, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

/* ---------- Stock availability helper ---------- */
const checkStockAvailability = (order: FullOrder): boolean => {
  return order.items.every(item => {
    const product = STORE_PRODUCTS.find(
      p =>
        p.nameEn.toLowerCase() === item.nameEn.toLowerCase() ||
        p.nameAr === item.nameAr,
    );
    return !product || product.stock >= item.qty;
  });
};

/* ---------- Assign Driver Modal ---------- */
const AssignDriverModal = ({
  orderId,
  onAssign,
  onClose,
}: {
  orderId: string;
  onAssign: (driverId: string) => void;
  onClose: () => void;
}) => {
  const { t } = useLocale();
  const { orders } = useOrders();
  const [selectedDriver, setSelectedDriver] = useState('');
  const order = orders.find(o => o.id === orderId);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('Assign Driver', 'تعيين سائق')}</h2>
              {order && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.orderNumber} — {t(order.customerNameEn, order.customerNameAr)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('Select Driver', 'اختر السائق')}
            </label>
            <div className="space-y-2">
              {MOCK_DRIVERS.map(driver => (
                <label
                  key={driver.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${selectedDriver === driver.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                    } ${!driver.available ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="radio"
                    name="driver"
                    value={driver.id}
                    checked={selectedDriver === driver.id}
                    onChange={() => setSelectedDriver(driver.id)}
                    className="accent-primary"
                    disabled={!driver.available}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t(driver.nameEn, driver.nameAr)}</p>
                    <p className="text-xs text-muted-foreground">{driver.phone}</p>
                  </div>
                  <span
                    className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${driver.available
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-destructive/10 text-destructive'
                      }`}
                  >
                    {driver.available ? t('Available', 'متاح') : t('Busy', 'مشغول')}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={() => selectedDriver && onAssign(selectedDriver)}
              disabled={!selectedDriver}
              className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {t('Assign Driver', 'تعيين السائق')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------- Main Page ---------- */

const BackOfficeOrders = () => {
  const { t } = useLocale();
  const { orders, assignDriver } = useOrders();
  const navigate = useNavigate();
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(
    () =>
      orders.filter(o => {
        const matchesSearch =
          search === '' ||
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.customerNameEn.toLowerCase().includes(search.toLowerCase()) ||
          o.customerNameAr.includes(search);
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [orders, search, statusFilter],
  );

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } =
    usePagination(filtered);

  const statuses = ['all', 'pending', 'processing', 'assigned', 'picked_up', 'in_transit', 'delivered'];
  const statusLabels: Record<string, { en: string; ar: string }> = {
    all: { en: 'All', ar: 'الكل' },
    pending: { en: 'Pending', ar: 'معلّق' },
    processing: { en: 'Processing', ar: 'قيد المعالجة' },
    assigned: { en: 'Assigned', ar: 'تم التعيين' },
    picked_up: { en: 'Picked Up', ar: 'تم الاستلام' },
    in_transit: { en: 'In Transit', ar: 'في الطريق' },
    delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Order Management', 'إدارة الطلبات')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t(`${orders.length} total orders across all stores`, `${orders.length} طلب عبر جميع المتاجر`)}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search orders...', 'ابحث عن الطلبات...')}
            className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === s
                ? 'gradient-gold text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
            >
              {t(statusLabels[s].en, statusLabels[s].ar)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Order', 'الطلب')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  {t('Customer', 'العميل')}
                </th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {t('Store', 'المتجر')}
                </th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Total', 'المبلغ')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Status', 'الحالة')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  {t('Stock', 'المخزون')}
                </th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  {t('Driver', 'السائق')}
                </th>
                <th className="text-end px-4 py-3 font-medium text-muted-foreground">{t('Actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(order => {
                const stockOk = checkStockAvailability(order);
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {t(order.customerNameEn, order.customerNameAr)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-foreground">
                      {t(order.customerNameEn, order.customerNameAr)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {t(order.storeNameEn, order.storeNameAr)}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {order.total} {t('SAR', 'ر.س')}
                    </td>
                    <td className="px-4 py-3">
                      <OrderBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {stockOk ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t('OK', 'متوفر')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('Low', 'منخفض')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {order.assignedDriverEn ? (
                        <span className="text-foreground">{t(order.assignedDriverEn, order.assignedDriverAr!)}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/back-office/shipments/${order.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                          title={t('View Shipment', 'عرض الشحنة')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t('Details', 'تفاصيل')}</span>
                        </button>
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button
                            onClick={() => setAssignModalOrderId(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t('Assign', 'تعيين')}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    {t('No orders found', 'لم يتم العثور على طلبات')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {assignModalOrderId && (
        <AssignDriverModal
          orderId={assignModalOrderId}
          onAssign={driverId => {
            assignDriver(assignModalOrderId, driverId);
            setAssignModalOrderId(null);
          }}
          onClose={() => setAssignModalOrderId(null)}
        />
      )}
    </div>
  );
};

export default BackOfficeOrders;









