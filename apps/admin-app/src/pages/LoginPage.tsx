/**
 * Login page — Platform Admin application.
 *
 * Single-role entry point: no role picker. Demo credentials (username "1" / password "1")
 * log the user straight into the admin dashboard.
 *
 * Real API contract simulated here:
 *   POST /api/auth/login  →  { token, role: 'admin', name, nameAr }
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { Shield, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import loginBg from '@/assets/login-bg.jpg';
import logo from '@/assets/logo.png';

const HOME_ROUTE = '/admin';

const LoginPage = () => {
  const { verifyCredentials, selectRole } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    // Simulate a short network round-trip, then log in.
    setTimeout(() => {
      const ok = verifyCredentials(username, password);
      if (!ok) {
        setLoginError(t('Invalid username or password.', 'اسم المستخدم أو كلمة المرور غير صحيحة.'));
      } else {
        selectRole('admin');
        navigate(HOME_ROUTE);
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Decorative brand side */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 p-12 text-center">
          <img src={logo} alt="Bab Rizq" className="mx-auto h-24 w-24 mb-6" />
          <h2 className="text-4xl font-bold text-primary-foreground mb-3">
            {t('Bab Rizq', 'باب رزق')}
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-sm mx-auto">
            {t('Your gateway to seamless e-commerce — sell, deliver, and grow.', 'بوابتك لتجارة إلكترونية سلسة — بِع، وصّل، وانمُ.')}
          </p>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logo} alt="Bab Rizq" className="h-16 w-16 mb-3" />
            <h1 className="text-2xl font-bold text-gold-gradient">{t('Bab Rizq', 'باب رزق')}</h1>
          </div>

          <div className="mb-8 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Shield className="h-3.5 w-3.5" />
              {t('Platform Admin', 'إدارة المنصة')}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {t('Sign in to the admin console', 'سجّل الدخول إلى لوحة الإدارة')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('Enter your credentials to continue', 'أدخل بيانات اعتمادك للمتابعة')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">{t('Username', 'اسم المستخدم')}</label>
              <input
                type="text"
                autoComplete="username"
                required
                placeholder={t('Enter username', 'أدخل اسم المستخدم')}
                value={username}
                onChange={e => { setUsername(e.target.value); setLoginError(''); }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">{t('Password', 'كلمة المرور')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder={t('Enter password', 'أدخل كلمة المرور')}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pe-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('Toggle password visibility', 'تبديل رؤية كلمة المرور')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {t('Sign In', 'تسجيل الدخول')}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t('Demo credentials — username:', 'بيانات تجريبية — اسم المستخدم:')}
            <span className="font-mono font-semibold"> 1 </span>
            {t('/ password:', '/ كلمة المرور:')}
            <span className="font-mono font-semibold"> 1</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
