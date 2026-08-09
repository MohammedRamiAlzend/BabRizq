/*
 * ─── API: Marketer — Settings ────────────────────────────────────────────────
 *
 * GET /api/marketer/settings
 * Headers: Authorization: Bearer <token>  (role must be "marketer")
 * Response value:
 *   {
 *     payoutMethod: 'bank'|'wallet';
 *     bankIban?: string;
 *     walletId?: string;
 *     notifications: { newConversion: boolean; payoutProcessed: boolean; promotions: boolean };
 *   }
 *
 * PUT /api/marketer/settings
 * DTO: Partial of the GET response value
 * Response value: updated settings object
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useLocale } from '@/shared/contexts/LocaleContext';
import { Settings } from 'lucide-react';

const MarketerSettings = () => {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">{t('Settings', 'الإعدادات')}</h1>
      <p className="text-muted-foreground text-sm">{t('Payout & notification settings coming soon.', 'إعدادات الدفع والإشعارات قريباً.')}</p>
    </div>
  );
};

export default MarketerSettings;









