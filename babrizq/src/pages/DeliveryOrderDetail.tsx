/*
 * ─── API: Delivery Driver — Order Detail ────────────────────────────────────
 *
 * GET /api/delivery/orders/{id}
 * Headers: Authorization: Bearer <token>  (role must be "delivery")
 * Response value: DeliveryOrder (full shape)
 *
 * PUT /api/delivery/orders/{id}/status
 * DTO: { status: 'picked_up'|'in_transit'|'delivered' }
 * Response value: DeliveryOrder (updated)
 *
 * PUT /api/delivery/orders/{id}/proof
 * DTO: multipart/form-data, field "file" (image)
 * Response value: { proofUrl: string }
 *
 * NOTE: Map section is a visual placeholder.
 * In production, replace with a real mapping SDK:
 *   - Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/
 *   - Google Maps:  https://developers.google.com/maps/documentation/javascript
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { FullOrder, FullOrderStatus } from '~/entities/fulfillmentData';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import ProofOfDeliveryModal from '@/shared/ui/ProofOfDeliveryModal';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  Store,
  PackageCheck,
  Truck,
} from 'lucide-react';

/** The mock driver ID for the logged-in delivery user. */
const DRIVER_ID = 'd1';

/* ---------- Timeline ---------- */

const TIMELINE_STEPS: { status: FullOrderStatus; labelEn: string; labelAr: string }[] = [
  { status: 'assigned', labelEn: 'Assigned', labelAr: 'تم التعيين' },
  { status: 'picked_up', labelEn: 'Picked Up', labelAr: 'تم الاستلام' },
  { status: 'in_transit', labelEn: 'In Transit', labelAr: 'في الطريق' },
  { status: 'delivered', labelEn: 'Delivered', labelAr: 'تم التوصيل' },
];

const TIMELINE_STATUS_ORDER: FullOrderStatus[] = ['assigned', 'picked_up', 'in_transit', 'delivered'];

/* ---------- Next Action ---------- */

function getNextAction(
  status: FullOrderStatus,
): { labelEn: string; labelAr: string; next: FullOrderStatus; icon: React.ElementType } | null {
  switch (status) {
    case 'assigned':
      return { labelEn: 'Mark as Picked Up', labelAr: 'تم الاستلام', next: 'picked_up', icon: PackageCheck };
    case 'picked_up':
      return { labelEn: 'Start Delivery', labelAr: 'بدء التوصيل', next: 'in_transit', icon: Truck };
    case 'in_transit':
      return { labelEn: 'Mark as Delivered', labelAr: 'تم التوصيل', next: 'delivered', icon: CheckCircle2 };
    default:
      return null;
  }
}

/* ---------- Map Placeholder ---------- */

interface MapPlaceholderProps {
  order: FullOrder;
}

const MapPlaceholder = ({ order }: MapPlaceholderProps) => {
  const { t } = useLocale();
  const hasCoords = order.lat !== undefined && order.lng !== undefined;
  const mapsUrl = hasCoords
    ? `https://maps.google.com/?q=${order.lat},${order.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(t(order.addressEn, order.addressAr))}`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t('Delivery Location', 'موقع التوصيل')}</h2>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
        >
          {t('Open in Google Maps', 'فتح في خرائط جوجل')}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/*
        Visual map placeholder — replace this <div> with a real map SDK component in production.
        Expected interface:
          <MapboxMap lat={order.lat} lng={order.lng} zoom={15} />
        or
          <GoogleMap center={{ lat: order.lat, lng: order.lng }} zoom={15} />
      */}
      <div
        className="relative w-full"
        style={{
          height: 220,
          background:
            'repeating-linear-gradient(0deg, hsl(var(--border) / 0.4) 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, hsl(var(--border) / 0.4) 0px, transparent 1px, transparent 40px), hsl(var(--muted) / 0.3)',
        }}
      >
        {/* Mock road lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-muted-foreground rounded" />
          <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-muted-foreground rounded" />
        </div>

        {/* Map label */}
        <div className="absolute top-3 start-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {t('Customer Location', 'موقع الزبون')}
          </p>
        </div>

        {/* Customer pin at center */}
        <div
          className="absolute"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -100%)' }}
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-lg">
            <MapPin className="h-5 w-5 text-white" />
          </span>
          <span className="absolute bottom-full mb-1.5 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover border border-border px-2 py-1 text-[11px] font-medium text-popover-foreground shadow-md">
            {t(order.customerNameEn, order.customerNameAr)}
          </span>
        </div>

        {/* Coords note */}
        {hasCoords ? (
          <div className="absolute bottom-3 end-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border px-2 py-1">
            <p className="text-[10px] text-muted-foreground font-mono">
              {(order.lat ?? 0).toFixed(4)}, {(order.lng ?? 0).toFixed(4)}
            </p>
          </div>
        ) : null}

        {/* Production note */}
        <div className="absolute bottom-3 start-3 rounded-lg bg-card/70 backdrop-blur-sm border border-border px-2 py-1">
          <p className="text-[10px] text-muted-foreground italic">
            {t('* Visual placeholder — integrate a real map SDK', '* نموذج بصري — قم بدمج SDK الخرائط الحقيقية')}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Page ---------- */

const DeliveryOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { orders, updateStatus, setProofOfDelivery } = useOrders();
  const [showProofModal, setShowProofModal] = useState(false);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Package className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">{t('Order not found.', 'الطلب غير موجود.')}</p>
        <button
          onClick={() => navigate('/delivery/orders')}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Back to Orders', 'العودة إلى الطلبات')}
        </button>
      </div>
    );
  }

  const isMyOrder = order.assignedDriverId === DRIVER_ID;
  const isReadOnly = order.status === 'delivered' || !isMyOrder;
  const currentIdx = TIMELINE_STATUS_ORDER.indexOf(order.status);
  const action = isReadOnly ? null : getNextAction(order.status);

  const handleAction = () => {
    if (!action) return;
    if (action.next === 'delivered') {
      setShowProofModal(true);
    } else {
      updateStatus(order.id, action.next);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">
            {t('Order Details', 'تفاصيل الطلب')} — {order.orderNumber}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
        </div>
        <OrderBadge status={order.status} />
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <h2 className="text-sm font-semibold text-foreground mb-5">
          {t('Order Timeline', 'خط سير الطلب')}
        </h2>
        <div className="relative">
          <div className="absolute top-4 start-4 end-4 h-0.5 bg-border" />
          <div className="flex justify-between relative">
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={step.status} className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-border bg-background text-muted-foreground'
                      }`}
                  >
                    {isDone && !isCurrent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-3 w-3 fill-current" />
                    )}
                  </div>
                  <p
                    className={`text-center text-[10px] leading-tight hidden sm:block ${isCurrent
                      ? 'text-primary font-semibold'
                      : isDone
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                      }`}
                  >
                    {t(step.labelEn, step.labelAr)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Map placeholder */}
          <MapPlaceholder order={order} />

          {/* Delivery info */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t('Delivery Info', 'معلومات التوصيل')}</h2>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('Customer', 'الزبون')}</p>
                <p className="text-sm font-medium text-foreground">
                  {t(order.customerNameEn, order.customerNameAr)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(order.addressEn, order.addressAr)}</p>
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
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pickup info */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t('Pickup Info', 'معلومات الاستلام')}</h2>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('Store', 'المتجر')}</p>
                <p className="text-sm font-medium text-foreground">
                  {t(order.storeNameEn, order.storeNameAr)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(order.storeAddressEn, order.storeAddressAr)}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('Ordered Items', 'المنتجات المطلوبة')}</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-foreground">{t(item.nameEn, item.nameAr)}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">×{item.qty}</span>
                    <span className="text-sm font-medium text-foreground">
                      {item.price * item.qty} {t('SAR', 'ر.س')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">{t('Total', 'الإجمالي')}</span>
              <span className="text-sm font-bold text-foreground">
                {order.total} {t('SAR', 'ر.س')}
              </span>
            </div>
          </div>

          {/* Proof of delivery (if completed) */}
          {order.proofOfDelivery ? (
            <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">{t('Proof of Delivery', 'إثبات التوصيل')}</h2>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {order.proofOfDelivery === 'photo_uploaded'
                    ? t('Photo uploaded', 'تم رفع الصورة')
                    : t('Signature captured', 'تم التقاط التوقيع')}
                </p>
              </div>
            </div>
          ) : null}

          {/* Action button */}
          {action ? (
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <action.icon className="h-4 w-4" />
              {t(action.labelEn, action.labelAr)}
            </button>
          ) : null}
        </div>
      </div>

      {/* Proof of Delivery Modal */}
      {showProofModal ? (
        <ProofOfDeliveryModal
          order={order}
          onConfirm={proof => {
            setProofOfDelivery(order.id, proof);
            updateStatus(order.id, 'delivered');
            setShowProofModal(false);
          }}
          onClose={() => setShowProofModal(false)}
        />
      ) : null}
    </div>
  );
};

export default DeliveryOrderDetail;









