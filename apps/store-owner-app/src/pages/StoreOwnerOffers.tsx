/*
 * ─── API: Store Owner — Offers / Discounts ───────────────────────────────────
 *
 * GET /api/store/offers?status=all|active|upcoming|ended
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Response value: Offer[]
 *   Offer: {
 *     id: string (GUID); nameEn: string; nameAr: string;
 *     type: 'product'|'category'|'segment';
 *     targetId: string; targetNameEn: string; targetNameAr: string;
 *     discountType: 'percent'|'fixed';
 *     discountValue: number;
 *     currency?: string;          // only if discountType === 'fixed'
 *     startDate: string (YYYY-MM-DD); endDate: string (YYYY-MM-DD);
 *     isActive: boolean;
 *   }
 *
 * POST /api/store/offers
 * DTO: Omit<Offer, 'id'>
 * Response value: Offer (newly created)
 *
 * PUT /api/store/offers/{id}
 * DTO: Partial<Omit<Offer, 'id'>>
 * Response value: Offer (updated)
 *
 * PATCH /api/store/offers/{id}/toggle
 * DTO: { isActive: boolean }
 * Response value: Offer (updated)
 *
 * DELETE /api/store/offers/{id}
 * Response value: null
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { STORE_OFFERS, Offer } from '~/entities/offer';
import { STORE_PRODUCTS } from '~/entities/product';
import { STORE_CATEGORIES } from '~/entities/category';
import { CURRENCIES } from '~/entities/currency';
import { todayDate } from '@/shared/lib/utils';

function offerStatus(offer: Offer): 'active' | 'upcoming' | 'ended' {
  const now = todayDate();
  if (!offer.isActive) return 'ended';
  if (offer.startDate > now) return 'upcoming';
  if (offer.endDate < now) return 'ended';
  return 'active';
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ended: 'bg-muted text-muted-foreground',
};

const SEGMENTS = [
  { id: 'vip', nameEn: 'VIP Members', nameAr: 'أعضاء VIP' },
  { id: 'new', nameEn: 'New Customers', nameAr: 'عملاء جدد' },
  { id: 'loyal', nameEn: 'Loyal Customers', nameAr: 'عملاء مخلصون' },
];

const StoreOwnerOffers = () => {
  const { t } = useLocale();
  const [offers, setOffers] = useState<Offer[]>(STORE_OFFERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const openCreate = () => { setEditingOffer(null); setModalOpen(true); };
  const openEdit = (o: Offer) => { setEditingOffer(o); setModalOpen(true); };
  const handleDelete = (id: string) => setOffers(prev => prev.filter(o => o.id !== id));
  const toggleActive = (id: string) => setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));

  const handleSave = (data: Omit<Offer, 'id'>) => {
    if (editingOffer) {
      setOffers(prev => prev.map(o => o.id === editingOffer.id ? { ...o, ...data } : o));
    } else {
      setOffers(prev => [...prev, { ...data, id: `off${Date.now()}` }]);
    }
    setModalOpen(false);
  };

  const filtered = useMemo(() => offers.filter(o => filterStatus === 'all' || offerStatus(o) === filterStatus), [offers, filterStatus]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Offers', 'إدارة العروض')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{offers.length} {t('offers', 'عرض')}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shrink-0">
          <Plus className="h-4 w-4" />
          {t('Add Offer', 'إضافة عرض')}
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'upcoming', 'ended'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}
          >
            {s === 'all' ? t('All', 'الكل') : s === 'active' ? t('Active', 'نشط') : s === 'upcoming' ? t('Upcoming', 'قادم') : t('Ended', 'منتهي')}
          </button>
        ))}
      </div>

      {/* Offers list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-muted-foreground text-sm">
            {t('No offers found', 'لم يتم العثور على عروض')}
          </div>
        )}
        {filtered.map(offer => {
          const status = offerStatus(offer);
          const typeLabels: Record<string, { en: string; ar: string }> = {
            product: { en: 'Product', ar: 'منتج' },
            category: { en: 'Category', ar: 'تصنيف' },
            segment: { en: 'Segment', ar: 'شريحة' },
          };
          return (
            <div key={offer.id} className="rounded-xl border border-border bg-card p-5 flex flex-wrap items-center gap-4 transition-shadow hover:shadow-md">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground">{t(offer.nameEn, offer.nameAr)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
                    {status === 'active' ? t('Active', 'نشط') : status === 'upcoming' ? t('Upcoming', 'قادم') : t('Ended', 'منتهي')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{t(typeLabels[offer.type].en, typeLabels[offer.type].ar)}: {t(offer.targetNameEn, offer.targetNameAr)}</span>
                  <span>
                    {offer.discountType === 'percent'
                      ? `${offer.discountValue}% ${t('off', 'خصم')}`
                      : `${offer.discountValue} ${offer.currency || 'SAR'} ${t('off', 'خصم')}`
                    }
                  </span>
                  <span>{offer.startDate} → {offer.endDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(offer.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${offer.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200' : 'border border-border text-muted-foreground hover:bg-accent'}`}
                >
                  {offer.isActive ? t('Enabled', 'مفعّل') : t('Disabled', 'معطّل')}
                </button>
                <button onClick={() => openEdit(offer)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(offer.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <OfferFormModal offer={editingOffer} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};

// ─── Offer Form Modal ─────────────────────────────────────────────────────────

interface OfferFormModalProps {
  offer: Offer | null;
  onSave: (data: Omit<Offer, 'id'>) => void;
  onClose: () => void;
}

const OfferFormModal = ({ offer, onSave, onClose }: OfferFormModalProps) => {
  const { t } = useLocale();
  const [nameEn, setNameEn] = useState(offer?.nameEn || '');
  const [nameAr, setNameAr] = useState(offer?.nameAr || '');
  const [type, setType] = useState<Offer['type']>(offer?.type || 'product');
  const [targetId, setTargetId] = useState(offer?.targetId || STORE_PRODUCTS[0]?.id || '');
  const [discountType, setDiscountType] = useState<Offer['discountType']>(offer?.discountType || 'percent');
  const [discountValue, setDiscountValue] = useState(offer?.discountValue?.toString() || '');
  const [currency, setCurrency] = useState(offer?.currency || 'SAR');
  const [startDate, setStartDate] = useState(offer?.startDate || todayDate());
  const [endDate, setEndDate] = useState(offer?.endDate || '');
  const [isActive, setIsActive] = useState(offer?.isActive ?? true);

  const targetOptions = type === 'product'
    ? STORE_PRODUCTS.map(p => ({ id: p.id, nameEn: p.nameEn, nameAr: p.nameAr }))
    : type === 'category'
      ? STORE_CATEGORIES.map(c => ({ id: c.id, nameEn: c.nameEn, nameAr: c.nameAr }))
      : SEGMENTS;

  const selectedTarget = targetOptions.find(o => o.id === targetId) || targetOptions[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = targetOptions.find(o => o.id === targetId) || targetOptions[0];
    onSave({
      nameEn, nameAr, type, targetId: target?.id || '',
      targetNameEn: target?.nameEn || '',
      targetNameAr: target?.nameAr || '',
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      currency: discountType === 'fixed' ? currency : undefined,
      startDate, endDate, isActive,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold text-foreground">
              {offer ? t('Edit Offer', 'تعديل العرض') : t('Create Offer', 'إنشاء عرض')}
            </h2>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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

            {/* Offer type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('Offer applies to', 'العرض ينطبق على')}</label>
              <div className="flex gap-2">
                {(['product', 'category', 'segment'] as const).map(tp => (
                  <button key={tp} type="button" onClick={() => { setType(tp); setTargetId(''); }}
                    className={`flex-1 rounded-xl border-2 py-2 text-sm font-medium transition-colors ${type === tp ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {tp === 'product' ? t('Product', 'منتج') : tp === 'category' ? t('Category', 'تصنيف') : t('Segment', 'شريحة')}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('Target', 'الهدف')}</label>
              <select value={targetId || selectedTarget?.id} onChange={e => setTargetId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {targetOptions.map(o => <option key={o.id} value={o.id}>{t(o.nameEn, o.nameAr)}</option>)}
              </select>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('Discount', 'الخصم')}</label>
              <div className="flex gap-2 mb-3">
                {(['percent', 'fixed'] as const).map(dt => (
                  <button key={dt} type="button" onClick={() => setDiscountType(dt)}
                    className={`flex-1 rounded-xl border-2 py-2 text-sm font-medium transition-colors ${discountType === dt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {dt === 'percent' ? t('Percentage %', 'نسبة مئوية %') : t('Fixed Amount', 'مبلغ ثابت')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input required type="number" min="0" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '10' : '50'}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                {discountType === 'fixed' && (
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('Start Date', 'تاريخ البداية')}</label>
                <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('End Date', 'تاريخ النهاية')}</label>
                <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                <div className={`w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-foreground">{t('Active', 'نشط')}</span>
            </label>

            <button type="submit" className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]">
              {offer ? t('Save Changes', 'حفظ التغييرات') : t('Create Offer', 'إنشاء العرض')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default StoreOwnerOffers;









