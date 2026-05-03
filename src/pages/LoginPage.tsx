/*
 * ─── API: Authentication ──────────────────────────────────────────────────────
 *
 * POST /api/auth/login
 * DTO (request):
 *   { username: string; password: string }
 *
 * Response (success):
 *   {
 *     isSuccess: true, isError: false, errors: [],
 *     value: {
 *       token: string;           // JWT — contains "nameidentifier" (GUID user id), "role", "name", "email", "exp"
 *       role: string;            // 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer'
 *       name: string;
 *       nameAr: string;
 *     },
 *     topError: { code: null, description: null, type: 0, arabicDescription: null, httpStatus: 0 }
 *   }
 *
 * Response (failure — wrong credentials):
 *   {
 *     isSuccess: false, isError: true,
 *     errors: [{ code: "INVALID_CREDENTIALS", description: "Invalid username or password", ... }],
 *     value: null,
 *     topError: { code: "INVALID_CREDENTIALS", description: "Invalid username or password", type: 1, arabicDescription: "اسم المستخدم أو كلمة المرور غير صحيحة", httpStatus: 401 }
 *   }
 *
 * POST /api/auth/logout
 * DTO: none (uses Authorization: Bearer <token> header)
 * Response: { isSuccess: true, isError: false, errors: [], value: null, topError: { ... } }
 *
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * Response value: { id: string (GUID); name: string; nameAr: string; email: string; role: string }
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { Shield, Store, Megaphone, Briefcase, Truck, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import loginBg from '@/assets/login-bg.jpg';
import logo from '@/assets/logo.png';

const roles: { role: UserRole; icon: typeof Shield; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
  { role: 'admin', icon: Shield, labelEn: 'System Admin', labelAr: 'مدير النظام', descEn: 'Full platform access', descAr: 'وصول كامل للمنصة' },
  { role: 'store_owner', icon: Store, labelEn: 'Store Owner', labelAr: 'صاحب المتجر', descEn: 'Manage your store', descAr: 'إدارة متجرك' },
  { role: 'marketer', icon: Megaphone, labelEn: 'Marketer', labelAr: 'المسوّق', descEn: 'Promote & earn', descAr: 'روّج واربح' },
  { role: 'back_office', icon: Briefcase, labelEn: 'Back Office', labelAr: 'المكتب الخلفي', descEn: 'Operations & support', descAr: 'العمليات والدعم' },
  { role: 'delivery', icon: Truck, labelEn: 'Delivery Driver', labelAr: 'سائق التوصيل', descEn: 'Deliver orders', descAr: 'توصيل الطلبات' },
  { role: 'customer', icon: User, labelEn: 'Customer', labelAr: 'العميل', descEn: 'Shop & order', descAr: 'تسوّق واطلب' },
];

const ROLE_ROUTES: Record<string, string> = {
  customer: '/store',
  store_owner: '/store-owner',
  back_office: '/back-office',
  delivery: '/delivery',
  marketer: '/marketer',
};

const LoginPage = () => {
  const { verifyCredentials, credentialsVerified, selectRole } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  // Step 1 — credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    // Simulate a short network delay
    setTimeout(() => {
      const ok = verifyCredentials(username, password);
      if (!ok) {
        setLoginError(t('Invalid username or password.', 'اسم المستخدم أو كلمة المرور غير صحيحة.'));
      }
      setIsLoading(false);
    }, 400);
  };

  // Step 2 — role selection
  const handleRoleSelect = (role: UserRole) => {
    selectRole(role);
    navigate(ROLE_ROUTES[role] ?? '/admin');
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Decorative background side */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 p-12 text-center">
          <img src={logo} alt="Bab Rizq" className="mx-auto h-24 w-24 mb-6" />
          <h2 className="text-4xl font-bold text-primary-foreground mb-3">
            {t('Bab Rizq', 'باب رزق')}
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-sm mx-auto">
            {t(
              'Your gateway to seamless e-commerce — sell, deliver, and grow.',
              'بوابتك لتجارة إلكترونية سلسة — بِع، وصّل، وانمُ.'
            )}
          </p>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logo} alt="Bab Rizq" className="h-16 w-16 mb-3" />
            <h1 className="text-2xl font-bold text-gold-gradient">{t('Bab Rizq', 'باب رزق')}</h1>
          </div>

          {!credentialsVerified ? (
            /* ── Step 1: Credentials form ── */
            <>
              <h2 className="text-2xl font-bold text-foreground mb-1 text-center lg:text-start">
                {t('Sign in to your account', 'تسجيل الدخول إلى حسابك')}
              </h2>
              <p className="text-muted-foreground mb-8 text-center lg:text-start">
                {t('Enter your credentials to continue', 'أدخل بيانات اعتمادك للمتابعة')}
              </p>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    {t('Username', 'اسم المستخدم')}
                  </label>
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

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    {t('Password', 'كلمة المرور')}
                  </label>
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

                {/* Error message */}
                {loginError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit */}
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

              {/* Demo hint */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {t('Demo credentials — username:', 'بيانات تجريبية — اسم المستخدم:')}
                <span className="font-mono font-semibold"> 1 </span>
                {t('/ password:', '/ كلمة المرور:')}
                <span className="font-mono font-semibold"> 1</span>
              </p>
            </>
          ) : (
            /* ── Step 2: Role selection ── */
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center lg:text-start">
                {t('Choose your role', 'اختر دورك')}
              </h2>
              <p className="text-muted-foreground mb-8 text-center lg:text-start">
                {t('Select a role to explore the platform', 'اختر دوراً لاستكشاف المنصة')}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {roles.map(({ role, icon: Icon, labelEn, labelAr, descEn, descAr }) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{t(labelEn, labelAr)}</span>
                    <span className="text-xs text-muted-foreground">{t(descEn, descAr)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;









