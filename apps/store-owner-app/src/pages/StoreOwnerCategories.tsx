/*
 * ─── API: Store Owner — Categories ──────────────────────────────────────────
 *
 * GET /api/store/categories
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Response value: Category[]
 *   Category: { id: string (GUID); nameEn: string; nameAr: string; iconOrEmoji: string; productsCount: number }
 *
 * POST /api/store/categories
 * DTO: { nameEn: string; nameAr: string; iconOrEmoji: string }
 * Response value: Category (newly created)
 *
 * PUT /api/store/categories/{id}
 * DTO: { nameEn?: string; nameAr?: string; iconOrEmoji?: string }
 * Response value: Category (updated)
 *
 * DELETE /api/store/categories/{id}
 * Query param: ?force=true  (to unlink products instead of rejecting)
 * Response value: null
 *   Failure if products still linked and force=false:
 *     topError: { code: "CATEGORY_HAS_PRODUCTS", httpStatus: 409 }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, ShieldCheck, Store } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { STORE_CATEGORIES, StoreCategory } from '~/entities/category';
import { STORE_PRODUCTS } from '~/entities/product';

// ─── Platform-level categories (managed by the platform admin, read-only for store owners) ──

const PLATFORM_CATEGORIES = [
  { id: 'pc-electronics', nameEn: 'Electronics', nameAr: 'إلكترونيات', emoji: '⚡' },
  { id: 'pc-accessories', nameEn: 'Accessories', nameAr: 'إكسسوارات', emoji: '💎' },
  { id: 'pc-watches', nameEn: 'Watches', nameAr: 'ساعات', emoji: '⌚' },
  { id: 'pc-shoes', nameEn: 'Shoes', nameAr: 'أحذية', emoji: '👟' },
  { id: 'pc-perfumes', nameEn: 'Perfumes', nameAr: 'عطور', emoji: '🌸' },
  { id: 'pc-fashion', nameEn: 'Fashion', nameAr: 'أزياء', emoji: '👗' },
] as const;

const EMOJI_OPTIONS = ['📱', '👜', '⌚', '👟', '🌹', '👗', '🍔', '📚', '🏠', '🎮', '🧴', '💍', '🎒', '🖥️', '🛒'];

const StoreOwnerCategories = () => {
  const { t } = useLocale();
  const [categories, setCategories] = useState<StoreCategory[]>(STORE_CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<StoreCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StoreCategory | null>(null);

  const openCreate = () => { setEditingCat(null); setModalOpen(true); };
  const openEdit = (c: StoreCategory) => { setEditingCat(c); setModalOpen(true); };

  const handleDelete = (cat: StoreCategory) => {
    const linked = STORE_PRODUCTS.filter(p => p.categoryId === cat.id).length;
    if (linked > 0) { setDeleteConfirm(cat); return; }
    setCategories(prev => prev.filter(c => c.id !== cat.id));
  };

  const forceDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  };

  const handleSave = (data: Omit<StoreCategory, 'id' | 'productsCount'>) => {
    if (editingCat) {
      setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, ...data } : c));
    } else {
      const newCat: StoreCategory = { ...data, id: `cat${Date.now()}`, productsCount: 0 };
      setCategories(prev => [...prev, newCat]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Categories', 'إدارة التصنيفات')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t(
              'Manage your store-specific categories. Platform categories are shown below for reference.',
              'أدر تصنيفات متجرك الخاصة. التصنيفات العامة للمنصة معروضة أدناه للمرجعية.'
            )}
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shrink-0">
          <Plus className="h-4 w-4" />
          {t('Add Category', 'إضافة تصنيف')}
        </button>
      </div>

      {/* ── Store-Specific Categories (managed by store owner) ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            {t('Your Store Categories', 'تصنيفات متجرك الخاصة')}
          </h2>
          <span className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {t('Managed by you', 'يديرها المتجر')}
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t(
            'These categories are unique to your store. Customers can filter your products by these categories on your store page.',
            'هذه التصنيفات حصرية لمتجرك. يمكن للعملاء تصفية منتجاتك حسبها في صفحة متجرك.'
          )}
        </p>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-14 text-center">
            <Store className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">{t('No store categories yet', 'لا توجد تصنيفات خاصة بعد')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('Add your first category to help customers navigate your products.', 'أضف أول تصنيف لمساعدة العملاء في تصفح منتجاتك.')}</p>
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 rounded-xl gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" />
              {t('Add Category', 'إضافة تصنيف')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const productCount = STORE_PRODUCTS.filter(p => p.categoryId === cat.id).length;
              return (
                <div key={cat.id} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 transition-shadow hover:shadow-md group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl shrink-0">
                    {cat.iconOrEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{t(cat.nameEn, cat.nameAr)}</p>
                    <p className="text-xs text-muted-foreground">{productCount} {t('products', 'منتج')}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Platform Categories (managed by platform admin, read-only) ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">
            {t('Platform Categories', 'التصنيفات العامة للمنصة')}
          </h2>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {t('Managed by admin', 'يديرها المدير')}
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t(
            'These are the top-level categories set by the platform administrator. Your store is listed under one of these. You cannot modify them.',
            'هذه التصنيفات العليا التي يحددها مدير المنصة. متجرك مُدرج ضمن إحداها. لا يمكنك تعديلها.'
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORM_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center opacity-70"
              title={t('Read-only — managed by platform admin', 'للقراءة فقط — يديرها مدير المنصة')}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <p className="text-xs font-medium text-muted-foreground leading-tight">
                {t(cat.nameEn, cat.nameAr)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Category Form Modal */}
      {modalOpen && (
        <CategoryFormModal
          category={editingCat}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-base font-bold text-foreground">{t('Delete Category?', 'حذف التصنيف؟')}</h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  `"${deleteConfirm.nameEn}" has ${STORE_PRODUCTS.filter(p => p.categoryId === deleteConfirm.id).length} linked products. Deleting it will unlink them.`,
                  `"${deleteConfirm.nameAr}" يحتوي على ${STORE_PRODUCTS.filter(p => p.categoryId === deleteConfirm.id).length} منتجات مرتبطة. حذفه سيفك ارتباط المنتجات.`
                )}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
                  {t('Cancel', 'إلغاء')}
                </button>
                <button onClick={() => forceDelete(deleteConfirm.id)} className="flex-1 rounded-xl bg-destructive py-2 text-sm font-bold text-destructive-foreground hover:opacity-90 transition-opacity">
                  {t('Delete Anyway', 'حذف رغم ذلك')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Category Form Modal ─────────────────────────────────────────────────────

interface CategoryFormModalProps {
  category: StoreCategory | null;
  onSave: (data: Omit<StoreCategory, 'id' | 'productsCount'>) => void;
  onClose: () => void;
}

const CategoryFormModal = ({ category, onSave, onClose }: CategoryFormModalProps) => {
  const { t } = useLocale();
  const [nameEn, setNameEn] = useState(category?.nameEn || '');
  const [nameAr, setNameAr] = useState(category?.nameAr || '');
  const [emoji, setEmoji] = useState(category?.iconOrEmoji || '📦');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nameEn, nameAr, iconOrEmoji: emoji });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {category ? t('Edit Store Category', 'تعديل التصنيف') : t('Create Store Category', 'إنشاء تصنيف')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('Store-specific category — visible only in your store', 'تصنيف خاص بمتجرك — يظهر فقط في صفحة متجرك')}
              </p>
            </div>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Emoji picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('Icon', 'الأيقونة')}</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em} type="button" onClick={() => setEmoji(em)}
                    className={`h-10 w-10 flex items-center justify-center text-xl rounded-xl border-2 transition-colors ${emoji === em ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
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
            <button type="submit" className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]">
              {category ? t('Save Changes', 'حفظ التغييرات') : t('Create Category', 'إنشاء التصنيف')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default StoreOwnerCategories;










