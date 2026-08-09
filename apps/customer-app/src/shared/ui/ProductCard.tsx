import { memo } from 'react';
import { ShoppingCart, Star, Flame } from 'lucide-react';

import { useLocale } from '@/shared/contexts/LocaleContext';
import { useCart } from '@/features/cart/model/cartContext';
import type { Product } from '~/entities/product';

interface ProductCardProps {
  /** The product this card renders (see `~/entities/products`). */
  product: Product;
  /**
   * Optional callback fired when the user clicks the card / adds to cart,
   * used by the storefront to personalise "Recommended for You".
   */
  onInterest?: (category: string) => void;
}

/** 5-star rating row — round-half-up so 4.8 renders as 5 filled stars. */
const StarRating = memo(function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
});

/**
 * ProductCard — bilingual product tile used across the customer storefront
 * (flash deals, recommendations and search results).
 *
 * The card is intentionally self-contained: all copy is localised via
 * `useLocale().t(en, ar)` and adding to cart goes through the shared
 * `useCart` context so the cart drawer stays in sync.
 */
const ProductCard = memo(function ProductCard({ product, onInterest }: ProductCardProps) {
  const { t } = useLocale();
  const { addItem } = useCart();

  const { nameEn, nameAr, storeNameEn, storeNameAr, categoryEn, categoryAr } = product;
  const { image, rating, reviewCount, price, originalPrice, isNew } = product;

  /** Report browsing interest (storefront personalisation), then navigate. */
  const handleClick = () => {
    if (onInterest) onInterest(categoryEn);
  };

  /** Add to cart — stop propagation so the card click handler isn't fired too. */
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    if (onInterest) onInterest(categoryEn);
  };

  const discountPct = originalPrice ? Math.round((1 - price / originalPrice) * 100) : null;

  return (
    <div
      role="article"
      onClick={handleClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={t(nameEn, nameAr)}
          loading="lazy"
          width={640}
          height={480}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {discountPct !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
              <Flame className="h-3 w-3" />
              {t(`-${discountPct}%`, `-${discountPct}%`)}
            </span>
          )}
          {isNew && !originalPrice && (
            <span className="rounded-full gradient-gold px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
              {t('New', 'جديد')}
            </span>
          )}
        </div>

        {/* Category chip */}
        <span className="absolute bottom-3 end-3 rounded-full bg-card/85 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {t(categoryEn, categoryAr)}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-primary font-medium mb-1">{t(storeNameEn, storeNameAr)}</p>
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 leading-snug">
          {t(nameEn, nameAr)}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={rating} />
          <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground/60">({reviewCount})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground">
              {price} {t('SAR', 'ر.س')}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {originalPrice} {t('SAR', 'ر.س')}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            aria-label={t(`Add ${nameEn} to cart`, `أضف ${nameAr} إلى السلة`)}
            className="inline-flex items-center gap-1.5 rounded-xl gradient-gold px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t('Add', 'أضف')}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
