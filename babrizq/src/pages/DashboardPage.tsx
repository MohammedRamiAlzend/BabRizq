import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import AppHeader from '@/shared/ui/AppHeader';
import { Shield, Store, Megaphone, Briefcase, Truck, ShoppingBag } from 'lucide-react';

const roleIcons = {
  admin: Shield,
  store_owner: Store,
  marketer: Megaphone,
  back_office: Briefcase,
  delivery: Truck,
  customer: ShoppingBag,
};

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLocale();

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  const Icon = roleIcons[user.role];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-gold mb-6">
          <Icon className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t(`Welcome, ${user.name}!`, `مرحباً، ${user.nameAr}!`)}
        </h1>
        <p className="text-muted-foreground max-w-md">
          {t(
            'This is your dashboard placeholder. Features for your role will appear here soon.',
            'هذا هو العنصر النائب للوحة التحكم. ستظهر ميزات دورك هنا قريباً.'
          )}
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          {t('Role:', 'الدور:')} <span className="font-semibold text-foreground">{t(user.name, user.nameAr)}</span>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;









