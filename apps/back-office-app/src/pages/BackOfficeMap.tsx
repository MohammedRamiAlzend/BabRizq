/*
 * ─── Live Map — Driver Tracking ──────────────────────────────────────────────
 *
 * NOTE: This is a visual placeholder for a real map integration.
 * In production, replace the mock canvas below with a real mapping library
 * such as Mapbox GL JS or Google Maps Platform:
 *
 *   - Mapbox:      https://docs.mapbox.com/mapbox-gl-js/
 *   - Google Maps: https://developers.google.com/maps/documentation/javascript
 *
 * Driver coordinates would be pushed in real-time via WebSocket:
 *   ws://api/backoffice/drivers/locations?token=<jwt>
 *   Message shape: { driverId: string; lat: number; lng: number; status: string }
 *
 * Standard envelope (REST polling fallback):
 *   GET /api/backoffice/drivers/locations
 *   { isSuccess, isError, errors, value: DriverLocation[], topError }
 */

import { useState } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { MOCK_DRIVERS } from '~/entities/driver';
import { DRIVER_LOCATIONS, DriverLocation } from '~/entities/map';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import { MapPin, X } from 'lucide-react';

type DriverStatus = DriverLocation['status'];

const STATUS_COLOR: Record<DriverStatus, string> = {
  available: 'bg-emerald-500',
  assigned: 'bg-amber-400',
  in_transit: 'bg-blue-500',
};

const STATUS_LABEL: Record<DriverStatus, { en: string; ar: string }> = {
  available: { en: 'Available', ar: 'متاح' },
  assigned: { en: 'Assigned', ar: 'تم التعيين' },
  in_transit: { en: 'In Transit', ar: 'في الطريق' },
};

const BackOfficeMap = () => {
  const { t } = useLocale();
  const { orders } = useOrders();
  const [selected, setSelected] = useState<string | null>(null);

  const getDriver = (driverId: string) => MOCK_DRIVERS.find(d => d.id === driverId);
  const getActiveOrder = (driverId: string) =>
    orders.find(o => o.assignedDriverId === driverId && o.status !== 'delivered');

  const selectedLoc = DRIVER_LOCATIONS.find(l => l.driverId === selected);
  const selectedDriver = selected ? getDriver(selected) : null;
  const selectedOrder = selected ? getActiveOrder(selected) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Live Driver Map', 'الخريطة المباشرة للسائقين')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Track driver locations in real time.', 'تتبع مواقع السائقين في الوقت الفعلي.')}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {(Object.keys(STATUS_LABEL) as DriverStatus[]).map(s => (
          <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-3 w-3 rounded-full ${STATUS_COLOR[s]}`} />
            {t(STATUS_LABEL[s].en, STATUS_LABEL[s].ar)}
          </div>
        ))}
        <p className="text-xs text-muted-foreground/60 ms-auto italic">
          {t('* Visual placeholder — integrate a real map SDK for production', '* نموذج بصري — قم بدمج SDK الخرائط الحقيقية للإنتاج')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Map canvas */}
        <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
          {/* Mock map surface */}
          <div
            className="relative w-full"
            style={{
              height: 480,
              background:
                'repeating-linear-gradient(0deg, hsl(var(--border) / 0.4) 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, hsl(var(--border) / 0.4) 0px, transparent 1px, transparent 40px), hsl(var(--muted) / 0.3)',
            }}
          >
            {/* Roads */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/3 left-0 right-0 h-2 bg-muted-foreground rounded" />
              <div className="absolute top-2/3 left-0 right-0 h-1.5 bg-muted-foreground rounded" />
              <div className="absolute left-1/4 top-0 bottom-0 w-1.5 bg-muted-foreground rounded" />
              <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-muted-foreground rounded" />
            </div>

            {/* Map label */}
            <div className="absolute top-3 start-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {t('Saudi Arabia — City View', 'المملكة العربية السعودية — عرض المدينة')}
              </p>
            </div>

            {/* Driver pins */}
            {DRIVER_LOCATIONS.map(loc => {
              const driver = getDriver(loc.driverId);
              if (!driver) return null;
              const isSelected = selected === loc.driverId;
              return (
                <button
                  key={loc.driverId}
                  onClick={() => setSelected(isSelected ? null : loc.driverId)}
                  style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: 'translate(-50%, -50%)' }}
                  className="absolute group"
                >
                  {/* Pulse ring */}
                  <span
                    className={`absolute inset-0 rounded-full animate-ping opacity-40 ${STATUS_COLOR[loc.status]}`}
                    style={{ animationDuration: '2s' }}
                  />
                  {/* Pin circle */}
                  <span
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-lg text-white text-xs font-bold transition-transform ${STATUS_COLOR[loc.status]
                      } ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}
                  >
                    {t(driver.nameEn, driver.nameAr).charAt(0)}
                  </span>
                  {/* Name tooltip */}
                  <span className="absolute bottom-full mb-1.5 start-1/2 -translate-x-1/2 hidden group-hover:block rounded-md bg-popover border border-border px-2 py-1 text-[10px] font-medium text-popover-foreground whitespace-nowrap shadow-md">
                    {t(driver.nameEn, driver.nameAr)}
                  </span>
                </button>
              );
            })}

            {/* Selected popup */}
            {selectedLoc && selectedDriver && (
              <div
                style={{
                  left: `${Math.min(selectedLoc.x + 5, 65)}%`,
                  top: `${Math.min(selectedLoc.y - 5, 70)}%`,
                }}
                className="absolute z-10 w-56 rounded-xl border border-border bg-card shadow-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t(selectedDriver.nameEn, selectedDriver.nameAr)}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedDriver.phone}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[selectedLoc.status]}`} />
                  <span className="text-xs text-muted-foreground">
                    {t(STATUS_LABEL[selectedLoc.status].en, STATUS_LABEL[selectedLoc.status].ar)}
                  </span>
                </div>
                {selectedOrder && (
                  <div className="pt-1 border-t border-border space-y-1">
                    <p className="text-xs text-muted-foreground">{t('Current Order:', 'الطلب الحالي:')}</p>
                    <p className="text-xs font-medium text-foreground">{selectedOrder.orderNumber}</p>
                    <OrderBadge status={selectedOrder.status} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-72 shrink-0 rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">{t('All Drivers', 'جميع السائقين')}</h2>
          </div>
          <div className="divide-y divide-border">
            {DRIVER_LOCATIONS.map(loc => {
              const driver = getDriver(loc.driverId);
              if (!driver) return null;
              const activeOrder = getActiveOrder(loc.driverId);
              const isSelected = selected === loc.driverId;
              return (
                <button
                  key={loc.driverId}
                  onClick={() => setSelected(isSelected ? null : loc.driverId)}
                  className={`w-full text-start px-5 py-3 flex items-center gap-3 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                    }`}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {t(driver.nameEn, driver.nameAr).charAt(0)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card ${STATUS_COLOR[loc.status]}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t(driver.nameEn, driver.nameAr)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeOrder ? activeOrder.orderNumber : t('No active order', 'لا يوجد طلب نشط')}
                    </p>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_COLOR[loc.status]}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackOfficeMap;









