import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { User, Languages, Moon, Sun, LogOut, Truck } from 'lucide-react';

const DeliveryProfile = () => {
  const { user, logout } = useAuth();
  const { t, toggleLocale, lang } = useLocale();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('My Profile', 'ملفي الشخصي')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Your account details and preferences', 'تفاصيل حسابك وإعداداتك')}
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{t(user.name, user.nameAr)}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-0.5 text-[11px] font-medium">
              <Truck className="h-3 w-3" />
              {t('Delivery Driver', 'عامل التوصيل')}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t('User ID', 'معرف المستخدم')}</span>
            <span className="text-sm font-mono text-foreground truncate max-w-[180px]">{user.id}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t('Role', 'الدور')}</span>
            <span className="text-sm text-foreground">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-1">
        <h2 className="text-sm font-semibold text-foreground mb-3">{t('Preferences', 'الإعدادات')}</h2>

        {/* Language */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t('Language', 'اللغة')}</span>
          </div>
          <button
            onClick={toggleLocale}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            {lang === 'ar' ? 'العربية' : 'English'}
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground">{t('Theme', 'المظهر')}</span>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            {theme === 'light' ? t('Light', 'فاتح') : t('Dark', 'داكن')}
            {theme === 'light' ? (
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        {t('Sign Out', 'تسجيل الخروج')}
      </button>
    </div>
  );
};

export default DeliveryProfile;









