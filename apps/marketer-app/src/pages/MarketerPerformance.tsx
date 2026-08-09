/*
 * ─── API: Marketer — Performance Analytics ───────────────────────────────────
 *
 * GET /api/marketer/performance?period=weekly|monthly&linkId=
 * Headers: Authorization: Bearer <token>  (role must be "marketer")
 * Response value:
 *   {
 *     totalClicks: number; totalConversions: number; conversionRate: number;
 *     totalEarned: number;
 *     byLink: {
 *       linkId: string (GUID); targetNameEn: string; targetNameAr: string;
 *       clicks: number; conversions: number; earned: number;
 *     }[];
 *     timeline: { label: string; labelAr: string; clicks: number; conversions: number }[];
 *   }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useLocale } from '@/shared/contexts/LocaleContext';
import { INITIAL_LINKS } from '~/entities/affiliateLink';
import { BarChart3, TrendingUp, MousePointerClick, ShoppingBag } from 'lucide-react';

const MarketerPerformance = () => {
  const { t } = useLocale();

  const totalClicks = INITIAL_LINKS.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = INITIAL_LINKS.reduce((s, l) => s + l.conversions, 0);
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Performance Analytics', 'تحليلات الأداء')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Detailed breakdown of your affiliate performance.', 'تحليل مفصّل لأداء التسويق بالعمولة.')}</p>
      </div>

      {/* Conversion rate card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">{t('Conversion Rate', 'معدل التحويل')}</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{conversionRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MousePointerClick className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">{t('Avg. Clicks/Link', 'متوسط النقرات/رابط')}</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{INITIAL_LINKS.length > 0 ? Math.round(totalClicks / INITIAL_LINKS.length).toLocaleString() : 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">{t('Avg. Earning/Link', 'متوسط الربح/رابط')}</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{INITIAL_LINKS.length > 0 ? Math.round(INITIAL_LINKS.reduce((s, l) => s + l.earned, 0) / INITIAL_LINKS.length).toLocaleString() : 0} <span className="text-sm font-normal text-muted-foreground">{t('SAR', 'ر.س')}</span></p>
        </div>
      </div>

      {/* Per-link breakdown */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t('Per-Link Breakdown', 'تفصيل لكل رابط')}</h2>
        </div>
        <div className="divide-y divide-border">
          {INITIAL_LINKS.toSorted((a, b) => b.clicks - a.clicks).map(link => {
            const rate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : '0';
            return (
              <div key={link.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{t(link.targetNameEn, link.targetNameAr)}</p>
                  <span className="text-sm font-bold text-primary">{link.earned} {t('SAR', 'ر.س')}</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full gradient-gold transition-all duration-500" style={{ width: `${Math.min((link.clicks / totalClicks) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{link.clicks.toLocaleString()} {t('clicks', 'نقرة')}</span>
                  <span>{link.conversions} {t('sales', 'مبيعات')}</span>
                  <span>{rate}% {t('conv.', 'تحويل')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketerPerformance;









