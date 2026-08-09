/*
 * ─── API: Store Owner — Accounting & Finance ─────────────────────────────────
 *
 * GET /api/store/accounting/summary
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Response value:
 *   { totalRevenue: number; totalExpenses: number; netProfit: number; profitMargin: number;
 *     pnlByMonth: { month: string; revenue: number; expenses: number }[] }
 *
 * GET /api/store/accounting/invoices?page=1&pageSize=10&search=&status=
 * Paginated response value:
 *   { items: Invoice[]; totalItems, page, pageSize, totalPages }
 *   Invoice: {
 *     id: string (GUID); number: string; customerNameEn: string; customerNameAr: string;
 *     total: number; currency: string; status: 'paid'|'unpaid'|'overdue';
 *     issuedDate: string (YYYY-MM-DD); dueDate: string (YYYY-MM-DD);
 *   }
 *
 * POST /api/store/accounting/invoices
 * DTO: Omit<Invoice, 'id' | 'number'>
 * Response value: Invoice (newly created, with auto-generated number)
 *
 * GET /api/store/accounting/expenses?page=1&pageSize=10
 * Paginated response value:
 *   { items: Expense[]; totalItems, page, pageSize, totalPages }
 *   Expense: {
 *     id: string (GUID); category: 'rent'|'salary'|'marketing'|'shipping'|'utilities'|'other';
 *     amount: number; currency: string; note?: string; date: string (YYYY-MM-DD);
 *   }
 *
 * POST /api/store/accounting/expenses
 * DTO: Omit<Expense, 'id'>
 * Response value: Expense (newly created)
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Receipt,
  Plus, X, Printer, Search,
} from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import {
  STORE_EXPENSES, STORE_INVOICES,
  Expense, Invoice,
} from '~/entities/accounting';
import { MONTHLY_SALES_DATA } from '~/entities/sales';
import { todayDate } from '@/shared/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

type Tab = 'summary' | 'invoices' | 'expenses';

const EXPENSE_CATEGORIES: { id: Expense['category']; labelEn: string; labelAr: string; emoji: string }[] = [
  { id: 'rent', labelEn: 'Rent', labelAr: 'إيجار', emoji: '🏢' },
  { id: 'salary', labelEn: 'Salaries', labelAr: 'رواتب', emoji: '👥' },
  { id: 'marketing', labelEn: 'Marketing', labelAr: 'تسويق', emoji: '📣' },
  { id: 'shipping', labelEn: 'Shipping', labelAr: 'شحن', emoji: '🚚' },
  { id: 'utilities', labelEn: 'Utilities', labelAr: 'خدمات', emoji: '⚡' },
  { id: 'other', labelEn: 'Other', labelAr: 'أخرى', emoji: '📦' },
];

// Hoisted static derivations — these values never change at runtime
const TOTAL_REVENUE = STORE_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
const TOTAL_EXPENSES = STORE_EXPENSES.reduce((s, e) => s + e.amount, 0);
const NET_PROFIT = TOTAL_REVENUE - TOTAL_EXPENSES;
const PROFIT_MARGIN = TOTAL_REVENUE > 0 ? ((NET_PROFIT / TOTAL_REVENUE) * 100).toFixed(1) : '0';
const EXPENSE_BY_CATEGORY = EXPENSE_CATEGORIES.map(cat => ({
  ...cat,
  total: STORE_EXPENSES.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
})).filter(c => c.total > 0).toSorted((a, b) => b.total - a.total);

// ─── Summary Tab ─────────────────────────────────────────────────────────────

const SummaryTab = ({ t, lang }: { t: (e: string, a: string) => string; lang: string }) => {
  const pnlData = useMemo(() => MONTHLY_SALES_DATA.map((d, i) => {
    const monthExpenses = Math.round(TOTAL_EXPENSES / MONTHLY_SALES_DATA.length * (0.8 + i * 0.05));
    return {
      label: lang === 'ar' ? d.monthAr : d.month,
      revenue: d.sales,
      expenses: monthExpenses,
      profit: d.sales - monthExpenses,
    };
  }), [lang]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            labelEn: 'Total Revenue', labelAr: 'إجمالي الإيرادات',
            value: TOTAL_REVENUE.toLocaleString(), suffix: t('SAR', 'ر.س'),
            icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
            trend: '+12.5%', positive: true,
          },
          {
            labelEn: 'Total Expenses', labelAr: 'إجمالي المصروفات',
            value: TOTAL_EXPENSES.toLocaleString(), suffix: t('SAR', 'ر.س'),
            icon: TrendingDown, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
            trend: '+3.2%', positive: false,
          },
          {
            labelEn: 'Net Profit', labelAr: 'صافي الربح',
            value: NET_PROFIT.toLocaleString(), suffix: t('SAR', 'ر.س'),
            icon: TrendingUp, color: 'text-primary bg-primary/10',
            trend: '+18.4%', positive: true,
          },
          {
            labelEn: 'Profit Margin', labelAr: 'هامش الربح',
            value: PROFIT_MARGIN, suffix: '%',
            icon: FileText, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
            trend: '', positive: true,
          },
        ].map(card => (
          <div key={card.labelEn} className="rounded-xl border border-border bg-card p-5">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.color} mb-3`}>
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value} <span className="text-sm font-medium text-muted-foreground">{card.suffix}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">{t(card.labelEn, card.labelAr)}</p>
            {card.trend && (
              <span className={`text-xs font-semibold mt-1 inline-block ${card.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {card.trend}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* P&L Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">{t('Profit & Loss Overview', 'نظرة على الأرباح والخسائر')}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pnlData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(v: number, name: string) => [`${v.toLocaleString()} ${t('SAR', 'ر.س')}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="revenue" name={t('Revenue', 'الإيرادات')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name={t('Expenses', 'المصروفات')} fill="hsl(var(--destructive))" opacity={0.7} radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name={t('Profit', 'الربح')} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net Profit Trend */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">{t('Net Profit Trend', 'اتجاه صافي الربح')}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={pnlData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="profit" name={t('Net Profit', 'صافي الربح')} stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense breakdown */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t('Expenses by Category', 'المصروفات حسب الفئة')}</h2>
        </div>
        <div className="divide-y divide-border">
          {EXPENSE_BY_CATEGORY.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.emoji}</span>
                <p className="text-sm font-medium text-foreground">{t(cat.labelEn, cat.labelAr)}</p>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-foreground">{cat.total.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t('SAR', 'ر.س')}</span></p>
                <p className="text-xs text-muted-foreground">{((cat.total / TOTAL_EXPENSES) * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Invoices Tab ────────────────────────────────────────────────────────────

const InvoicesTab = ({ t, lang }: { t: (e: string, a: string) => string; lang: string }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(STORE_INVOICES);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Invoice['status']>('all');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerNameEn.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerNameAr.includes(search);
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  }), [invoices, search, filterStatus]);

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(filtered);

  const handleMarkAsPaid = (id: string) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' as const } : i));

  const statusBadge = (status: Invoice['status']) => {
    if (status === 'paid') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (status === 'unpaid') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-muted text-muted-foreground';
  };

  const statusLabel = (status: Invoice['status']) => {
    if (status === 'paid') return t('Paid', 'مدفوع');
    if (status === 'unpaid') return t('Unpaid', 'غير مدفوع');
    return t('Cancelled', 'ملغي');
  };

  const handlePrint = (inv: Invoice) => {
    setViewInvoice(inv);
    // Delay allows React to render the invoice modal before the browser's print dialog opens
    setTimeout(() => window.print(), 200);
  };

  const totalPaid = useMemo(() => invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0), [invoices]);
  const totalUnpaid = useMemo(() => invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total, 0), [invoices]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('Total Invoices', 'إجمالي الفواتير')}</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('Paid Amount', 'المبلغ المحصّل')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalPaid.toLocaleString()} <span className="text-sm font-normal">{t('SAR', 'ر.س')}</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('Pending Amount', 'المبلغ المعلق')}</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalUnpaid.toLocaleString()} <span className="text-sm font-normal">{t('SAR', 'ر.س')}</span></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search invoices...', 'ابحث عن فاتورة...')}
            className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', labelEn: 'All', labelAr: 'الكل' },
            { id: 'paid', labelEn: 'Paid', labelAr: 'مدفوع' },
            { id: 'unpaid', labelEn: 'Unpaid', labelAr: 'غير مدفوع' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id as typeof filterStatus)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${filterStatus === f.id ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}>
              {t(f.labelEn, f.labelAr)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Invoice #', 'رقم الفاتورة')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Customer', 'العميل')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Date', 'التاريخ')}</th>
                <th className="text-end px-4 py-3 font-medium text-muted-foreground">{t('Total', 'الإجمالي')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Status', 'الحالة')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(inv => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{lang === 'ar' ? inv.customerNameAr : inv.customerNameEn}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3 text-end font-bold text-foreground">{inv.total.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{inv.currency}</span></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(inv.status)}`}>{statusLabel(inv.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewInvoice(inv)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                        <FileText className="h-3 w-3" />
                        {t('View', 'عرض')}
                      </button>
                      {inv.status === 'unpaid' && (
                        <button onClick={() => handleMarkAsPaid(inv.id)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors">
                          ✓ {t('Mark Paid', 'تحصيل')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">{t('No invoices found.', 'لا توجد فواتير.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <Pagination
            page={page} totalPages={totalPages} totalItems={totalItems}
            from={from} to={to} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0 print:inset-auto print:relative">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5 print:shadow-none print:border-none print:rounded-none print:max-w-full">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="text-base font-bold text-foreground">{t('Invoice', 'فاتورة')} {viewInvoice.invoiceNumber}</h3>
              <div className="flex gap-2">
                <button onClick={() => handlePrint(viewInvoice)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                  <Printer className="h-3.5 w-3.5" />
                  {t('Print', 'طباعة')}
                </button>
                <button onClick={() => setViewInvoice(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {/* Invoice content */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-primary">BabRizq</p>
                  <p className="text-xs text-muted-foreground">{t('Invoice', 'فاتورة')}: {viewInvoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{t('Date', 'التاريخ')}: {viewInvoice.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadge(viewInvoice.status)}`}>{statusLabel(viewInvoice.status)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-0.5">{t('Customer', 'العميل')}</p>
                <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? viewInvoice.customerNameAr : viewInvoice.customerNameEn}</p>
                <p className="text-xs text-muted-foreground">{viewInvoice.orderNumber}</p>
              </div>
              <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-start px-3 py-2 font-medium text-muted-foreground text-xs">{t('Item', 'المنتج')}</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">{t('Qty', 'الكمية')}</th>
                    <th className="text-end px-3 py-2 font-medium text-muted-foreground text-xs">{t('Price', 'السعر')}</th>
                    <th className="text-end px-3 py-2 font-medium text-muted-foreground text-xs">{t('Total', 'الإجمالي')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {viewInvoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-foreground">{lang === 'ar' ? item.nameAr : item.nameEn}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{item.qty}</td>
                      <td className="px-3 py-2 text-end text-muted-foreground">{item.price.toLocaleString()}</td>
                      <td className="px-3 py-2 text-end font-medium text-foreground">{(item.qty * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('Subtotal', 'المجموع الفرعي')}</span>
                  <span>{viewInvoice.subtotal.toLocaleString()} {viewInvoice.currency}</span>
                </div>
                {viewInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>{t('Discount', 'الخصم')}</span>
                    <span>-{viewInvoice.discount.toLocaleString()} {viewInvoice.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('Tax (15%)', 'الضريبة (15%)')}</span>
                  <span>{viewInvoice.tax.toLocaleString()} {viewInvoice.currency}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2 mt-2">
                  <span>{t('Total', 'الإجمالي')}</span>
                  <span>{viewInvoice.total.toLocaleString()} {viewInvoice.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

const ExpensesTab = ({ t, lang }: { t: (e: string, a: string) => string; lang: string }) => {
  const [expenses, setExpenses] = useState<Expense[]>(STORE_EXPENSES);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    titleEn: '', titleAr: '',
    category: 'other' as Expense['category'],
    amount: 0,
    currency: 'SAR',
    note: '',
  });

  const handleAdd = () => {
    if (!form.titleEn || form.amount <= 0) return;
    const newExp: Expense = {
      id: `exp${Date.now()}`,
      titleEn: form.titleEn,
      titleAr: form.titleAr || form.titleEn,
      category: form.category,
      amount: form.amount,
      currency: form.currency,
      date: todayDate(),
      note: form.note || undefined,
    };
    setExpenses(prev => [newExp, ...prev]);
    setShowAdd(false);
    setForm({ titleEn: '', titleAr: '', category: 'other', amount: 0, currency: 'SAR', note: '' });
  };

  const handleDelete = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const catLabel = (cat: Expense['category']) => {
    const found = EXPENSE_CATEGORIES.find(c => c.id === cat);
    return found ? `${found.emoji} ${t(found.labelEn, found.labelAr)}` : cat;
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(expenses);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t('Expenses', 'المصروفات')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Total', 'الإجمالي')}: <span className="font-bold text-destructive">{totalExpenses.toLocaleString()} {t('SAR', 'ر.س')}</span>
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t('Add Expense', 'إضافة مصروف')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Date', 'التاريخ')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Title', 'العنوان')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Category', 'الفئة')}</th>
                <th className="text-end px-4 py-3 font-medium text-muted-foreground">{t('Amount', 'المبلغ')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(e => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{lang === 'ar' ? e.titleAr : e.titleEn}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{catLabel(e.category)}</td>
                  <td className="px-4 py-3 text-end font-semibold text-destructive">{e.amount.toLocaleString()} <span className="text-xs font-normal">{e.currency}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">{t('No expenses recorded.', 'لا توجد مصروفات.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <Pagination
            page={page} totalPages={totalPages} totalItems={totalItems}
            from={from} to={to} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{t('Add Expense', 'إضافة مصروف')}</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input
                value={form.titleEn}
                onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                placeholder={t('Title (English)', 'العنوان (إنجليزي)')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={form.titleAr}
                onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                placeholder={t('Title (Arabic)', 'العنوان (عربي)')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Expense['category'] }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {t(c.labelEn, c.labelAr)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  placeholder={t('Amount', 'المبلغ')}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {['SAR', 'USD', 'AED', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder={t('Note (optional)', 'ملاحظة (اختياري)')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button onClick={handleAdd}
              className="w-full rounded-xl gradient-gold py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
              {t('Add Expense', 'إضافة المصروف')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const StoreOwnerAccounting = () => {
  const { t, lang } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const tabs: { id: Tab; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { id: 'summary', labelEn: 'Financial Summary', labelAr: 'الملخص المالي', icon: TrendingUp },
    { id: 'invoices', labelEn: 'Invoices', labelAr: 'الفواتير', icon: Receipt },
    { id: 'expenses', labelEn: 'Expenses', labelAr: 'المصروفات', icon: DollarSign },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Accounting & Finance', 'المحاسبة والمالية')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Track revenue, expenses, invoices and profit.', 'تتبع الإيرادات والمصروفات والفواتير والأرباح.')}</p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelEn, tab.labelAr)}
            </button>
          );
        })}
      </div>

      {activeTab === 'summary' && <SummaryTab t={t} lang={lang} />}
      {activeTab === 'invoices' && <InvoicesTab t={t} lang={lang} />}
      {activeTab === 'expenses' && <ExpensesTab t={t} lang={lang} />}
    </div>
  );
};

export default StoreOwnerAccounting;









