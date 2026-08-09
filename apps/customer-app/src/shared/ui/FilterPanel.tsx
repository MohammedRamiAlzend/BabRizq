import { memo, useCallback, useState } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Star,
  ArrowUpDown,
  Tag,
  ShoppingBag,
  Percent,
  Sparkles,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';

// ─── Public types ─────────────────────────────────────────────────────────────

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  selectedCategories: string[];
  selectedStores: string[];
  onlyDiscounted: boolean;
  onlyNew: boolean;
  minRating: number; // 0 = any, 3 = 3+, 4 = 4+, 4.5 = 4.5+
  sortBy: SortOption;
}

export function makeDefaultFilters(min: number, max: number): FilterState {
  return {
    priceMin: min,
    priceMax: max,
    selectedCategories: [],
    selectedStores: [],
    onlyDiscounted: false,
    onlyNew: false,
    minRating: 0,
    sortBy: 'default',
  };
}

export interface CategoryOption {
  en: string;
  ar: string;
  /** True when the category contains at least one discounted product */
  hasDeals?: boolean;
}

export interface StoreOption {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  /** True when the store has at least one discounted product */
  hasDeals?: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  absoluteMin: number;
  absoluteMax: number;
  categories?: CategoryOption[];
  stores?: StoreOption[];
  onFiltersChange: (next: FilterState) => void;
  resultCount: number;
}

// ─── Internal sub-components ──────────────────────────────────────────────────

interface PriceInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}

