import { Moon, Sun, Languages, LogOut } from 'lucide-react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useAuth } from '@/features/auth/model/authContext';
import logo from '@/assets/logo.png';

const AppHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLocale, t } = useLocale();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Bab Rizq" className="h-9 w-9" />
          <span className="text-xl font-bold text-gold-gradient">
            {t('Bab Rizq', 'باب رزق')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && user && (
            <span className="hidden sm:inline-block text-sm text-muted-foreground px-3">
              {t(user.name, user.nameAr)}
            </span>
          )}

          <button
            onClick={toggleLocale}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle language"
          >
            <Languages className="h-5 w-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;









