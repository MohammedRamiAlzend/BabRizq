/*
 * ─── API: Store Owner — Sales ────────────────────────────────────────────────
 *
 * GET /api/store/sales?page=1&pageSize=10&search=&currency=
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Paginated response value:
 *   {
 *     items: SaleRecord[];
 *     totalItems, page, pageSize, totalPages;
 *     summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number; byCurrency: { currency: string; amount: number }[] }
 *   }
 *   SaleRecord: {
 *     id: string (GUID); orderNumber: string; date: string (YYYY-MM-DD);
 *     customerNameEn: string; customerNameAr: string;
 *     total: number; currency: string; status: 'delivered';
 *     items: { nameEn: string; nameAr: string; qty: number; price: number }[];
 *   }
 *
 * GET /api/store/sales/export?format=csv|xlsx&currency=
 * Response: file download (text/csv or application/vnd.openxmlformats)
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { STORE_ORDERS, StoreOrder, CURRENCIES } from '~/entities/storeOwnerData';
import { OrderStatusBadge } from '@/pages/StoreOwnerOverview';
import { Download, Search } from 'lucide-react';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

const delivered = STORE_ORDERS.filter(o => o.status === 'delivered');

const StoreOwnerSales = () => {
  const { t } = useLocale();

  const [search, setSearch] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {
    return delivered.filter(o => {
      if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerNameEn.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerNameAr.includes(search)) return false;
      if (filterCurrency && o.currency !== filterCurrency) return false;
      if (minAmount && o.total < parseFloat(minAmount)) return false;
      if (maxAmount && o.total > parseFloat(maxAmount)) return false;
      if (fromDate && o.date < fromDate) return false;
      if (toDate && o.date > toDate) return false;
      return true;
    });
  }, [search, filterCurrency, minAmount, maxAmount, fromDate, toDate]);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);

  const exportCsv = () => {
    const header = 'Order,Customer,Date,Amount,Currency,Status';
    const rows = filtered.map(o =>
      `${o.orderNumber},"${o.customerNameEn}",${o.date},${o.total},${o.currency},${o.status}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(filtered);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Sales', 'إدارة المبيعات')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} {t('delivered orders', 'طلب مسلّم')} · {t('Total:', 'الإجمالي:')} {totalRevenue.toLocaleString()} {t('SAR', 'ر.س')}
          </p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors shrink-0">
          <Download className="h-4 w-4" />
          {t('Export CSV', 'تصدير CSV')}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="relative xl:col-span-2">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search orders...', 'ابحث في الطلبات...')}
            className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t('All Currencies', 'كل العملات')}</option>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="number" min="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder={t('Min', 'الحد الأدنى')} className="w-1/2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" min="0" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder={t('Max', 'الحد الأقصى')} className="w-1/2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-1/2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-1/2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Order', 'الطلب')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t('Customer', 'العميل')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('Date', 'التاريخ')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Amount', 'المبلغ')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t('Currency', 'العملة')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Status', 'الحالة')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(order => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t(order.customerNameEn, order.customerNameAr)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{order.date}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{order.currency}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">{t('No sales records found', 'لم يتم العثور على سجلات مبيعات')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/50 px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{filtered.length} {t('records', 'سجل')}</span>
          <span className="text-sm font-bold text-foreground">{t('Total Revenue:', 'إجمالي الإيرادات:')} {totalRevenue.toLocaleString()} {t('SAR', 'ر.س')}</span>
        </div>
      )}
      <Pagination
        page={page} totalPages={totalPages} totalItems={totalItems}
        from={from} to={to} pageSize={pageSize}
        onPageChange={setPage} onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default StoreOwnerSales;









