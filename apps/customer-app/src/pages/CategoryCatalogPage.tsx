import { useState, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Hash,
  Layers,
  Zap,
  Gem,
  Clock,
  Footprints,
  Flower2,
  Shirt,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { MOCK_PRODUCTS } from '~/entities/product';
import { MOCK_STORES } from '~/entities/store';
import { RELATED_CATEGORIES } from '~/entities/category';
import { CATEGORY_ADS } from '~/entities/ad';
import { useInterests } from '@/shared/hooks/useInterests';
import StorefrontHeader from '@/shared/ui/StorefrontHeader';
import ProductCard from '@/shared/ui/ProductCard';
import CartDrawer from '@/shared/ui/CartDrawer';
import CheckoutModal from '@/shared/ui/CheckoutModal';
import AdCarousel from '@/shared/ui/AdCarousel';
import ScrollToTopButton from '@/shared/ui/ScrollToTopButton';

// ─── Static maps ──────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { ar: string; icon: LucideIcon; color: string; descriptionEn: string; descriptionAr: string }
> = {
  Electronics: {
    ar: 'إلكترونيات',
    icon: Zap,
    color: 'bg-blue-500/10 text-blue-500',
    descriptionEn: 'Gadgets, phones, audio, and more.',
    descriptionAr: 'أجهزة ذكية، هواتف، سماعات، والمزيد.',
  },
  Accessories: {
    ar: 'إكسسوارات',
    icon: Gem,
    color: 'bg-purple-500/10 text-purple-500',
    descriptionEn: 'Bags, eyewear, wallets, and fine accessories.',
    descriptionAr: 'حقائب، نظارات، محافظ، وإكسسوارات راقية.',
  },
  Watches: {
    ar: 'ساعات',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-500',
    descriptionEn: 'Luxury and everyday timepieces.',
    descriptionAr: 'ساعات فاخرة ويومية لكل مناسبة.',
  },
  Shoes: {
    ar: 'أحذية',
    icon: Footprints,
    color: 'bg-green-500/10 text-green-500',
    descriptionEn: 'Casual, formal, and sport footwear.',
    descriptionAr: 'أحذية كاجوال، رسمية، ورياضية.',
  },
  Perfumes: {
    ar: 'عطور',
    icon: Flower2,
    color: 'bg-pink-500/10 text-pink-500',
    descriptionEn: 'Fragrances for men, women, and children.',
    descriptionAr: 'عطور للرجال، النساء، والأطفال.',
  },
  Fashion: {
    ar: 'أزياء',
    icon: Shirt,
    color: 'bg-orange-500/10 text-orange-500',
    descriptionEn: 'Clothing and knitwear for every season.',
    descriptionAr: 'ملابس وتريكو لكل موسم.',
  },
};

/**
 * Human-readable labels for hashtag slugs used in "Browse by Topic" sections.
 */
const TAG_LABELS: Record<string, { en: string; ar: string }> = {
  'wireless': { en: 'Wireless & Bluetooth', ar: 'لاسلكي وبلوتوث' },
  'audio': { en: 'Audio & Sound', ar: 'صوت وسماعات' },
  'tws': { en: 'True Wireless (TWS)', ar: 'سماعات TWS' },
  'noise-cancellation': { en: 'Noise Cancellation', ar: 'إلغاء الضوضاء' },
  'flagship': { en: 'Flagship Phones', ar: 'هواتف رائدة' },
  'smartphone': { en: 'Smartphones', ar: 'هواتف ذكية' },
  'wearables': { en: 'Wearable Tech', ar: 'أجهزة قابلة للارتداء' },
  'fitness': { en: 'Fitness & Health', ar: 'لياقة وصحة' },
  'leather': { en: 'Leather Collection', ar: 'مجموعة الجلد' },
  'bags': { en: 'Bags & Totes', ar: 'حقائب وتوتات' },
  'eyewear': { en: 'Eyewear', ar: 'نظارات' },
  'slim-wallet': { en: 'Slim Wallets', ar: 'محافظ رفيعة' },
  'luxury': { en: 'Luxury Picks', ar: 'اختيارات فاخرة' },
  'minimalist': { en: 'Minimalist Style', ar: 'تصميم بسيط وأنيق' },
  'arabic-fragrance': { en: 'Arabic Fragrances', ar: 'عطور عربية' },
  'oud': { en: 'Oud & Oriental', ar: 'عود وعطور شرقية' },
  'mens-perfume': { en: "Men's Perfumes", ar: 'عطور رجالية' },
  'womens-perfume': { en: "Women's Perfumes", ar: 'عطور نسائية' },
  'kids-perfume': { en: "Kids' Fragrances", ar: 'عطور الأطفال' },
  'floral': { en: 'Floral Scents', ar: 'عطور زهرية' },
  'musk': { en: 'Musk & Amber', ar: 'مسك وعنبر' },
  'casual': { en: 'Casual Style', ar: 'إطلالة كاجوال' },
  'sneakers': { en: 'Sneakers', ar: 'أحذية رياضية' },
  'formal': { en: 'Formal Footwear', ar: 'أحذية رسمية' },
  'sport': { en: 'Sport & Running', ar: 'رياضة وجري' },
  'winter': { en: 'Winter Essentials', ar: 'ضروريات الشتاء' },
  'knitwear': { en: 'Knitwear & Wool', ar: 'تريكو وصوف' },
  'denim': { en: 'Denim Collection', ar: 'مجموعة الدينيم' },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface TagSectionProps {
  tag: string;
  products: typeof MOCK_PRODUCTS;
  lang: 'en' | 'ar';
  onInterest: (category: string) => void;
}

const TagSection = memo(function TagSection({
  tag,
  products,
  lang,
  onInterest,
}: TagSectionProps) {
  const label = TAG_LABELS[tag] ?? { en: `#${tag}`, ar: `#${tag}` };
  const title = lang === 'ar' ? label.ar : label.en;

  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Hash className="h-3.5 w-3.5 text-primary" />
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {products.length}
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {products.map(product => (
          <div key={product.id} className="w-52 shrink-0 sm:w-60">
            <ProductCard product={product} onInterest={onInterest} />
          </div>
        ))}
      </div>
    </section>
  );
});

interface RelatedCategoryCardProps {
  categoryEn: string;
  lang: 'en' | 'ar';
  productCount: number;
  onClick: () => void;
}

const RelatedCategoryCard = memo(function RelatedCategoryCard({
  categoryEn,
  lang,
  productCount,
  onClick,
}: RelatedCategoryCardProps) {
  const meta = CATEGORY_META[categoryEn];
  if (!meta) return null;
  const Icon = meta.icon;
  const name = lang === 'ar' ? meta.ar : categoryEn;
  const productsLabel = lang === 'ar' ? `${productCount} منتج` : `${productCount} products`;

  return (
    <button
      onClick={onClick}
      className="flex shrink-0 w-40 flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.color}`}>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{productsLabel}</p>
      </div>
    </button>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────

const CategoryCatalogPage = () => {
  const { categoryEn } = useParams<{ categoryEn: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, lang, dir } = useLocale();
  const { trackInterest } = useInterests();

  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const meta = categoryEn ? CATEGORY_META[categoryEn] ?? null : null;

  // Products in this category
  const categoryProducts = useMemo(
    () =>
      MOCK_PRODUCTS.filter(p => {
        const matchesCat = p.categoryEn === categoryEn;
        const matchesSearch =
          searchQuery === '' ||
          p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nameAr.includes(searchQuery);
        return matchesCat && matchesSearch;
      }),
    [categoryEn, searchQuery]
  );

  /**
   * Groups products (within category) by their sub-tags.
   * Only includes tags shared by 2+ products within the category (richer sections).
   * Falls back to showing any tag group with 1+ product if the category is small.
   */
  const tagGroups = useMemo(() => {
    if (!categoryEn) return [];

    // Collect all category products (unfiltered by search) for tag discovery
    const allCatProducts = MOCK_PRODUCTS.filter(p => p.categoryEn === categoryEn);

    // Build a map: tag → products
    const tagMap = new Map<string, typeof MOCK_PRODUCTS>();
    for (const product of allCatProducts) {
      for (const tag of product.tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, []);
        tagMap.get(tag)!.push(product);
      }
    }

    // Prefer tags that appear in 2+ products; fall back to 1+ if category is small
    const minCount = allCatProducts.length >= 4 ? 2 : 1;
    return Array.from(tagMap.entries())
      .filter(([, products]) => products.length >= minCount)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5); // show at most 5 tag sections
  }, [categoryEn]);

  // Related categories (defined in products.ts)
  const relatedCategories = useMemo(
    () => (categoryEn ? RELATED_CATEGORIES[categoryEn] ?? [] : []),
    [categoryEn]
  );

  const categoryProductCount = useCallback(
    (cat: string) => MOCK_PRODUCTS.filter(p => p.categoryEn === cat).length,
    []
  );

  // Stores that sell products in this category
  const categoryStores = useMemo(
    () =>
      MOCK_STORES.filter(s => s.categoryEn === categoryEn).slice(0, 6),
    [categoryEn]
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

  if (!isAuthenticated || !user || user.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  if (!categoryEn || !meta) {
    return <Navigate to="/store" replace />;
  }

  const CategoryIcon = meta.icon;
  const categoryTitle = lang === 'ar' ? meta.ar : categoryEn;

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
            {t('All Categories', 'جميع التصنيفات')}
          </button>
        </nav>

        {/* ── Category Hero ── */}
        <section
          aria-label={t('Category info', 'معلومات التصنيف')}
          className="relative overflow-hidden rounded-3xl gradient-hero px-8 py-10 md:px-14 md:py-14"
        >
          <div className="pointer-events-none absolute -top-12 -end-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-5">
            <span
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${meta.color} backdrop-blur-sm border border-white/10`}
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <CategoryIcon className="h-10 w-10 text-primary-foreground" strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-primary-foreground md:text-3xl">
                {categoryTitle}
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/70 md:text-base">
                {lang === 'ar' ? meta.descriptionAr : meta.descriptionEn}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80">
                  {categoryProducts.length} {t('products', 'منتجات')}
                </span>
                {categoryStores.length > 0 && (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {categoryStores.length} {t('stores', 'متاجر')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Category Ad Carousel ── */}
        {(CATEGORY_ADS[categoryEn ?? ''] ?? []).length > 0 && (
          <section aria-label={t('Category promotions', 'عروض التصنيف')}>
            <AdCarousel ads={CATEGORY_ADS[categoryEn ?? '']} />
          </section>
        )}

        {/* ── Category Products Grid ── */}
        <section aria-label={t('Category products', 'منتجات التصنيف')}>
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
              <LayoutGrid className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {t(`All in ${categoryEn}`, `جميع ${meta.ar}`)}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {categoryProducts.length}{' '}
                {t(
                  `${categoryProducts.length === 1 ? 'product' : 'products'} available`,
                  'منتج متوفر'
                )}
              </p>
            </div>
          </div>

          {categoryProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
              <span className="mb-3 text-5xl">🔍</span>
              <p className="text-base font-semibold text-foreground">
                {t('No products found', 'لم يتم العثور على منتجات')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('Try a different search term.', 'جرب كلمة بحث مختلفة.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {categoryProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onInterest={handleProductInterest}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Browse by Topic (hashtag groups) ── */}
        {tagGroups.length > 0 && (
          <section aria-label={t('Browse by topic', 'تصفح حسب الموضوع')}>
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
                <Hash className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {t('Browse by Topic', 'تصفح حسب الموضوع')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('Discover sub-categories within', `اكتشف أقسام فرعية في ${meta.ar}`)}
                  {lang === 'en' ? ` ${categoryEn}` : ''}
                </p>
              </div>
            </div>
            <div className="space-y-8">
              {tagGroups.map(([tag, products]) => (
                <TagSection
                  key={tag}
                  tag={tag}
                  products={products}
                  lang={lang}
                  onInterest={handleProductInterest}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Related Categories ── */}
        {relatedCategories.length > 0 && (
          <section aria-label={t('Related categories', 'تصنيفات مشابهة')}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-gold shadow-sm">
                <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {t('You Might Also Like', 'ربما يعجبك أيضاً')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('Related categories to explore', 'تصنيفات ذات صلة للاستكشاف')}
                </p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {relatedCategories.map(cat => (
                <RelatedCategoryCard
                  key={cat}
                  categoryEn={cat}
                  lang={lang}
                  productCount={categoryProductCount(cat)}
                  onClick={() => navigate(`/store/c/${cat}`)}
                />
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

export default CategoryCatalogPage;









