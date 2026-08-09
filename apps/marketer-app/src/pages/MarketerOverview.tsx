/*
 * ─── API: Marketer — Affiliate Dashboard Overview ────────────────────────────
 *
 * GET /api/marketer/overview
 * Headers: Authorization: Bearer <token>  (role must be "marketer")
 *   The marketer's GUID (nameidentifier) is used server-side to scope data.
 * Response value:
 *   {
 *     totalClicks: number;
 *     totalConversions: number;
 *     totalEarned: number;
 *     balance: number;              // withdrawable balance
 *     topLinks: AffiliateLink[];    // top 3 by earnings
 *   }
 *   AffiliateLink: { id: string (GUID); url: string; targetNameEn: string; targetNameAr: string;
 *                    type: 'store'|'product'; clicks: number; conversions: number; earned: number; createdAt: string }
 *
 * POST /api/marketer/withdraw
 * DTO: { amount: number; bankIban?: string; walletId?: string }
 * Response value: { requestId: string (GUID); status: 'pending'; estimatedDays: number }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { MousePointerClick, ShoppingBag, Wallet, ArrowUpRight } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { INITIAL_LINKS } from '~/entities/marketerData';
import { useState } from 'react';

const MarketerOverview = () => {
  const { t } = useLocale();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const totalClicks = INITIAL_LINKS.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = INITIAL_LINKS.reduce((s, l) => s + l.conversions, 0);
  const totalEarned = INITIAL_LINKS.reduce((s, l) => s + l.earned, 0);

  const stats = [
    {
      titleEn: 'Total Clicks', titleAr: 'إجمالي النقرات',
      value: totalClicks.toLocaleString(), suffix: { en: 'clicks', ar: 'نقرة' },
      changeEn: '+324 this week', changeAr: '+324 هذا الأسبوع',
      icon: MousePointerClick,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    },
    {
      titleEn: 'Total Sales', titleAr: 'إجمالي المبيعات',
      value: totalConversions.toLocaleString(), suffix: { en: 'conversions', ar: 'تحويل' },
      changeEn: '+18 this week', changeAr: '+18 هذا الأسبوع',
      icon: ShoppingBag,
      color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    },
    {
      titleEn: 'Commission Balance', titleAr: 'رصيد العمولات',
      value: totalEarned.toLocaleString(), suffix: { en: 'SAR', ar: 'ر.س' },
      changeEn: 'Available to withdraw', changeAr: 'متاح للسحب',
      icon: Wallet,
      color: 'text-primary bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Affiliate Dashboard', 'لوحة المسوّق')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('Track your referral performance and earnings.', 'تتبّع أداء إحالاتك وأرباحك.')}</p>
        </div>
        <button
          onClick={() => setShowWithdraw(true)}
          className="inline-flex items-center gap-2 rounded-xl gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shrink-0"
        >
          <Wallet className="h-4 w-4" />
          {t('Withdraw Funds', 'سحب الأرباح')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{t(stat.titleEn, stat.titleAr)}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stat.value} <span className="text-sm font-normal text-muted-foreground">{t(stat.suffix.en, stat.suffix.ar)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t(stat.changeEn, stat.changeAr)}</p>
          </div>
        ))}
      </div>

      {/* Top performing links */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t('Top Performing Links', 'أفضل الروابط أداءً')}</h2>
        </div>
        <div className="divide-y divide-border">
          {INITIAL_LINKS.toSorted((a, b) => b.earned - a.earned).slice(0, 3).map(link => (
            <div key={link.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t(link.targetNameEn, link.targetNameAr)}</p>
                <p className="text-xs text-muted-foreground truncate">{link.clicks} {t('clicks', 'نقرة')} · {link.conversions} {t('sales', 'مبيعات')}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-primary">
                {link.earned} {t('SAR', 'ر.س')}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <WithdrawModal balance={totalEarned} onClose={() => setShowWithdraw(false)} />
      )}
    </div>
  );
};

const WithdrawModal = ({ balance, onClose }: { balance: number; onClose: () => void }) => {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
          {submitted ? (
            <div className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{t('Request Submitted!', 'تم تقديم الطلب!')}</h3>
              <p className="text-sm text-muted-foreground mb-5">{t('Your withdrawal will be processed within 2-3 business days.', 'سيتم معالجة السحب خلال 2-3 أيام عمل.')}</p>
              <button onClick={onClose} className="rounded-xl gradient-gold px-6 py-2.5 text-sm font-bold text-primary-foreground">
                {t('Done', 'تم')}
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">{t('Withdraw Funds', 'سحب الأرباح')}</h3>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">{t('Available Balance', 'الرصيد المتاح')}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{balance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t('SAR', 'ر.س')}</span></p>
              </div>
              <button onClick={() => setSubmitted(true)} className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90">
                {t('Request Withdrawal', 'طلب السحب')}
              </button>
              <button onClick={onClose} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
                {t('Cancel', 'إلغاء')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MarketerOverview;









