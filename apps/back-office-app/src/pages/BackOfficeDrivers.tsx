/*
 * ─── API: Back Office — Drivers ──────────────────────────────────────────────
 *
 * GET /api/backoffice/drivers
 * Headers: Authorization: ******  (role must be "back_office")
 * Response value: Driver[]
 *   Driver: { id: string (GUID); nameEn: string; nameAr: string; phone: string; available: boolean }
 *
 * PATCH /api/backoffice/drivers/{id}/availability
 * DTO: { available: boolean }
 * Response value: Driver (updated)
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { MOCK_DRIVERS, MockDriver } from '~/entities/driver';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import { Truck, Phone, Package, ToggleLeft, ToggleRight } from 'lucide-react';

const BackOfficeDrivers = () => {
  const { t } = useLocale();
  const { orders } = useOrders();

  // Local copy of drivers so we can toggle availability in the UI
  const [drivers, setDrivers] = useState<MockDriver[]>(MOCK_DRIVERS);

  const toggleAvailability = (id: string) => {
    setDrivers(prev => prev.map(d => (d.id === id ? { ...d, available: !d.available } : d)));
  };

  const availableCount = drivers.filter(d => d.available).length;
  const busyCount = drivers.filter(d => !d.available).length;

  const getDriverOrders = (driverId: string) =>
    orders.filter(o => o.assignedDriverId === driverId && o.status !== 'delivered');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Drivers', 'السائقون')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage driver availability and view active assignments.', 'إدارة توافر السائقين ومتابعة طلباتهم النشطة.')}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{drivers.length}</p>
            <p className="text-xs text-muted-foreground">{t('Total Drivers', 'إجمالي السائقين')}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30">
            <ToggleRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{availableCount}</p>
            <p className="text-xs text-muted-foreground">{t('Available', 'متاح')}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-destructive bg-destructive/10">
            <ToggleLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{busyCount}</p>
            <p className="text-xs text-muted-foreground">{t('Busy', 'مشغول')}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {orders.filter(o => o.status === 'in_transit').length}
            </p>
            <p className="text-xs text-muted-foreground">{t('Active Deliveries', 'توصيلات نشطة')}</p>
          </div>
        </div>
      </div>

      {/* Driver cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {drivers.map(driver => {
          const driverOrders = getDriverOrders(driver.id);
          return (
            <div
              key={driver.id}
              className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Card header */}
              <div
                className={`px-5 py-4 flex items-center gap-3 border-b border-border ${driver.available ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-muted/30'
                  }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {t(driver.nameEn, driver.nameAr).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {t(driver.nameEn, driver.nameAr)}
                  </p>
                  <span
                    className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${driver.available
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-destructive/10 text-destructive'
                      }`}
                  >
                    {driver.available ? t('Available', 'متاح') : t('Busy', 'مشغول')}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-3">
                {/* Phone */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${driver.phone}`} className="hover:text-primary hover:underline">
                    {driver.phone}
                  </a>
                </div>

                {/* Active orders */}
                {driverOrders.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{t('Active Orders:', 'الطلبات النشطة:')}</p>
                    {driverOrders.map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-foreground">{order.orderNumber}</span>
                        <OrderBadge status={order.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('No active orders', 'لا توجد طلبات نشطة')}
                  </p>
                )}

                {/* Toggle availability */}
                <button
                  onClick={() => toggleAvailability(driver.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition-colors ${driver.available
                    ? 'border-destructive/30 text-destructive hover:bg-destructive/5'
                    : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                >
                  {driver.available ? (
                    <>
                      <ToggleLeft className="h-3.5 w-3.5" />
                      {t('Mark as Busy', 'تعيين كمشغول')}
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-3.5 w-3.5" />
                      {t('Mark as Available', 'تعيين كمتاح')}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BackOfficeDrivers;









