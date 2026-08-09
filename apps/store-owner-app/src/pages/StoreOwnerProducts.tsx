/*
 * ─── API: Store Owner — Products ────────────────────────────────────────────
 *
 * GET /api/store/products?page=1&pageSize=10&search=&categoryId=
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Paginated response value:
 *   {
 *     items: Product[];
 *     totalItems: number; page: number; pageSize: number; totalPages: number;
 *   }
 *   Product: {
 *     id: string (GUID); nameEn: string; nameAr: string;
 *     descriptionEn: string; descriptionAr: string;
 *     prices: { currencyCode: string; entries: { label: string; price: number }[] }[];
 *     stock: number; categoryId: string (GUID); imageUrl?: string;
 *     hasOffer: boolean;
 *   }
 *
 * POST /api/store/products
 * DTO: Omit<Product, 'id' | 'hasOffer'>
 * Response value: Product (newly created)
 *
 * PUT /api/store/products/{id}
 * DTO: Partial<Omit<Product, 'id'>>
 * Response value: Product (updated)
 *
 * DELETE /api/store/products/{id}
 * Response value: null
 *
 * GET /api/store/products/{id}/price-history
 * Response value: { entries: { date: string; priceEn: number; priceAr: number }[] }
 *
 * GET /api/store/products/{id}/qr
 * Response value: { qrDataUrl: string }   // base-64 PNG of the QR code
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, X, ImagePlus, Search, QrCode, History,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import {
  STORE_PRODUCTS, STORE_CATEGORIES, STORE_OFFERS,
  StoreProduct, CurrencyPrice, PriceEntry, CURRENCIES,
} from '~/entities/storeOwnerData';
import { OrderStatusBadge } from '@/pages/StoreOwnerOverview';
import { todayDate } from '@/shared/lib/utils';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

// ─── Helpers ────────────────────────────────────────────────────────────────

function hasActiveOffer(productId: string) {
  const now = todayDate();
  return STORE_OFFERS.some(
    o => o.isActive && o.type === 'product' && o.targetId === productId &&
      o.startDate <= now && o.endDate >= now,
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const StoreOwnerProducts = () => {
  const { t } = useLocale();
  const [products, setProducts] = useState<StoreProduct[]>(STORE_PRODUCTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [historyProduct, setHistoryProduct] = useState<StoreProduct | null>(null);
  const [qrProduct, setQrProduct] = useState<StoreProduct | null>(null);

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = p.nameEn.toLowerCase().includes(search.toLowerCase()) || p.nameAr.includes(search);
    const matchCat = !filterCat || p.categoryId === filterCat;
    return matchSearch && matchCat;
  }), [products, search, filterCat]);

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(filtered);

  const openCreate = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (p: StoreProduct) => { setEditingProduct(p); setModalOpen(true); };
  const handleDelete = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  const handleSave = (data: Omit<StoreProduct, 'id'>) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
    } else {
      setProducts(prev => [...prev, { ...data, id: `sp${Date.now()}` }]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Products', 'إدارة المنتجات')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(`${products.length} products in your store`, `${products.length} منتج في متجرك`)}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shrink-0">
          <Plus className="h-4 w-4" />
          {t('Add Product', 'إضافة منتج')}
        </button>
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
        <select
          value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t('All Categories', 'كل التصنيفات')}</option>
          {STORE_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{t(c.nameEn, c.nameAr)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Product', 'المنتج')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t('Category', 'الفئة')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Price (SAR)', 'السعر (ر.س)')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Stock', 'المخزون')}</th>
                <th className="text-end px-4 py-3 font-medium text-muted-foreground">{t('Actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map(product => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{t(product.nameEn, product.nameAr)}</span>
                      {hasActiveOffer(product.id) && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">{t('Offer', 'عرض')}</span>
                      )}
                    </div>
                    {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-muted-foreground">{t(product.categoryEn, product.categoryAr)}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {product.price}
                    {product.currencyPrices.length > 1 && (
                      <span className="ms-1 text-xs text-muted-foreground">+{product.currencyPrices.length - 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.stock === 0
                        ? 'bg-destructive/10 text-destructive'
                        : product.stock <= 5
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                      {product.stock === 0 ? t('Out of stock', 'نفد المخزون') : product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setQrProduct(product)} title={t('QR Code', 'رمز QR')} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button onClick={() => setHistoryProduct(product)} title={t('Price History', 'سجل الأسعار')} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                        <History className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(product)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {t('No products found', 'لم يتم العثور على منتجات')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page} totalPages={totalPages} totalItems={totalItems}
        from={from} to={to} pageSize={pageSize}
        onPageChange={setPage} onPageSizeChange={setPageSize}
      />

      {modalOpen && (
        <ProductFormModal product={editingProduct} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}
      {historyProduct && (
        <PriceHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}
      {qrProduct && (
        <QrCodeModal product={qrProduct} onClose={() => setQrProduct(null)} />
      )}
    </div>
  );
};

// ─── Price History Modal ─────────────────────────────────────────────────────

const PriceHistoryModal = ({ product, onClose }: { product: StoreProduct; onClose: () => void }) => {
  const { t } = useLocale();
  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-bold text-foreground">{t('Price History', 'سجل الأسعار')} — {t(product.nameEn, product.nameAr)}</h2>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
            {product.priceHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('No price history', 'لا يوجد سجل أسعار')}</p>
            ) : (
              [...product.priceHistory].reverse().map((entry, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{entry.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{entry.currency}</span></p>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                  {i === 0 && <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">{t('Latest', 'الأحدث')}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── QR Code Modal ───────────────────────────────────────────────────────────

const QrCodeModal = ({ product, onClose }: { product: StoreProduct; onClose: () => void }) => {
  const { t } = useLocale();
  const qrData = encodeURIComponent(`${product.nameEn} | SKU:${product.sku || product.id} | Price:${product.price} SAR`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${product.sku || product.id}.png`;
    a.click();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xs rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-bold text-foreground">{t('QR Code', 'رمز QR')}</h2>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div className="px-6 py-5 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">{t(product.nameEn, product.nameAr)}</p>
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-48 h-48 rounded-xl border border-border"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
            <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              <Download className="h-4 w-4" />
              {t('Download', 'تحميل')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Product Form Modal ───────────────────────────────────────────────────────

interface ProductFormModalProps {
  product: StoreProduct | null;
  onSave: (data: Omit<StoreProduct, 'id'>) => void;
  onClose: () => void;
}

const ProductFormModal = ({ product, onSave, onClose }: ProductFormModalProps) => {
  const { t } = useLocale();
  const [nameEn, setNameEn] = useState(product?.nameEn || '');
  const [nameAr, setNameAr] = useState(product?.nameAr || '');
  const [descEn, setDescEn] = useState(product?.descriptionEn || '');
  const [descAr, setDescAr] = useState(product?.descriptionAr || '');
  const [descEn2, setDescEn2] = useState(product?.descriptionEn2 || '');
  const [descAr2, setDescAr2] = useState(product?.descriptionAr2 || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || STORE_CATEGORIES[0]?.id || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [showDesc2, setShowDesc2] = useState(!!(product?.descriptionEn2));
  const [currencyPrices, setCurrencyPrices] = useState<CurrencyPrice[]>(
    product?.currencyPrices?.length ? product.currencyPrices : [{ currency: 'SAR', amount: product?.price || 0 }]
  );

  const selectedCat = STORE_CATEGORIES.find(c => c.id === categoryId);
  const sarPrice = currencyPrices.find(p => p.currency === 'SAR')?.amount || 0;

  const addCurrencyRow = () => {
    const used = new Set(currencyPrices.map(p => p.currency));
    const next = CURRENCIES.find(c => !used.has(c.code));
    if (next) setCurrencyPrices(prev => [...prev, { currency: next.code, amount: 0 }]);
  };

  const removeCurrencyRow = (idx: number) => {
    setCurrencyPrices(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCurrencyRow = (idx: number, field: 'currency' | 'amount', value: string | number) => {
    setCurrencyPrices(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = STORE_CATEGORIES.find(c => c.id === categoryId);
    const newEntry: PriceEntry = { currency: 'SAR', amount: sarPrice, date: todayDate() };
    const existingHistory = product?.priceHistory || [];
    const lastEntry = existingHistory[existingHistory.length - 1];
    const priceHistory = (lastEntry?.amount !== sarPrice || lastEntry?.currency !== 'SAR')
      ? [...existingHistory, newEntry]
      : existingHistory;

    onSave({
      nameEn, nameAr,
      descriptionEn: descEn, descriptionAr: descAr,
      descriptionEn2: descEn2 || undefined,
      descriptionAr2: descAr2 || undefined,
      images: product?.images || [],
      image: product?.image || '',
      price: sarPrice,
      currencyPrices,
      priceHistory,
      stock: parseInt(stock) || 0,
      categoryId,
      categoryEn: cat?.nameEn || '',
      categoryAr: cat?.nameAr || '',
      sku: sku || undefined,
      barcode: product?.barcode,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold text-foreground">
              {product ? t('Edit Product', 'تعديل المنتج') : t('Create Product', 'إنشاء منتج')}
            </h2>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Image upload */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
                <ImagePlus className="h-7 w-7 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">{t('Upload product image(s)', 'رفع صور المنتج (حتى 5 صور)')}</span>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Name (EN)', 'الاسم (إنجليزي)')}</label>
                <input required value={nameEn} onChange={e => setNameEn(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Name (AR)', 'الاسم (عربي)')}</label>
                <input required value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            {/* Description 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Description (EN)', 'الوصف (إنجليزي)')}</label>
                <textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Description (AR)', 'الوصف (عربي)')}</label>
                <textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={2} dir="rtl" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
            </div>

            {/* Description 2 toggle */}
            <button type="button" onClick={() => setShowDesc2(v => !v)} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              {showDesc2 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {t('Additional description', 'وصف إضافي')}
            </button>

            {showDesc2 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('Description 2 (EN)', 'الوصف 2 (إنجليزي)')}</label>
                  <textarea value={descEn2} onChange={e => setDescEn2(e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('Description 2 (AR)', 'الوصف 2 (عربي)')}</label>
                  <textarea value={descAr2} onChange={e => setDescAr2(e.target.value)} rows={2} dir="rtl" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
              </div>
            )}

            {/* Category, Stock, SKU */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Category', 'التصنيف')}</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {STORE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{t(c.nameEn, c.nameAr)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Stock', 'المخزون')}</label>
                <input required type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} placeholder={t('Optional', 'اختياري')} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            {/* Multi-currency prices */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">{t('Prices (Multi-currency)', 'الأسعار (متعدد العملات)')}</label>
                <button type="button" onClick={addCurrencyRow} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> {t('Add currency', 'إضافة عملة')}
                </button>
              </div>
              <div className="space-y-2">
                {currencyPrices.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={row.currency}
                      onChange={e => updateCurrencyRow(idx, 'currency', e.target.value)}
                      className="rounded-xl border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-40 shrink-0"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {t(c.nameEn, c.nameAr)}</option>
                      ))}
                    </select>
                    <input
                      type="number" min="0" step="0.01"
                      value={row.amount}
                      onChange={e => updateCurrencyRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {currencyPrices.length > 1 && (
                      <button type="button" onClick={() => removeCurrencyRow(idx)} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]">
              {product ? t('Save Changes', 'حفظ التغييرات') : t('Create Product', 'إنشاء المنتج')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default StoreOwnerProducts;









