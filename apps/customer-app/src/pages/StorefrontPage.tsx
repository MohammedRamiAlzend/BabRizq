import { useState, useMemo, useCallback, memo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LayoutGrid, Zap, Gem, Clock, Footprints, Flower2, Shirt, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { MOCK_PRODUCTS } from '~/entities/product';
import { MOCK_STORES } from '~/entities/store';
import { useInterests } from '@/shared/hooks/useInterests';
import StorefrontHeader from '@/shared/ui/StorefrontHeader';
import ProductCard from '@/shared/ui/ProductCard';
import StoreCard from '@/shared/ui/StoreCard';
import CategoryTile from '@/shared/ui/CategoryTile';
import CartDrawer from '@/shared/ui/CartDrawer';
import CheckoutModal from '@/shared/ui/CheckoutModal';
import AdCarousel from '@/shared/ui/AdCarousel';
import FilterPanel, { FilterState, makeDefaultFilters, CategoryOption, StoreOption } from '@/shared/ui/FilterPanel';
import ScrollToTopButton from '@/shared/ui/ScrollToTopButton';

// ─── Static data (hoisted outside component to avoid re-creation) ─────────────

const CATEGORIES = [
  { en: 'All', ar: 'الكل', icon: LayoutGrid, color: 'bg-primary/10 text-primary' },
  { en: 'Electronics', ar: 'إلكترونيات', icon: Zap, color: 'bg-blue-500/10 text-blue-500' },
  { en: 'Accessories', ar: 'إكسسوارات', icon: Gem, color: 'bg-purple-500/10 text-purple-500' },
  { en: 'Watches', ar: 'ساعات', icon: Clock, color: 'bg-amber-500/10 text-amber-500' },
  { en: 'Shoes', ar: 'أحذية', icon: Footprints, color: 'bg-green-500/10 text-green-500' },
  { en: 'Perfumes', ar: 'عطور', icon: Flower2, color: 'bg-pink-500/10 text-pink-500' },
  { en: 'Fashion', ar: 'أزياء', icon: Shirt, color: 'bg-orange-500/10 text-orange-500' },
] as const;

// Absolute price bounds (computed once at module load, not inside component)
const ALL_PRICES = MOCK_PRODUCTS.map(p => p.price);
const ABSOLUTE_MIN = Math.min(...ALL_PRICES);
const ABSOLUTE_MAX = Math.max(...ALL_PRICES);

// Filter store/category options with deal badges
const FILTER_STORES: StoreOption[] = MOCK_STORES.map(s => ({
  id: s.id,
  nameEn: s.nameEn,
  nameAr: s.nameAr,
  emoji: s.emoji,
  hasDeals: MOCK_PRODUCTS.some(p => p.storeId === s.id && p.originalPrice !== undefined),
}));

const FILTER_CATEGORIES: CategoryOption[] = [
  { en: 'Electronics', ar: 'إلكترونيات', hasDeals: MOCK_PRODUCTS.some(p => p.categoryEn === 'Electronics' && p.originalPrice !== undefined) },
  { en: 'Accessories', ar: 'إكسسوارات', hasDeals: MOCK_PRODUCTS.some(p => p.categoryEn === 'Accessories' && p.originalPrice !== undefined) },
  { en: 'Watches', ar: 'ساعات', hasDeals: MOCK_PRODUCTS.some(p => p.categoryEn === 'Watches' && p.originalPrice !== undefined) },
  { en: 'Shoes', ar: 'أحذية', hasDeals: MOCK_PRODUCTS.some(p => p.categoryEn === 'Shoes' && p.originalPrice !== undefined) },
  { en: 'Perfumes', ar: 'عطور', hasDeals: MOCK_PRODUCTS.some(p => p.categoryEn === 'Perfumes' && p.originalPrice !== undefined) },
  { en: 'Fashion', ar: 'أزياء', hasDeals: MOCK_PRODUCTS.some(p => p.categoryEn === 'Fashion' && p.originalPrice !== undefined) },
];

// ─── Sub-components (top-level, never inline) ─────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  lang: 'en' | 'ar';
  onClear?: () => void;
  clearLabelEn?: string;
  clearLabelAr?: string;
}

