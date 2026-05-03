/*
 * ─── API: Store Owner — Orders ───────────────────────────────────────────────
 *
 * GET /api/store/orders?page=1&pageSize=10&search=&status=
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Paginated response value:
 *   {
 *     items: Order[];
 *     totalItems: number; page: number; pageSize: number; totalPages: number;
 *   }
 *   Order: {
 *     id: string (GUID); orderNumber: string; date: string (YYYY-MM-DD);
 *     customerNameEn: string; customerNameAr: string; customerAddress?: string;
 *     items: { nameEn: string; nameAr: string; qty: number; price: number }[];
 *     total: number; status: 'pending'|'processing'|'shipped'|'delivered';
 *   }
 *
 * PUT /api/store/orders/{id}/status
 * DTO: { status: 'processing'|'shipped'|'delivered' }
 * Response value: Order (updated)
 *
 * GET /api/store/orders/{id}/receipt
 * Response value: { receiptUrl: string }  // URL of printable receipt PDF
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { STORE_ORDERS, StoreOrder } from '~/entities/storeOwnerData';
import { OrderStatusBadge } from '@/pages/StoreOwnerOverview';
import { Package, Search, Printer, ChevronRight } from 'lucide-react';

const STATUS_FLOW: Record<string, StoreOrder['status'] | null> = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
  delivered: null,
};

const StoreOwnerOrders = () => {
  const { t } = useLocale();
  const [orders, setOrders] = useState<StoreOrder[]>(STORE_ORDERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [printOrder, setPrintOrder] = useState<StoreOrder | null>(null);

  const advanceStatus = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = STATUS_FLOW[o.status];
      return next ? { ...o, status: next } : o;
    }));
  };

  const activeOrders = useMemo(() =>
    orders.filter(o => o.status === 'pending' || o.status === 'processing'),
    [orders]
  );

  const displayOrders = useMemo(() => {
    const base = filterStatus === 'active'
      ? orders.filter(o => o.status === 'pending' || o.status === 'processing')
      : orders;
    return base.filter(o => {
      if (!search) return true;
      return o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerNameEn.toLowerCase().includes(search.toLowerCase()) ||
        o.customerNameAr.includes(search);
    });
  }, [orders, filterStatus, search]);

  const handlePrint = (order: StoreOrder) => {
    setPrintOrder(order);
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Orders', 'إدارة الطلبات')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {activeOrders.length} {t('orders need preparation', 'طلبات تحتاج تحضيراً')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search by order # or customer...', 'ابحث برقم الطلب أو اسم العميل...')}
            className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {(['active', 'all'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${filterStatus === v ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}
            >
              {v === 'active' ? t('Active', 'نشطة') : t('All', 'الكل')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {displayOrders.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-muted-foreground text-sm">
            {t('No orders found', 'لم يتم العثور على طلبات')}
          </div>
        )}
        {displayOrders.map(order => {
          const nextStatus = STATUS_FLOW[order.status];
          const nextLabels: Record<string, { en: string; ar: string }> = {
            pending: { en: 'Mark as Processing', ar: 'تحديد كـ قيد المعالجة' },
            processing: { en: 'Mark as Shipped', ar: 'تحديد كـ تم الشحن' },
            shipped: { en: 'Mark as Delivered', ar: 'تحديد كـ تم التوصيل' },
          };
          return (
            <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{order.total} {t('SAR', 'ر.س')}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t('Customer:', 'العميل:')} <span className="text-foreground font-medium">{t(order.customerNameEn, order.customerNameAr)}</span>
                  </p>
                  {order.customerAddress && (
                    <p className="text-xs text-muted-foreground">
                      {t('Address:', 'العنوان:')} <span className="text-foreground">{order.customerAddress}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t(item.nameEn, item.nameAr)} <span className="text-foreground/60">×{item.qty}</span>
                      </span>
                      <span className="text-foreground font-medium">{item.price * item.qty} {t('SAR', 'ر.س')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                <button onClick={() => handlePrint(order)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
                  <Printer className="h-3.5 w-3.5" />
                  {t('Print', 'طباعة')}
                </button>
                {nextStatus && (
                  <button
                    onClick={() => advanceStatus(order.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl gradient-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {t(nextLabels[order.status]?.en || '', nextLabels[order.status]?.ar || '')}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden print receipt */}
      {printOrder && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[9999]">
          <h1 className="text-xl font-bold mb-2">BabRizq — {t('Receipt', 'إيصال')}</h1>
          <p className="text-sm mb-1">{printOrder.orderNumber} · {printOrder.date}</p>
          <p className="text-sm mb-4">{t('Customer:', 'العميل:')} {printOrder.customerNameEn}</p>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b"><th className="text-start py-1">{t('Item', 'المنتج')}</th><th className="text-start py-1">{t('Qty', 'الكمية')}</th><th className="text-end py-1">{t('Total', 'الإجمالي')}</th></tr></thead>
            <tbody>
              {printOrder.items.map((item, i) => (
                <tr key={i} className="border-b"><td className="py-1">{item.nameEn}</td><td className="py-1">{item.qty}</td><td className="py-1 text-end">{item.price * item.qty} SAR</td></tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={2} className="pt-2 font-bold">{t('Total', 'الإجمالي')}</td><td className="pt-2 font-bold text-end">{printOrder.total} SAR</td></tr></tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoreOwnerOrders;









