import { Moon, Sun, Languages, ShoppingCart, LogOut, Search, X } from 'lucide-react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useAuth } from '@/features/auth/model/authContext';
import { useCart } from '@/features/cart/model/cartContext';
import logo from '@/assets/logo.png';
import { useState } from 'react';

interface StorefrontHeaderProps {
  onCartOpen: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const StorefrontHeader = ({ onCartOpen, searchQuery, onSearchChange }: StorefrontHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleLocale, t } = useLocale();
  const { logout } = useAuth();
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-3 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="Bab Rizq" className="h-8 w-8" />
          <span className="text-lg font-bold text-gold-gradient hidden sm:inline">
            {t('Bab Rizq', 'باب رزق')}
          </span>
        </div>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={t('Search products...', 'ابحث عن المنتجات...')}
              className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="h-5 w-5" />
          </button>

          <button onClick={toggleLocale} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" aria-label="Toggle language">
            <Languages className="h-5 w-5" />
          </button>
          <button onClick={toggleTheme} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* Cart */}
          <button
            onClick={onCartOpen}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full gradient-gold text-[10px] font-bold text-primary-foreground px-1">
                {totalItems}
              </span>
            )}
          </button>

          <button onClick={logout} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 bg-card">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={t('Search products...', 'ابحث عن المنتجات...')}
              className="w-full rounded-xl border border-border bg-background py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default StorefrontHeader;









