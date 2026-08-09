/*
 * ─── API: Back Office — Shipment Detail ─────────────────────────────────────
 *
 * GET /api/backoffice/orders/{id}
 * Headers: Authorization: ******  (role must be "back_office")
 * Response value: FullOrder (see BackOfficeOrders for shape)
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { MOCK_DRIVERS } from '~/entities/driver';
import { FullOrderStatus } from '~/entities/order';
import { STORE_PRODUCTS } from '~/entities/product';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Store,
  Package,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  X,
  Circle,
} from 'lucide-react';

/* ---------- Order status timeline ---------- */

const TIMELINE_STEPS: { status: FullOrderStatus; labelEn: string; labelAr: string }[] = [
  { status: 'pending', labelEn: 'Order Received', labelAr: 'استلام الطلب' },
  { status: 'processing', labelEn: 'Processing', labelAr: 'قيد المعالجة' },
  { status: 'assigned', labelEn: 'Driver Assigned', labelAr: 'تعيين سائق' },
  { status: 'picked_up', labelEn: 'Picked Up', labelAr: 'استلام البضاعة' },
  { status: 'in_transit', labelEn: 'In Transit', labelAr: 'في الطريق' },
  { status: 'delivered', labelEn: 'Delivered', labelAr: 'تم التسليم' },
];

const STATUS_ORDER: FullOrderStatus[] = [
  'pending',
  'processing',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
];

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

const BackOfficeShipmentDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { orders, assignDriver } = useOrders();
  const [showAssignModal, setShowAssignModal] = useState(false);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Package className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">{t('Order not found.', 'الطلب غير موجود.')}</p>
        <button
          onClick={() => navigate('/back-office/orders')}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Back to Orders', 'العودة إلى الطلبات')}
        </button>
      </div>
    );
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);

  const assignedDriver = order.assignedDriverId
    ? MOCK_DRIVERS.find(d => d.id === order.assignedDriverId)
    : null;

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/back-office/orders')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('Shipment Details', 'تفاصيل الشحنة')} — {order.orderNumber}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
        </div>
        <div className="ms-auto">
          <OrderBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order timeline */}
          <div className="rounded-xl border border-border bg-card px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-5">
              {t('Order Timeline', 'خط سير الطلب')}
            </h2>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-4 start-4 end-4 h-0.5 bg-border" />
              <div className="flex justify-between relative">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStatusIdx;
                  const isCurrent = idx === currentStatusIdx;
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
                        className={`text-center text-[10px] leading-tight hidden sm:block ${isCurrent ? 'text-primary font-semibold' : isDone ? 'text-foreground' : 'text-muted-foreground'
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

          {/* Customer info */}
          <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t('Customer Information', 'معلومات العميل')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('Customer', 'العميل')}</p>
                  <p className="text-sm font-medium text-foreground">
                    {t(order.customerNameEn, order.customerNameAr)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(order.addressEn, order.addressAr)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('Phone', 'الهاتف')}</p>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Store info */}
          <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t('Store Information', 'معلومات المتجر')}</h2>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                <Store className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{t(order.storeNameEn, order.storeNameAr)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(order.storeAddressEn, order.storeAddressAr)}
                </p>
              </div>
              <Link
                to="/store"
                className="shrink-0 text-xs text-primary hover:underline"
              >
                {t('View Store', 'عرض المتجر')}
              </Link>
            </div>
          </div>

          {/* Items & Stock */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('Ordered Items', 'المنتجات المطلوبة')}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-start px-6 py-2.5 text-xs font-medium text-muted-foreground">{t('Product', 'المنتج')}</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('Qty', 'الكمية')}</th>
                  <th className="text-end px-6 py-2.5 text-xs font-medium text-muted-foreground">{t('Price', 'السعر')}</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('Stock', 'المخزون')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item, idx) => {
                  const product = STORE_PRODUCTS.find(
                    p =>
                      p.nameEn.toLowerCase() === item.nameEn.toLowerCase() ||
                      p.nameAr === item.nameAr,
                  );
                  const stockOk = !product || product.stock >= item.qty;
                  return (
                    <tr key={idx}>
                      <td className="px-6 py-3 text-foreground">{t(item.nameEn, item.nameAr)}</td>
                      <td className="px-4 py-3 text-center text-foreground">×{item.qty}</td>
                      <td className="px-6 py-3 text-end text-foreground font-medium">
                        {item.price * item.qty} {t('SAR', 'ر.س')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {stockOk ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {product ? `${product.stock}` : t('OK', 'متوفر')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {product ? `${product.stock}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={2} className="px-6 py-3 font-semibold text-foreground">
                    {t('Total', 'الإجمالي')}
                  </td>
                  <td className="px-6 py-3 text-end font-bold text-foreground">
                    {order.total} {t('SAR', 'ر.س')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right column — Driver */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">{t('Assigned Driver', 'السائق المعيّن')}</h2>

            {assignedDriver ? (
              <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {t(assignedDriver.nameEn, assignedDriver.nameAr).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t(assignedDriver.nameEn, assignedDriver.nameAr)}
                  </p>
                  <a href={`tel:${assignedDriver.phone}`} className="text-xs text-primary hover:underline">
                    {assignedDriver.phone}
                  </a>
                </div>
                <OrderBadge status={order.status} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <UserPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('No driver assigned yet', 'لم يتم تعيين سائق بعد')}
                </p>
              </div>
            )}

            {(order.status === 'pending' || order.status === 'processing') && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4" />
                {t('Assign Driver', 'تعيين سائق')}
              </button>
            )}
          </div>

          {/* Proof of delivery */}
          {order.proofOfDelivery && (
            <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-2">
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
          )}
        </div>
      </div>

      {showAssignModal && (
        <AssignDriverModal
          orderId={order.id}
          onAssign={driverId => {
            assignDriver(order.id, driverId);
            setShowAssignModal(false);
          }}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

export default BackOfficeShipmentDetail;









