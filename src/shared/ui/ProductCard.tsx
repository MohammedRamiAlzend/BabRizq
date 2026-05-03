import { memo } from 'react';
import { ShoppingCart, Star, Flame } from 'lucide-react';
import { gsap } from 'gsap';

import { cn } from '@/shared/lib/utils';

interface ProductCardProps {
  nameEn: string;
  nameAr: string;
  storeNameEn: string;
  storeNameAr: string;
  image: string;
  categoryEn: string;
  categoryAr: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number | null;
  isNew: boolean;
  onInterest?: (category: string) => void;
  onAddToCart: () => void;
}

const StarRating = memo(function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
        />
      ))}
    </div>
  );
});

const ProductCard = memo(function ProductCard({ 
  nameEn, 
  nameAr, 
  storeNameEn, 
  storeNameAr, 
  image, 
  categoryEn, 
  categoryAr, 
  rating, 
  reviewCount, 
  price, 
  originalPrice, 
  isNew, 
  onInterest, 
  onAddToCart 
}: ProductCardProps) {
  const handleClick = () => {
    if (onInterest) onInterest(categoryEn);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart();
    if (onInterest) onInterest(categoryEn);
  };

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
          alt={`${nameEn} ${nameAr}`}
          loading="lazy"
          width={640}
          height={480}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {originalPrice !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
              <Flame className="h-3 w-3" />
              -{Math.round((1 - price / originalPrice) * 100)}%
            </span>
          )}
          {isNew && !originalPrice && (
            <span className="rounded-full gradient-gold px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
              {/* New badge text will be handled by parent via t() */}
            </span>
          )}
        </div>

        <span className="absolute bottom-3 end-3 rounded-full bg-card/85 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {/* Category text will be handled by parent via t() */}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-primary font-medium mb-1">{/* Store name handled by parent */}</p>
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 leading-snug">{/* Product name handled by parent */}</h3>

        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={rating} />
          <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground/60">({reviewCount})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground">
              {price} {/* SAR handled by parent */}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {originalPrice} {/* SAR handled by parent */}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1.5 rounded-xl gradient-gold px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {/* Add text handled by parent */}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;