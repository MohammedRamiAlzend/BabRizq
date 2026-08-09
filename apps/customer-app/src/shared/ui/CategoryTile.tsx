import { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface CategoryTileProps {
  nameEn: string;
  nameAr: string;
  icon: LucideIcon;
  colorClass: string;
  isSelected: boolean;
  lang: 'en' | 'ar';
  onClick: () => void;
}

const CategoryTile = memo(function CategoryTile({
  nameEn,
  nameAr,
  icon: Icon,
  colorClass,
  isSelected,
  lang,
  onClick,
}: CategoryTileProps) {
  const label = lang === 'ar' ? nameAr : nameEn;

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 ${
        isSelected
          ? 'border-primary gradient-gold text-primary-foreground shadow-lg shadow-primary/25'
          : `border-border bg-card hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5`
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          isSelected ? 'bg-white/20' : colorClass
        }`}
      >
        <Icon
          className={`h-5 w-5 ${isSelected ? 'text-primary-foreground' : ''}`}
          strokeWidth={1.75}
        />
      </span>
      <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
        {label}
      </span>
    </button>
  );
});

export default CategoryTile;