const SectionHeader = memo(function SectionHeader({
  icon,
  titleEn,
  titleAr,
  subtitleEn,
  subtitleAr,
  lang,
  onClear,
  clearLabelEn,
  clearLabelAr,
}: SectionHeaderProps) {
  const title = lang === 'ar' ? titleAr : titleEn;
  const subtitle = lang === 'ar' ? subtitleAr : subtitleEn;
  const clearLabel = lang === 'ar' ? clearLabelAr : clearLabelEn;

  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {clearLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────

const StorefrontPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, lang } = useLocale();
  const { interests, trackInterest } = useInterests();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => makeDefaultFilters(ABSOLUTE_MIN, ABSOLUTE_MAX));

  // Derived: product count per store (for store cards)
  const storeProductCount = useMemo(
    () =>
      MOCK_STORES.reduce<Record<string, number>>((acc, store) => {
        acc[store.id] = MOCK_PRODUCTS.filter(p => p.storeId === store.id).length;
        return acc;
      }, {}),
    []
  );

  // Derived: products filtered by search + advanced filters + sort
  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS.filter(p => {
      // text search
      if (
        searchQuery !== '' &&
        !p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.nameAr.includes(searchQuery)
      ) return false;
      // price range
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
      // selected stores
      if (filters.selectedStores.length > 0 && !filters.selectedStores.includes(p.storeId)) return false;
      // selected categories
      if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(p.categoryEn)) return false;
      // on sale
      if (filters.onlyDiscounted && !p.originalPrice) return false;
      // new arrivals
      if (filters.onlyNew && !p.isNew) return false;
      // min rating
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      return true;
    });

    // sort
    switch (filters.sortBy) {
      case 'price-asc': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'rating': result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'newest': result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
    return result;
  }, [searchQuery, filters]);

  // Derived: personalized products based on top 3 tracked categories
  const forYouProducts = useMemo(() => {
    if (interests.length === 0) return [];
    const topCategories = interests.slice(0, 3);
    return MOCK_PRODUCTS.filter(p => topCategories.includes(p.categoryEn)).slice(0, 8);
  }, [interests]);

  // Derived: featured/deal products
  const featuredProducts = useMemo(
    () => MOCK_PRODUCTS.filter(p => p.isFeatured || p.originalPrice),
    []
  );

  // Handlers (stable references via useCallback)
  const handleCartOpen = useCallback(() => setCartOpen(true), []);
  const handleCartClose = useCallback(() => setCartOpen(false), []);
  const handleCheckoutOpen = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);
  const handleCheckoutClose = useCallback(() => setCheckoutOpen(false), []);

  // Navigate to dedicated store page
  const handleStoreClick = useCallback(
    (storeId: string) => {
      const store = MOCK_STORES.find(s => s.id === storeId);
      if (store) trackInterest(store.categoryEn);
      navigate(`/store/s/${storeId}`);
    },
    [navigate, trackInterest]
  );

  // Navigate to dedicated category page (skip "All")
  const handleCategoryClick = useCallback(
    (categoryEn: string) => {
      if (categoryEn === 'All') return;
      trackInterest(categoryEn);
      navigate(`/store/c/${categoryEn}`);
    },
    [navigate, trackInterest]
  );

  const handleProductInterest = useCallback(
    (category: string) => trackInterest(category),
    [trackInterest]
  );

  if (!isAuthenticated || !user || user.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  const isSearching = searchQuery !== '';

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        onCartOpen={handleCartOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container px-4 py-6 space-y-10">
        {/* ── Hero Banner ── */}
        {!isSearching && (
          <section
            aria-label={t('Hero banner', 'بانر الترحيب')}
            className="relative overflow-hidden rounded-3xl gradient-hero px-8 py-12 md:px-14 md:py-16"
          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -top-16 -end-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -start-10 h-48 w-48 rounded-full bg-primary/15 blur-2xl" />

            <div className="relative z-10 max-w-lg">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t('Exclusive Deals', 'عروض حصرية')}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-primary-foreground md:text-4xl">
                {t('Your Gateway to Premium Shopping', 'بوابتك للتسوق الفاخر')}
              </h1>
              <p className="mt-3 text-sm text-primary-foreground/70 md:text-base">
                {t(
                  'Discover top-rated products from trusted stores, curated just for you.',
                  'اكتشف منتجات عالية التقييم من متاجر موثوقة، مُختارة خصيصاً لك.'
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-xl gradient-gold px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 active:scale-95"
                >
                  {t('Shop Now', 'تسوق الآن')}
                </button>
                <button
                  onClick={() => document.getElementById('stores-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur transition-all hover:bg-primary-foreground/20"
                >
                  {t('Browse Stores', 'تصفح المتاجر')}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Ads Carousel ── */}
        {!isSearching && (
          <section aria-label={t('Promotions', 'الإعلانات والعروض')}>
            <AdCarousel />
          </section>
        )}

        {/* ── Stores Section ── */}
        {!isSearching && (
          <section id="stores-section" aria-label={t('Stores', 'المتاجر')}>
            <SectionHeader
              icon={<TrendingUp className="h-4 w-4 text-primary-foreground" strokeWidth={2} />}
              titleEn="Browse by Store"
              titleAr="تصفح حسب المتجر"
              subtitleEn="Tap a store to see all its products"
              subtitleAr="اضغط على متجر لعرض جميع منتجاته"
              lang={lang}
            />
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {MOCK_STORES.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  productCount={storeProductCount[store.id] ?? 0}
                  isSelected={false}
                  onClick={handleStoreClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Categories Section ── */}
        {!isSearching && (
          <section aria-label={t('Categories', 'التصنيفات')}>
            <SectionHeader
              icon={<LayoutGrid className="h-4 w-4 text-primary-foreground" strokeWidth={2} />}
              titleEn="Shop by Category"
              titleAr="تسوق حسب الفئة"
              subtitleEn="Tap a category to explore its products"
              subtitleAr="اضغط على تصنيف لاستكشاف منتجاته"
              lang={lang}
            />
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {CATEGORIES.map(cat => (
                <CategoryTile
                  key={cat.en}
                  nameEn={cat.en}
                  nameAr={cat.ar}
                  icon={cat.icon}
                  colorClass={cat.color}
                  isSelected={false}
                  lang={lang}
                  onClick={() => handleCategoryClick(cat.en)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Flash Deals Section ── */}
        {featuredProducts.length > 0 && !isSearching && (
          <section aria-label={t('Flash Deals', 'عروض مميزة')}>
            <SectionHeader
              icon={<Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2} />}
              titleEn="Flash Deals"
              titleAr="عروض مميزة"
              subtitleEn="Limited time offers — don't miss out"
              subtitleAr="عروض لفترة محدودة — لا تفوتها"
              lang={lang}
            />
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {featuredProducts.map(product => (
                <div key={product.id} className="w-52 shrink-0 sm:w-60">
                  <ProductCard product={product} onInterest={handleProductInterest} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── For You Section ── */}
        {forYouProducts.length > 0 && !isSearching && (
          <section aria-label={t('Recommended for You', 'موصى لك')}>
            <SectionHeader
              icon={<Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2} />}
              titleEn="Recommended for You"
              titleAr="موصى به لك"
              subtitleEn="Based on your browsing interests"
              subtitleAr="بناءً على اهتماماتك أثناء التصفح"
              lang={lang}
            />
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {forYouProducts.map(product => (
                <div key={product.id} className="w-52 shrink-0 sm:w-60">
                  <ProductCard product={product} onInterest={handleProductInterest} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── All / Search Results ── */}
        <section id="products-section" aria-label={t('All Products', 'جميع المنتجات')}>
          <SectionHeader
            icon={<LayoutGrid className="h-4 w-4 text-primary-foreground" strokeWidth={2} />}
            titleEn={isSearching ? `Results for "${searchQuery}"` : 'All Products'}
            titleAr={isSearching ? `نتائج "${searchQuery}"` : 'جميع المنتجات'}
            subtitleEn={`${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} found`}
            subtitleAr={`تم العثور على ${filteredProducts.length} منتج`}
            lang={lang}
            onClear={isSearching ? () => setSearchQuery('') : undefined}
            clearLabelEn="Clear search"
            clearLabelAr="مسح البحث"
          />

          {/* Advanced-search trigger (mobile) sits above the product grid */}
          <div className="mb-4 flex items-center gap-3 md:hidden">
            <FilterPanel
              filters={filters}
              absoluteMin={ABSOLUTE_MIN}
              absoluteMax={ABSOLUTE_MAX}
              categories={FILTER_CATEGORIES}
              stores={FILTER_STORES}
              onFiltersChange={setFilters}
              resultCount={filteredProducts.length}
            />
          </div>

          {/* Desktop: sidebar + grid side-by-side */}
          <div className="flex gap-6 items-start">
            {/* Desktop sidebar (hidden on mobile — mobile uses the sheet above) */}
            <FilterPanel
              filters={filters}
              absoluteMin={ABSOLUTE_MIN}
              absoluteMax={ABSOLUTE_MAX}
              categories={FILTER_CATEGORIES}
              stores={FILTER_STORES}
              onFiltersChange={setFilters}
              resultCount={filteredProducts.length}
            />

            {/* Products grid */}
            <div className="flex-1 min-w-0">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
                  <span className="mb-3 text-5xl">🔍</span>
                  <p className="text-base font-semibold text-foreground">
                    {t('No products found', 'لم يتم العثور على منتجات')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('Try adjusting your search or filters.', 'جرب تعديل كلمة البحث أو الفلاتر.')}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {isSearching && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="rounded-xl gradient-gold px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
                      >
                        {t('Clear Search', 'مسح البحث')}
                      </button>
                    )}
                    <button
                      onClick={() => setFilters(makeDefaultFilters(ABSOLUTE_MIN, ABSOLUTE_MAX))}
                      className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                    >
                      {t('Reset Filters', 'إعادة تعيين الفلاتر')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-3">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onInterest={handleProductInterest}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <CartDrawer open={cartOpen} onClose={handleCartClose} onCheckout={handleCheckoutOpen} />
      <CheckoutModal open={checkoutOpen} onClose={handleCheckoutClose} />
      <ScrollToTopButton />
    </div>
  );
};

export default StorefrontPage;









