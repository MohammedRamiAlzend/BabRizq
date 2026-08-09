import { memo } from 'react';
import { Store } from '~/entities/store';
import { useLocale } from '@/shared/contexts/LocaleContext';

interface StoreCardProps {
  store: Store;
  productCount: number;
  isSelected: boolean;
  onClick: (storeId: string) => void;
}

const StoreCard = memo(function StoreCard({
  store,
  productCount,
  isSelected,
  onClick,
}: StoreCardProps) {
  const { t } = useLocale();

  return (
    <button
      onClick={() => onClick(store.id)}
      className={`flex shrink-0 flex-col items-center gap-2 rounded-2xl border px-5 py-4 text-center transition-all duration-200 ${isSelected
          ? 'border-primary/50 gradient-gold text-primary-foreground shadow-lg shadow-primary/20'
          : 'border-border bg-card text-foreground hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5'
        }`}
      aria-pressed={isSelected}
    >
      <span className="text-3xl leading-none" role="img" aria-label={t(store.nameEn, store.nameAr)}>
        {store.emoji}
      </span>
      <div>
        <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
          {t(store.nameEn, store.nameAr)}
        </p>
        <p className={`mt-0.5 text-xs leading-tight ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {productCount} {t('products', 'منتج')}
        </p>
      </div>
    </button>
  );
});

export default StoreCard;









