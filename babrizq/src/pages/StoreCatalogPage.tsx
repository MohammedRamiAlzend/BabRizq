import { useState, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LayoutGrid, ShoppingBag, Tag } from 'lucide-react';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { MOCK_PRODUCTS, MOCK_STORES, STORE_SPECIFIC_CATEGORIES, STORE_ADS } from '~/entities/products';
import { useInterests } from '@/shared/hooks/useInterests';
import StorefrontHeader from '@/shared/ui/StorefrontHeader';
import ProductCard from '@/shared/ui/ProductCard';
import CartDrawer from '@/shared/ui/CartDrawer';
import CheckoutModal from '@/shared/ui/CheckoutModal';
import ScrollToTopButton from '@/shared/ui/ScrollToTopButton';
import AdCarousel from '@/shared/ui/AdCarousel';

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SimilarStoreCardProps {
  emoji: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  productCount: number;
  lang: 'en' | 'ar';
  onClick: () => void;
}

const SimilarStoreCard = memo(function SimilarStoreCard({
  emoji,
  nameEn,
  nameAr,
  descriptionEn,
  descriptionAr,
  productCount,
  lang,
  onClick,
}: SimilarStoreCardProps) {
  const name = lang === 'ar' ? nameAr : nameEn;
  const description = lang === 'ar' ? descriptionAr : descriptionEn;
  const productsLabel = lang === 'ar' ? `${productCount} منتج` : `${productCount} products`;

  return (
    <button
      onClick={onClick}
      className="flex shrink-0 w-52 flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-start transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <span className="text-4xl leading-none">{emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <span className="text-xs font-medium text-primary">{productsLabel}</span>
    </button>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────

const StoreCatalogPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, lang, dir } = useLocale();
  const { trackInterest } = useInterests();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreCatId, setSelectedStoreCatId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const store = useMemo(
    () => MOCK_STORES.find(s => s.id === storeId) ?? null,
    [storeId]
  );

  // Store-specific categories for this store
  const storeCategories = useMemo(
    () => (storeId ? STORE_SPECIFIC_CATEGORIES[storeId] ?? [] : []),
    [storeId]
  );

  // All products for this store (for the count badge in the hero)
  const allStoreProducts = useMemo(
    () => MOCK_PRODUCTS.filter(p => p.storeId === storeId),
    [storeId]
  );

  // Products after search + store-category filter
  const storeProducts = useMemo(
    () =>
      allStoreProducts.filter(p => {
        const matchesSearch =
          searchQuery === '' ||
          p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nameAr.includes(searchQuery);
        const matchesStoreCat =
          selectedStoreCatId === null || p.storeCategoryId === selectedStoreCatId;
        return matchesSearch && matchesStoreCat;
      }),
    [allStoreProducts, searchQuery, selectedStoreCatId]
  );

  // Count per store-specific category (for the chip badges)
  const catProductCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allStoreProducts) {
      counts[p.storeCategoryId] = (counts[p.storeCategoryId] ?? 0) + 1;
    }
    return counts;
  }, [allStoreProducts]);

  // Stores in the same platform category (excluding the current one)
  const similarStores = useMemo(
    () =>
      store
        ? MOCK_STORES.filter(s => s.categoryEn === store.categoryEn && s.id !== store.id)
        : [],
    [store]
  );

  // Products from the same platform category but other stores
  const moreCategoryProducts = useMemo(
    () =>
      store
        ? MOCK_PRODUCTS.filter(
          p => p.categoryEn === store.categoryEn && p.storeId !== storeId
        ).slice(0, 8)
        : [],
    [store, storeId]
  );

  const storeProductCount = useCallback(
    (sid: string) => MOCK_PRODUCTS.filter(p => p.storeId === sid).length,
    []
  );

  const handleProductInterest = useCallback(
    (category: string) => trackInterest(category),
    [trackInterest]
  );

  const handleCartOpen = useCallback(() => setCartOpen(true), []);
  const handleCartClose = useCallback(() => setCartOpen(false), []);
  const handleCheckoutOpen = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);
  const handleCheckoutClose = useCallback(() => setCheckoutOpen(false), []);

  const handleBack = useCallback(() => navigate('/store'), [navigate]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // Active store-category name for the section header
  const activeCatName = useMemo(() => {
    if (!selectedStoreCatId) return null;
    const cat = storeCategories.find(c => c.id === selectedStoreCatId);
    if (!cat) return null;
    return lang === 'ar' ? cat.nameAr : cat.nameEn;
  }, [selectedStoreCatId, storeCategories, lang]);

  if (!isAuthenticated || !user || user.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  if (!store) {
    return <Navigate to="/store" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        onCartOpen={handleCartOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container px-4 py-6 space-y-10">
        {/* ── Breadcrumb ── */}
        <nav aria-label={t('Breadcrumb', 'مسار التنقل')}>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon className="h-4 w-4" />
            {t('All Stores', 'جميع المتاجر')}
          </button>
        </nav>

        {/* ── Store Hero ── */}
        <section
          aria-label={t('Store info', 'معلومات المتجر')}
          className="relative overflow-hidden rounded-3xl gradient-hero px-8 py-10 md:px-14 md:py-14"
        >
          <div className="pointer-events-none absolute -top-12 -end-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-5">
            <span
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-5xl backdrop-blur-sm"
              role="img"
              aria-label={t(store.nameEn, store.nameAr)}
            >
              {store.emoji}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-primary-foreground md:text-3xl">
                {t(store.nameEn, store.nameAr)}
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/70 md:text-base">
                {t(store.descriptionEn, store.descriptionAr)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Platform category badge */}
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {t(store.categoryEn, store.categoryAr)}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80">
                  {allStoreProducts.length} {t('products', 'منتجات')}
                </span>
                {storeCategories.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80">
                    <Tag className="h-3 w-3" />
                    {storeCategories.length} {t('categories', 'تصنيفات')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Store Ad Carousel ── */}
        {(STORE_ADS[storeId ?? ''] ?? []).length > 0 && (
          <section aria-label={t('Store promotions', 'عروض المتجر')}>
            <AdCarousel ads={STORE_ADS[storeId ?? '']} />
          </section>
        )}

        {/* ── Store-Specific Category Filter Chips ── */}
        {storeCategories.length > 0 && (
          <section aria-label={t('Store categories', 'تصنيفات المتجر')}>
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {t("Store's Categories", 'تصنيفات المتجر')}
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                {t('by store owner', 'يديرها المتجر')}
              </span>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t('Filter by store category', 'فلترة حسب تصنيف المتجر')}
            >
              {/* "All" chip */}
              <button
                onClick={() => setSelectedStoreCatId(null)}
                aria-pressed={selectedStoreCatId === null}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200',
                  selectedStoreCatId === null
                    ? 'border-primary/50 gradient-gold text-primary-foreground shadow-md shadow-primary/20'
                    : 'border-border bg-card text-foreground hover:border-primary/30 hover:shadow-sm',
                ].join(' ')}
              >
                {t('All', 'الكل')}
                <span className="rounded-full bg-current/15 px-1.5 py-0.5 text-[11px]">
                  {allStoreProducts.length}
                </span>
              </button>

              {storeCategories.map(cat => {
                const active = selectedStoreCatId === cat.id;
                const count = catProductCount[cat.id] ?? 0;
                const name = lang === 'ar' ? cat.nameAr : cat.nameEn;
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setSelectedStoreCatId(prev => (prev === cat.id ? null : cat.id))
                    }
                    aria-pressed={active}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200',
                      active
                        ? 'border-primary/50 gradient-gold text-primary-foreground shadow-md shadow-primary/20'
                        : 'border-border bg-card text-foreground hover:border-primary/30 hover:shadow-sm',
                    ].join(' ')}
                  >
                    <span>{cat.emoji}</span>
                    {name}
                    <span
                      className={[
                        'rounded-full px-1.5 py-0.5 text-[11px]',
                        active ? 'bg-white/20' : 'bg-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Store Products Grid ── */}
        <section aria-label={t('Store products', 'منتجات المتجر')}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
                <LayoutGrid className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {activeCatName
                    ? activeCatName
                    : t('All Products', 'جميع المنتجات')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {storeProducts.length}{' '}
                  {t(
                    `${storeProducts.length === 1 ? 'product' : 'products'} found`,
                    'منتج متوفر'
                  )}
                </p>
              </div>
            </div>
            {selectedStoreCatId && (
              <button
                onClick={() => setSelectedStoreCatId(null)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('Show all', 'عرض الكل')}
              </button>
            )}
          </div>

          {storeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
              <ShoppingBag className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-base font-semibold text-foreground">
                {t('No products found', 'لم يتم العثور على منتجات')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('Try a different search term or category.', 'جرب كلمة بحث أو تصنيفاً مختلفاً.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {storeProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onInterest={handleProductInterest}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Similar Stores ── */}
        {similarStores.length > 0 && (
          <section aria-label={t('Similar stores', 'متاجر مشابهة')}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
                <ShoppingBag className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {t('Similar Stores', 'متاجر مشابهة')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    `More stores in ${store.categoryEn}`,
                    `متاجر أخرى في ${store.categoryAr}`
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {similarStores.map(s => (
                <SimilarStoreCard
                  key={s.id}
                  emoji={s.emoji}
                  nameEn={s.nameEn}
                  nameAr={s.nameAr}
                  descriptionEn={s.descriptionEn}
                  descriptionAr={s.descriptionAr}
                  productCount={storeProductCount(s.id)}
                  lang={lang}
                  onClick={() => navigate(`/store/s/${s.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── More in this Platform Category ── */}
        {moreCategoryProducts.length > 0 && (
          <section aria-label={t('More in category', 'المزيد في التصنيف')}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
                  <LayoutGrid className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">
                    {t(`More in ${store.categoryEn}`, `المزيد في ${store.categoryAr}`)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('From other stores', 'من متاجر أخرى')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/store/c/${store.categoryEn}`)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('See all', 'عرض الكل')}
                {dir === 'rtl' ? (
                  <ArrowLeft className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {moreCategoryProducts.map(product => (
                <div key={product.id} className="w-52 shrink-0 sm:w-60">
                  <ProductCard product={product} onInterest={handleProductInterest} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <CartDrawer open={cartOpen} onClose={handleCartClose} onCheckout={handleCheckoutOpen} />
      <CheckoutModal open={checkoutOpen} onClose={handleCheckoutClose} />
      <ScrollToTopButton />
    </div>
  );
};

export default StoreCatalogPage;










