/*
 * ─── API: Admin — Platform Overview ─────────────────────────────────────────
 *
 * GET /api/admin/overview
 * Headers: Authorization: Bearer <token>  (role must be "admin")
 *
 * Response value:
 *   {
 *     totalUsers: number;
 *     totalStores: number;
 *     platformRevenue: number;   // in SAR
 *     activeMarketers: number;
 *   }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { Users, Store, DollarSign, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { platformStats } from '~/entities/adminData';

const AdminOverview = () => {
  const { t } = useLocale();

  const stats = [
    { label: t('Total Users', 'إجمالي المستخدمين'), value: platformStats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-500' },
    { label: t('Total Stores', 'إجمالي المتاجر'), value: platformStats.totalStores.toLocaleString(), icon: Store, color: 'text-emerald-500' },
    { label: t('Platform Revenue', 'إيرادات المنصة'), value: `${platformStats.platformRevenue.toLocaleString()} SAR`, icon: DollarSign, color: 'text-amber-500' },
    { label: t('Active Marketers', 'المسوّقون النشطون'), value: platformStats.activeMarketers.toLocaleString(), icon: Megaphone, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('Platform Overview', 'نظرة عامة على المنصة')}</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;









