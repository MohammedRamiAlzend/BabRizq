/*
 * ─── API: Admin — Platform Settings ─────────────────────────────────────────
 *
 * GET /api/admin/settings
 * Headers: Authorization: Bearer <token>  (role must be "admin")
 * Response value:
 *   {
 *     platformName: string;
 *     supportEmail: string;
 *     defaultCurrency: string;        // e.g. "SAR"
 *     commissionRate: number;         // percentage 0-100
 *     maintenanceMode: boolean;
 *   }
 *
 * PUT /api/admin/settings
 * DTO: same shape as GET response value
 * Response value: updated settings object
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, type ElementType, type ReactNode } from 'react';
import { Settings, Mail, DollarSign, AlertCircle, Save, CheckCircle } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useToast } from '@/shared/hooks/use-toast';
import { PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '~/entities/adminData';

type Tab = 'general' | 'currency' | 'maintenance';

const TABS: { id: Tab; titleEn: string; titleAr: string; icon: ElementType }[] = [
  { id: 'general', titleEn: 'General', titleAr: 'عام', icon: Settings },
  { id: 'currency', titleEn: 'Currency & Commission', titleAr: 'العملة والعمولة', icon: DollarSign },
  { id: 'maintenance', titleEn: 'Maintenance', titleAr: 'الصيانة', icon: AlertCircle },
];

const CURRENCIES = [
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
];

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label className="text-sm font-medium text-foreground sm:w-52 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder = '', type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function NumberInput({ value, onChange, min = 0, max, step = 0.1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function Toggle({ checked, onChange, labelEn, labelAr }: { checked: boolean; onChange: (v: boolean) => void; labelEn: string; labelAr: string }) {
  const { t } = useLocale();
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`} />
      </button>
      <span className="text-sm text-foreground">{t(labelEn, labelAr)}</span>
    </label>
  );
}

const AdminSettings = () => {
  const { t } = useLocale();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    // Validation
    if (!settings.platformName.trim()) {
      toast({ title: t('Platform name is required', 'اسم المنصة مطلوب'), variant: 'destructive' });
      return;
    }
    if (!settings.supportEmail.includes('@')) {
      toast({ title: t('Valid email is required', 'البريد الإلكتروني صحيح مطلوب'), variant: 'destructive' });
      return;
    }
    if (settings.commissionRate < 0 || settings.commissionRate > 100) {
      toast({ title: t('Commission rate must be between 0 and 100', 'يجب أن تكون العمولة بين 0 و 100'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      setSaved(true);
      toast({ title: t('Settings saved successfully', 'تم حفظ الإعدادات بنجاح') });
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast({ title: t('Error saving settings', 'خطأ في حفظ الإعدادات'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Platform Settings', 'إعدادات المنصة')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Manage platform-wide configuration and preferences.', 'إدارة إعدادات وتفضيلات المنصة.')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 lg:w-52">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
                  ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(tab.titleEn, tab.titleAr)}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-2xl border border-border bg-card p-6 space-y-5">

          {/* ── General ── */}
          {activeTab === 'general' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('General Settings', 'الإعدادات العامة')}
              </h2>
              <div className="space-y-4 max-w-md">
                <FieldRow label={t('Platform Name', 'اسم المنصة')}>
                  <TextInput value={settings.platformName} onChange={v => set('platformName', v)} />
                </FieldRow>
                <FieldRow label={t('Support Email', 'بريد الدعم')}>
                  <TextInput
                    type="email"
                    value={settings.supportEmail}
                    onChange={v => set('supportEmail', v)}
                    placeholder="support@example.com"
                  />
                </FieldRow>
              </div>
            </>
          )}

          {/* ── Currency & Commission ── */}
          {activeTab === 'currency' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Currency & Commission', 'العملة والعمولة')}
              </h2>
              <div className="space-y-4 max-w-md">
                <FieldRow label={t('Default Currency', 'العملة الافتراضية')}>
                  <select
                    value={settings.defaultCurrency}
                    onChange={e => set('defaultCurrency', e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </FieldRow>
                <FieldRow label={t('Commission Rate (%)', 'نسبة العمولة (%)')}>
                  <div className="flex items-center gap-3">
                    <NumberInput
                      value={settings.commissionRate}
                      onChange={v => set('commissionRate', v)}
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-sm font-medium text-muted-foreground">{settings.commissionRate}%</span>
                  </div>
                </FieldRow>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p>{t(`Commission: ${settings.commissionRate}% on all store transactions`, `العمولة: ${settings.commissionRate}% على جميع معاملات المتاجر`)}</p>
              </div>
            </>
          )}

          {/* ── Maintenance ── */}
          {activeTab === 'maintenance' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Maintenance Mode', 'وضع الصيانة')}
              </h2>
              <div className="space-y-4">
                <Toggle
                  checked={settings.maintenanceMode}
                  onChange={v => set('maintenanceMode', v)}
                  labelEn="Enable Maintenance Mode"
                  labelAr="تفعيل وضع الصيانة"
                />
                {settings.maintenanceMode && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/20 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">{t('Platform under maintenance', 'المنصة قيد الصيانة')}</p>
                        <p>{t('Users will see a maintenance message and operations will be restricted.', 'سيرى المستخدمون رسالة صيانة وسيتم تقييد العمليات.')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                {t('Saved!', 'تم الحفظ!')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;









