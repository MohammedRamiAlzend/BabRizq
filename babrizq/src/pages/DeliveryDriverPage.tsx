/*
 * ─── DeliveryDriverPage ──────────────────────────────────────────────────────
 *
 * This page is preserved for reference but is no longer used in routing.
 * The delivery portal has been replaced by a full nested-route layout:
 *
 *   /delivery           → DeliveryLayout > DeliveryOverview
 *   /delivery/orders    → DeliveryLayout > DeliveryOrders
 *   /delivery/order/:id → DeliveryLayout > DeliveryOrderDetail
 *   /delivery/history   → DeliveryLayout > DeliveryHistory
 *   /delivery/profile   → DeliveryLayout > DeliveryProfile
 *
 * API: Delivery Driver — My Deliveries
 *
 * GET /api/delivery/orders
 * Headers: Authorization: Bearer <token>  (role must be "delivery")
 *   The driver's GUID (nameidentifier from JWT) is used server-side to filter orders.
 * Response value: DeliveryOrder[]
 *   DeliveryOrder: {
 *     id: string (GUID); orderNumber: string;
 *     customerNameEn: string; customerNameAr: string;
 *     customerAddress: string; customerPhone: string;
 *     storeNameEn: string; storeNameAr: string; storeAddress: string;
 *     items: { nameEn: string; nameAr: string; qty: number }[];
 *     total: number;
 *     status: 'assigned'|'picked_up'|'in_transit'|'delivered';
 *     proofOfDelivery?: string;   // URL to uploaded proof image
 *   }
 *
 * PUT /api/delivery/orders/{id}/status
 * DTO: { status: 'picked_up'|'in_transit'|'delivered' }
 * Response value: DeliveryOrder (updated)
 *
 * PUT /api/delivery/orders/{id}/proof
 * DTO: multipart/form-data, field "file" (image)
 * Response value: { proofUrl: string }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useOrders } from '@/features/orders/model/ordersContext';
import { FullOrder, FullOrderStatus } from '~/entities/fulfillmentData';
import { OrderBadge } from '@/shared/ui/OrderBadge';
import ProofOfDeliveryModal from '@/shared/ui/ProofOfDeliveryModal';
import AppHeader from '@/shared/ui/AppHeader';
import { MapPin, Store, Phone, PackageCheck, Truck, CheckCircle2 } from 'lucide-react';

const DRIVER_ID = 'd1'; // mock — pretend logged-in driver is Yusuf

const DeliveryDriverPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLocale();
  const { orders, updateStatus, setProofOfDelivery } = useOrders();
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<FullOrder | null>(null);

  if (!isAuthenticated || !user || user.role !== 'delivery') return <Navigate to="/" replace />;

  const myOrders = orders.filter(o => o.assignedDriverId === DRIVER_ID && o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.assignedDriverId === DRIVER_ID && o.status === 'delivered');

  const getNextAction = (status: FullOrderStatus): { label: { en: string; ar: string }; next: FullOrderStatus; icon: typeof PackageCheck } | null => {
    switch (status) {
      case 'assigned': return { label: { en: 'Mark as Picked Up', ar: 'تم الاستلام' }, next: 'picked_up', icon: PackageCheck };
      case 'picked_up': return { label: { en: 'Start Delivery', ar: 'بدء التوصيل' }, next: 'in_transit', icon: Truck };
      case 'in_transit': return { label: { en: 'Mark as Delivered', ar: 'تم التوصيل' }, next: 'delivered', icon: CheckCircle2 };
      default: return null;
    }
  };

  const handleAction = (order: FullOrder) => {
    const action = getNextAction(order.status);
    if (!action) return;
    if (action.next === 'delivered') {
      setDeliveryModalOrder(order);
    } else {
      updateStatus(order.id, action.next);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Active orders */}
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">{t('Active Deliveries', 'التوصيلات النشطة')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t(`${myOrders.length} orders assigned to you`, `${myOrders.length} طلبات مسندة إليك`)}</p>

          {myOrders.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t('No active deliveries', 'لا توجد توصيلات نشطة')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map(order => {
                const action = getNextAction(order.status);
                return (
                  <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                      <div>
                        <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{order.total} {t('SAR', 'ر.س')}</span>
                        <OrderBadge status={order.status} />
                      </div>
                    </div>

                    {/* Pickup location */}
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

                    {/* Delivery location */}
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mt-0.5">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('Deliver to', 'التوصيل إلى')}</p>
                          <p className="text-sm font-medium text-foreground">{t(order.customerNameEn, order.customerNameAr)}</p>
                          <p className="text-xs text-muted-foreground">{t(order.addressEn, order.addressAr)}</p>
                          <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                            <Phone className="h-3 w-3" />
                            {order.customerPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-muted-foreground mb-1">{t('Items:', 'المنتجات:')}</p>
                      {order.items.map((item, i) => (
                        <p key={i} className="text-sm text-foreground">{t(item.nameEn, item.nameAr)} <span className="text-muted-foreground">×{item.qty}</span></p>
                      ))}
                    </div>

                    {/* Action */}
                    {action ? (
                      <div className="px-4 py-3">
                        <button
                          onClick={() => handleAction(order)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                          <action.icon className="h-4 w-4" />
                          {t(action.label.en, action.label.ar)}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed */}
        {completedOrders.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">{t('Completed Today', 'المكتملة اليوم')}</h2>
            <div className="space-y-2">
              {completedOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{t(order.customerNameEn, order.customerNameAr)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{order.total} {t('SAR', 'ر.س')}</span>
                    <OrderBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      {/* Proof of Delivery Modal */}
      {deliveryModalOrder ? (
        <ProofOfDeliveryModal
          order={deliveryModalOrder}
          onConfirm={(proof) => {
            setProofOfDelivery(deliveryModalOrder.id, proof);
            updateStatus(deliveryModalOrder.id, 'delivered');
            setDeliveryModalOrder(null);
          }}
          onClose={() => setDeliveryModalOrder(null)}
        />
      ) : null}
    </div>
  );
};

export default DeliveryDriverPage;