const PriceInput = memo(function PriceInput({
  label,
  value,
  onChange,
  min,
  max,
}: PriceInputProps) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{t('SAR', 'ر.س')}</span>
      </div>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

const FilterPanel = ({
  filters,
  absoluteMin,
  absoluteMax,
  categories,
  stores,
  onFiltersChange,
  resultCount,
}: FilterPanelProps) => {
  const { t, lang } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── active filter count ────────────────────────────────────────────────────
  const activeFilterCount =
    (filters.priceMin !== absoluteMin || filters.priceMax !== absoluteMax ? 1 : 0) +
    filters.selectedCategories.length +
    filters.selectedStores.length +
    (filters.onlyDiscounted ? 1 : 0) +
    (filters.onlyNew ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.sortBy !== 'default' ? 1 : 0);

  const isDefault = activeFilterCount === 0;

  // ── handlers ───────────────────────────────────────────────────────────────
  const handlePriceMin = useCallback(
    (v: number) => onFiltersChange({ ...filters, priceMin: Math.min(v, filters.priceMax) }),
    [filters, onFiltersChange]
  );
  const handlePriceMax = useCallback(
    (v: number) => onFiltersChange({ ...filters, priceMax: Math.max(v, filters.priceMin) }),
    [filters, onFiltersChange]
  );
  const handleCategoryToggle = useCallback(
    (catEn: string) => {
      const next = filters.selectedCategories.includes(catEn)
        ? filters.selectedCategories.filter(c => c !== catEn)
        : [...filters.selectedCategories, catEn];
      onFiltersChange({ ...filters, selectedCategories: next });
    },
    [filters, onFiltersChange]
  );
  const handleStoreToggle = useCallback(
    (storeId: string) => {
      const next = filters.selectedStores.includes(storeId)
        ? filters.selectedStores.filter(s => s !== storeId)
        : [...filters.selectedStores, storeId];
      onFiltersChange({ ...filters, selectedStores: next });
    },
    [filters, onFiltersChange]
  );
  const handleReset = useCallback(() => {
    onFiltersChange(makeDefaultFilters(absoluteMin, absoluteMax));
  }, [absoluteMin, absoluteMax, onFiltersChange]);

  const sortOptions: { value: SortOption; en: string; ar: string }[] = [
    { value: 'default', en: 'Default', ar: 'الافتراضي' },
    { value: 'price-asc', en: 'Price: Low → High', ar: 'السعر: من الأقل' },
    { value: 'price-desc', en: 'Price: High → Low', ar: 'السعر: من الأعلى' },
    { value: 'rating', en: 'Top Rated', ar: 'الأعلى تقييماً' },
    { value: 'newest', en: 'New Arrivals First', ar: 'الأحدث أولاً' },
  ];

  const ratingOptions: { value: number; en: string; ar: string }[] = [
    { value: 0, en: 'Any', ar: 'الكل' },
    { value: 3, en: '3+ ★', ar: '3+ ★' },
    { value: 4, en: '4+ ★', ar: '4+ ★' },
    { value: 4.5, en: '4.5+ ★', ar: '4.5+ ★' },
  ];

  // ── Panel body shared between mobile sheet & desktop sidebar ──────────────
  const panelBody = (
    <div className="space-y-0">

      {/* ── Sort ── */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold text-foreground">{t('Sort By', 'ترتيب حسب')}</h3>
        </div>
        <div className="flex flex-col gap-1">
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, sortBy: opt.value })}
              className={[
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                filters.sortBy === opt.value
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:bg-accent',
              ].join(' ')}
            >
              {lang === 'ar' ? opt.ar : opt.en}
              {filters.sortBy === opt.value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="my-4 h-px bg-border" />

      {/* ── Price Range ── */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Tag className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold text-foreground">{t('Price Range', 'نطاق السعر')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PriceInput
            label={t('From', 'من')}
            value={filters.priceMin}
            onChange={handlePriceMin}
            min={absoluteMin}
            max={filters.priceMax}
          />
          <PriceInput
            label={t('To', 'إلى')}
            value={filters.priceMax}
            onChange={handlePriceMax}
            min={filters.priceMin}
            max={absoluteMax}
          />
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{
              marginInlineStart: `${((filters.priceMin - absoluteMin) / Math.max(absoluteMax - absoluteMin, 1)) * 100}%`,
              width: `${((filters.priceMax - filters.priceMin) / Math.max(absoluteMax - absoluteMin, 1)) * 100}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{absoluteMin} {t('SAR', 'ر.س')}</span>
          <span>{absoluteMax} {t('SAR', 'ر.س')}</span>
        </div>
      </div>

      {/* ── Stores ── */}
      {stores && stores.length > 0 && (
        <>
          <div className="my-4 h-px bg-border" />
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShoppingBag className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">{t('Stores', 'المتاجر')}</h3>
            </div>
            <div className="space-y-1">
              {stores.map(store => {
                const checked = filters.selectedStores.includes(store.id);
                return (
                  <label
                    key={store.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleStoreToggle(store.id)}
                      className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                    />
                    <span className="text-base leading-none">{store.emoji}</span>
                    <span className="flex-1 text-sm text-foreground">
                      {lang === 'ar' ? store.nameAr : store.nameEn}
                    </span>
                    {store.hasDeals && (
                      <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                        {t('Sale', 'خصم')}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {filters.selectedStores.length > 0 && (
              <button
                onClick={() => onFiltersChange({ ...filters, selectedStores: [] })}
                className="mt-1.5 text-[11px] text-primary hover:underline"
              >
                {t('Clear store selection', 'إلغاء اختيار المتاجر')}
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Categories ── */}
      {categories && categories.length > 0 && (
        <>
          <div className="my-4 h-px bg-border" />
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <LayoutGrid className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">{t('Categories', 'التصنيفات')}</h3>
            </div>
            <div className="space-y-1">
              {categories.map(cat => {
                const checked = filters.selectedCategories.includes(cat.en);
                return (
                  <label
                    key={cat.en}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCategoryToggle(cat.en)}
                      className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                    />
                    <span className="flex-1 text-sm text-foreground">{t(cat.en, cat.ar)}</span>
                    {cat.hasDeals && (
                      <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                        {t('Sale', 'خصم')}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {filters.selectedCategories.length > 0 && (
              <button
                onClick={() => onFiltersChange({ ...filters, selectedCategories: [] })}
                className="mt-1.5 text-[11px] text-primary hover:underline"
              >
                {t('Clear category selection', 'إلغاء اختيار التصنيفات')}
              </button>
            )}
          </div>
        </>
      )}

      <div className="my-4 h-px bg-border" />

      {/* ── Special Toggles ── */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Percent className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold text-foreground">{t('Special Filters', 'فلاتر خاصة')}</h3>
        </div>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="text-sm font-medium text-foreground">{t('On Sale', 'عروض وتخفيضات')}</span>
            </div>
            <input
              type="checkbox"
              checked={filters.onlyDiscounted}
              onChange={e => onFiltersChange({ ...filters, onlyDiscounted: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="text-sm font-medium text-foreground">{t('New Arrivals', 'وصل حديثاً')}</span>
            </div>
            <input
              type="checkbox"
              checked={filters.onlyNew}
              onChange={e => onFiltersChange({ ...filters, onlyNew: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="my-4 h-px bg-border" />

      {/* ── Min Rating ── */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Star className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold text-foreground">{t('Minimum Rating', 'أدنى تقييم')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, minRating: opt.value })}
              className={[
                'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                filters.minRating === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              ].join(' ')}
            >
              {lang === 'ar' ? opt.ar : opt.en}
            </button>
          ))}
        </div>
      </div>

      {/* ── Reset ── */}
      {!isDefault && (
        <>
          <div className="my-4 h-px bg-border" />
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('Reset all filters', 'إعادة تعيين جميع الفلاتر')}
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile trigger button ──────────────────────────────────────── */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className={[
            'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
            activeFilterCount > 0
              ? 'border-primary/50 bg-primary/5 text-primary'
              : 'border-border bg-card text-foreground',
          ].join(' ')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('Advanced Search', 'بحث متقدم')}
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full gradient-gold px-1 text-[11px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile bottom-sheet ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl bg-card">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <span className="text-base font-bold text-foreground">
                  {t('Advanced Search', 'بحث متقدم')}
                </span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full gradient-gold px-1 text-[11px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panelBody}
            </div>
            {/* Footer */}
            <div className="flex shrink-0 gap-3 border-t border-border px-5 py-4">
              {!isDefault && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('Reset', 'إعادة تعيين')}
                </button>
              )}
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl gradient-gold py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
              >
                {t(`Show ${resultCount} products`, `عرض ${resultCount} منتج`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {t('Advanced Search', 'بحث متقدم')}
            </span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full gradient-gold px-1 text-[11px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
          {panelBody}
          <p className="mt-3 border-t border-border pt-3 text-center text-[11px] text-muted-foreground">
            {resultCount} {t('products match', 'منتج متطابق')}
          </p>
        </div>
      </aside>
    </>
  );
};

export default FilterPanel;










