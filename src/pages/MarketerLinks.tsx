/*
 * ─── API: Marketer — Affiliate Links ────────────────────────────────────────
 *
 * GET /api/marketer/links?page=1&pageSize=10&type=all|store|product
 * Headers: Authorization: Bearer <token>  (role must be "marketer")
 * Paginated response value:
 *   { items: AffiliateLink[]; totalItems, page, pageSize, totalPages }
 *   AffiliateLink: { id: string (GUID); url: string; targetId: string (GUID);
 *                    targetNameEn: string; targetNameAr: string;
 *                    type: 'store'|'product'; clicks: number; conversions: number;
 *                    earned: number; createdAt: string (YYYY-MM-DD) }
 *
 * POST /api/marketer/links/generate
 * DTO: { targetId: string (GUID); targetType: 'store'|'product' }
 * Response value: AffiliateLink (newly generated — returns existing one if URL already created)
 *
 * DELETE /api/marketer/links/{id}
 * Response value: null
 *
 * GET /api/marketer/targets?search=
 * Response value: AffiliateTarget[]
 *   AffiliateTarget: { id: string (GUID); nameEn: string; nameAr: string; type: 'store'|'product' }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { Link2, Copy, Check, Sparkles, Store, Package } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { AFFILIATE_TARGETS, AffiliateLink, INITIAL_LINKS } from '~/entities/marketerData';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

const MarketerLinks = () => {
  const { t } = useLocale();
  const [links, setLinks] = useState<AffiliateLink[]>(INITIAL_LINKS);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'store' | 'product'>('all');

  const handleGenerate = () => {
    if (!selectedTarget) return;
    const target = AFFILIATE_TARGETS.find(t => t.id === selectedTarget);
    if (!target) return;

    const prefix = target.type === 'store' ? 'store' : 'product';
    const url = `babrizq.com/${prefix}/${target.id}?ref=marketer1`;
    setGeneratedUrl(url);

    const exists = links.find(l => l.url === url);
    if (!exists) {
      setLinks(prev => [{
        id: `al${Date.now()}`,
        url,
        targetNameEn: target.nameEn,
        targetNameAr: target.nameAr,
        type: target.type,
        clicks: 0,
        conversions: 0,
        earned: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }, ...prev]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${generatedUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLinks = links.filter(l => filterType === 'all' || l.type === filterType);
  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(filteredLinks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Link Generator', 'مولّد الروابط')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Generate tracking links for stores and products.', 'أنشئ روابط تتبّع للمتاجر والمنتجات.')}</p>
      </div>

      {/* Generator card */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{t('Create New Link', 'إنشاء رابط جديد')}</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTarget}
            onChange={e => { setSelectedTarget(e.target.value); setGeneratedUrl(''); }}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
          >
            <option value="">{t('Select store or product...', 'اختر متجر أو منتج...')}</option>
            <optgroup label={t('Stores', 'المتاجر')}>
              {AFFILIATE_TARGETS.filter(t => t.type === 'store').map(target => (
                <option key={target.id} value={target.id}>{t(target.nameEn, target.nameAr)}</option>
              ))}
            </optgroup>
            <optgroup label={t('Products', 'المنتجات')}>
              {AFFILIATE_TARGETS.filter(t => t.type === 'product').map(target => (
                <option key={target.id} value={target.id}>{t(target.nameEn, target.nameAr)}</option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={handleGenerate}
            disabled={!selectedTarget}
            className="inline-flex items-center justify-center gap-2 rounded-xl gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Link2 className="h-4 w-4" />
            {t('Generate Link', 'إنشاء رابط')}
          </button>
        </div>

        {/* Generated URL output */}
        {generatedUrl && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 mt-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{t('Your tracking link:', 'رابط التتبّع الخاص بك:')}</p>
              <p className="text-sm font-mono font-medium text-foreground truncate">https://{generatedUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all shrink-0 ${copied
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'border border-border bg-card text-foreground hover:bg-accent'
                }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t('Copied!', 'تم النسخ!') : t('Copy', 'نسخ')}
            </button>
          </div>
        )}
      </div>

      {/* Performance Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('Link Performance', 'أداء الروابط')}</h2>
          <div className="flex gap-2">
            {(['all', 'store', 'product'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${filterType === f ? 'gradient-gold text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
              >
                {f === 'store' && <Store className="h-3 w-3" />}
                {f === 'product' && <Package className="h-3 w-3" />}
                {t(
                  f === 'all' ? 'All' : f === 'store' ? 'Stores' : 'Products',
                  f === 'all' ? 'الكل' : f === 'store' ? 'المتاجر' : 'المنتجات'
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Target', 'الهدف')}</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('Link', 'الرابط')}</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('Clicks', 'النقرات')}</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t('Conversions', 'التحويلات')}</th>
                  <th className="text-end px-4 py-3 font-medium text-muted-foreground">{t('Earned', 'الأرباح')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(link => (
                  <tr key={link.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] ${link.type === 'store'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                          }`}>
                          {link.type === 'store' ? <Store className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                        </span>
                        <span className="font-medium text-foreground">{t(link.targetNameEn, link.targetNameAr)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-muted-foreground truncate block max-w-[200px]">{link.url}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">{link.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-foreground">{link.conversions}</td>
                    <td className="px-4 py-3 text-end font-bold text-primary">{link.earned} {t('SAR', 'ر.س')}</td>
                  </tr>
                ))}
                {filteredLinks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      {t('No links found', 'لم يتم العثور على روابط')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <Pagination
            page={page} totalPages={totalPages} totalItems={totalItems}
            from={from} to={to} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketerLinks;









