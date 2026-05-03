/*
 * ─── API: Store Owner — Warehouse / Inventory ────────────────────────────────
 *
 * GET /api/store/warehouse/inventory?page=1&pageSize=10&search=&filter=all|low|out
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Paginated response value:
 *   { items: InventoryItem[]; totalItems, page, pageSize, totalPages }
 *   InventoryItem: { id: string (GUID); nameEn: string; nameAr: string; stock: number; sku?: string }
 *
 * PUT /api/store/warehouse/inventory/{productId}/adjust
 * DTO: { delta: number; note?: string }   // delta can be negative (stock removal)
 * Response value: InventoryItem (updated stock)
 *
 * GET /api/store/warehouse/movements?page=1&pageSize=10
 * Paginated response value:
 *   { items: StockMovement[]; ... }
 *   StockMovement: {
 *     id: string (GUID); productId: string (GUID); productNameEn: string; productNameAr: string;
 *     type: 'in'|'out'|'adjustment'; qty: number; note?: string; date: string (YYYY-MM-DD);
 *   }
 *
 * GET /api/store/warehouse/suppliers?page=1&pageSize=10
 * Paginated response value: { items: Supplier[]; ... }
 *   Supplier: {
 *     id: string (GUID); nameEn: string; nameAr: string; contact: string; phone: string; email: string;
 *   }
 *
 * POST /api/store/warehouse/suppliers
 * DTO: Omit<Supplier, 'id'>
 * Response value: Supplier (newly created)
 *
 * PUT /api/store/warehouse/suppliers/{id}
 * DTO: Partial<Omit<Supplier, 'id'>>
 * Response value: Supplier (updated)
 *
 * DELETE /api/store/warehouse/suppliers/{id}
 * Response value: null
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import {
  Warehouse, PackagePlus, PackageMinus, PackageSearch, TrendingDown,
  Plus, Pencil, Trash2, Search, X, ArrowUp, ArrowDown, RefreshCw,
} from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import {
  STORE_PRODUCTS, STOCK_MOVEMENTS, STORE_SUPPLIERS,
  StoreProduct, StockMovement, Supplier,
} from '~/entities/storeOwnerData';
import { todayDate } from '@/shared/lib/utils';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

type Tab = 'inventory' | 'movements' | 'suppliers';

// ─── Inventory Tab ───────────────────────────────────────────────────────────

const InventoryTab = ({ t, lang }: { t: (e: string, a: string) => string; lang: string }) => {
  const [products, setProducts] = useState<StoreProduct[]>(STORE_PRODUCTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustProduct, setAdjustProduct] = useState<StoreProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = p.nameEn.toLowerCase().includes(search.toLowerCase()) || p.nameAr.includes(search);
    if (filter === 'low') return matchSearch && p.stock > 0 && p.stock <= 5;
    if (filter === 'out') return matchSearch && p.stock === 0;
    return matchSearch;
  }), [products, search, filter]);

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(filtered);

  const stockSummary = useMemo(() => ({
    total: products.length,
    low: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    out: products.filter(p => p.stock === 0).length,
    totalUnits: products.reduce((s, p) => s + p.stock, 0),
  }), [products]);

  const handleAdjust = () => {
    if (!adjustProduct || adjustQty === 0) return;
    setProducts(prev => prev.map(p =>
      p.id === adjustProduct.id ? { ...p, stock: Math.max(0, p.stock + adjustQty) } : p,
    ));
    setAdjustProduct(null);
    setAdjustQty(0);
    setAdjustNote('');
  };

  const stockColor = (stock: number) => {
    if (stock === 0) return 'text-destructive';
    if (stock <= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { labelEn: 'Total Products', labelAr: 'إجمالي المنتجات', value: stockSummary.total, icon: PackageSearch, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
          { labelEn: 'Total Units', labelAr: 'إجمالي الوحدات', value: stockSummary.totalUnits, icon: Warehouse, color: 'text-primary bg-primary/10' },
          { labelEn: 'Low Stock', labelAr: 'مخزون منخفض', value: stockSummary.low, icon: TrendingDown, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
          { labelEn: 'Out of Stock', labelAr: 'نفاد المخزون', value: stockSummary.out, icon: PackageMinus, color: 'text-destructive bg-destructive/10' },
        ].map(s => (
          <div key={s.labelEn} className="rounded-xl border border-border bg-card p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.color} mb-2`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelEn, s.labelAr)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search products...', 'ابحث عن المنتجات...')}
            className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', labelEn: 'All', labelAr: 'الكل' },
            { id: 'low', labelEn: 'Low Stock', labelAr: 'منخفض' },
            { id: 'out', labelEn: 'Out of Stock', labelAr: 'نافد' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${filter === f.id ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}>
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
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Product', 'المنتج')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Stock', 'المخزون')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Status', 'الحالة')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Adjust', 'تعديل')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{lang === 'ar' ? p.nameAr : p.nameEn}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || '—'}</td>
                  <td className={`px-4 py-3 text-center font-bold text-base ${stockColor(p.stock)}`}>{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    {p.stock === 0
                      ? <span className="rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-medium">{t('Out', 'نافد')}</span>
                      : p.stock <= 5
                        ? <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 text-xs font-medium">{t('Low', 'منخفض')}</span>
                        : <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium">{t('OK', 'جيد')}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setAdjustProduct(p)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
                      <RefreshCw className="h-3 w-3" />
                      {t('Adjust', 'تعديل')}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">{t('No products found.', 'لا توجد منتجات.')}</td></tr>
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

      {/* Adjust Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{t('Adjust Stock', 'تعديل المخزون')}</h3>
              <button onClick={() => setAdjustProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? adjustProduct.nameAr : adjustProduct.nameEn}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setAdjustQty(q => q - 1)} className="rounded-lg border border-border p-2 hover:bg-accent transition-colors"><ArrowDown className="h-4 w-4" /></button>
              <input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(Number(e.target.value))}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={() => setAdjustQty(q => q + 1)} className="rounded-lg border border-border p-2 hover:bg-accent transition-colors"><ArrowUp className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`Current: ${adjustProduct.stock} → New: ${Math.max(0, adjustProduct.stock + adjustQty)}`, `الحالي: ${adjustProduct.stock} ← الجديد: ${Math.max(0, adjustProduct.stock + adjustQty)}`)}
            </p>
            <input
              value={adjustNote}
              onChange={e => setAdjustNote(e.target.value)}
              placeholder={t('Reason (optional)', 'السبب (اختياري)')}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAdjust}
              disabled={adjustQty === 0}
              className="w-full rounded-xl gradient-gold py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {t('Apply Adjustment', 'تطبيق التعديل')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Movements Tab ───────────────────────────────────────────────────────────

const MovementsTab = ({ t, lang }: { t: (e: string, a: string) => string; lang: string }) => {
  const [movements, setMovements] = useState<StockMovement[]>(STOCK_MOVEMENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    productId: STORE_PRODUCTS[0]?.id ?? '',
    type: 'in' as StockMovement['type'],
    quantity: 1,
    reason: '',
    reasonAr: '',
    reference: '',
  });

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(movements);

  const handleAdd = () => {
    if (!form.productId || form.quantity === 0) return;
    const product = STORE_PRODUCTS.find(p => p.id === form.productId);
    if (!product) return;
    let finalQty: number;
    if (form.type === 'out') {
      finalQty = -Math.abs(form.quantity);
    } else if (form.type === 'adjustment') {
      // For adjustment, preserve the sign as entered (positive = add, negative = remove)
      finalQty = form.quantity;
    } else {
      finalQty = Math.abs(form.quantity);
    }
    const newMovement: StockMovement = {
      id: `sm${Date.now()}`,
      productId: form.productId,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
      type: form.type,
      quantity: finalQty,
      reason: form.reason || 'Manual adjustment',
      reasonAr: form.reasonAr || 'تعديل يدوي',
      date: todayDate(),
      reference: form.reference || undefined,
    };
    setMovements(prev => [newMovement, ...prev]);
    setShowAdd(false);
    setForm({ productId: STORE_PRODUCTS[0]?.id ?? '', type: 'in', quantity: 1, reason: '', reasonAr: '', reference: '' });
  };

  const typeIcon = (type: StockMovement['type']) => {
    if (type === 'in') return <ArrowUp className="h-3.5 w-3.5" />;
    if (type === 'out') return <ArrowDown className="h-3.5 w-3.5" />;
    return <RefreshCw className="h-3.5 w-3.5" />;
  };

  const typeBadge = (type: StockMovement['type']) => {
    if (type === 'in') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (type === 'out') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const typeLabel = (type: StockMovement['type']) => {
    if (type === 'in') return t('IN', 'وارد');
    if (type === 'out') return t('OUT', 'صادر');
    return t('ADJ', 'تعديل');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{t('Stock Movements Log', 'سجل حركات المخزون')}</h2>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t('Add Movement', 'إضافة حركة')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Date', 'التاريخ')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Product', 'المنتج')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Type', 'النوع')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('Qty', 'الكمية')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Reason', 'السبب')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Ref', 'المرجع')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(m => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{m.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{lang === 'ar' ? m.productNameAr : m.productNameEn}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge(m.type)}`}>
                      {typeIcon(m.type)}
                      {typeLabel(m.type)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${m.quantity < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lang === 'ar' ? m.reasonAr : m.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.reference || '—'}</td>
                </tr>
              ))}
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

      {/* Add Movement Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{t('Add Stock Movement', 'إضافة حركة مخزون')}</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <select
                value={form.productId}
                onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STORE_PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{lang === 'ar' ? p.nameAr : p.nameEn}</option>
                ))}
              </select>
              <div className="flex gap-2">
                {(['in', 'out', 'adjustment'] as const).map(tp => (
                  <button key={tp} onClick={() => setForm(f => ({ ...f, type: tp }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${form.type === tp ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                    {tp === 'in' ? t('In', 'وارد') : tp === 'out' ? t('Out', 'صادر') : t('Adjustment', 'تعديل')}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                placeholder={t('Quantity', 'الكمية')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder={t('Reason (English)', 'السبب (إنجليزي)')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={form.reasonAr}
                onChange={e => setForm(f => ({ ...f, reasonAr: e.target.value }))}
                placeholder={t('Reason (Arabic)', 'السبب (عربي)')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder={t('Reference / PO # (optional)', 'المرجع / رقم الطلب (اختياري)')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button onClick={handleAdd}
              className="w-full rounded-xl gradient-gold py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
              {t('Add Movement', 'إضافة الحركة')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Suppliers Tab ───────────────────────────────────────────────────────────

const SuppliersTab = ({ t, lang }: { t: (e: string, a: string) => string; lang: string }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(STORE_SUPPLIERS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ nameEn: '', nameAr: '', contactName: '', phone: '', email: '', address: '' });

  const openCreate = () => { setEditing(null); setForm({ nameEn: '', nameAr: '', contactName: '', phone: '', email: '', address: '' }); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ nameEn: s.nameEn, nameAr: s.nameAr, contactName: s.contactName, phone: s.phone, email: s.email, address: s.address }); setShowModal(true); };
  const handleDelete = (id: string) => setSuppliers(prev => prev.filter(s => s.id !== id));

  const handleSave = () => {
    if (!form.nameEn && !form.nameAr) return;
    if (editing) {
      setSuppliers(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setSuppliers(prev => [...prev, { ...form, id: `sup${Date.now()}`, productsSupplied: 0 }]);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{t('Suppliers', 'الموردون')}</h2>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t('Add Supplier', 'إضافة مورد')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">{lang === 'ar' ? s.nameAr : s.nameEn}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.contactName}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => openEdit(s)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="rounded-lg border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {s.phone && <p>📞 {s.phone}</p>}
              {s.email && <p>✉ {s.email}</p>}
              {s.address && <p>📍 {s.address}</p>}
            </div>
            <div className="pt-2 border-t border-border">
              <span className="text-xs font-medium text-primary">
                {s.productsSupplied} {t('products supplied', 'منتجات موردة')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {editing ? t('Edit Supplier', 'تعديل المورد') : t('Add Supplier', 'إضافة مورد')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'nameEn', labelEn: 'Name (English)', labelAr: 'الاسم (إنجليزي)' },
                { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)' },
                { key: 'contactName', labelEn: 'Contact Person', labelAr: 'مسؤول التواصل' },
                { key: 'phone', labelEn: 'Phone', labelAr: 'الهاتف' },
                { key: 'email', labelEn: 'Email', labelAr: 'البريد الإلكتروني' },
                { key: 'address', labelEn: 'Address', labelAr: 'العنوان' },
              ].map(f => (
                <input
                  key={f.key}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={t(f.labelEn, f.labelAr)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ))}
            </div>
            <button onClick={handleSave}
              className="w-full rounded-xl gradient-gold py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
              {t('Save', 'حفظ')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const StoreOwnerWarehouse = () => {
  const { t, lang } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  const tabs: { id: Tab; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { id: 'inventory', labelEn: 'Inventory', labelAr: 'المخزون', icon: Warehouse },
    { id: 'movements', labelEn: 'Stock Movements', labelAr: 'حركات المخزون', icon: PackagePlus },
    { id: 'suppliers', labelEn: 'Suppliers', labelAr: 'الموردون', icon: PackageSearch },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Warehouse Management', 'إدارة المستودع')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Manage inventory, stock movements and suppliers.', 'إدارة المخزون وحركاته والموردين.')}</p>
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

      {activeTab === 'inventory' && <InventoryTab t={t} lang={lang} />}
      {activeTab === 'movements' && <MovementsTab t={t} lang={lang} />}
      {activeTab === 'suppliers' && <SuppliersTab t={t} lang={lang} />}
    </div>
  );
};

export default StoreOwnerWarehouse;









