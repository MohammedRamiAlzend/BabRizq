/*
 * ─── API: Store Owner — Settings ────────────────────────────────────────────
 *
 * GET /api/store/settings
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Response value:
 *   {
 *     nameEn: string; nameAr: string;
 *     descriptionEn: string; descriptionAr: string;
 *     logoUrl: string; coverUrl: string;
 *     phone: string; email: string; address: string;
 *     currencies: string[];             // enabled currency codes e.g. ["SAR","USD"]
 *     paymentMethods: string[];         // e.g. ["cash","card","mada"]
 *     notifications: {
 *       newOrder: boolean; lowStock: boolean; newMessage: boolean; promotions: boolean;
 *     };
 *     shipping: { freeAbove: number; defaultFee: number; estimatedDays: number };
 *     account: { ownerName: string; ownerNameAr: string; ownerEmail: string; ownerPhone: string };
 *   }
 *
 * PUT /api/store/settings
 * DTO: Partial of the GET response value (patch any tab's fields)
 * Response value: updated settings object
 *
 * PUT /api/store/settings/logo       (multipart/form-data, field: "file")
 * PUT /api/store/settings/cover      (multipart/form-data, field: "file")
 * Response value: { url: string }
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import {
  Store, CreditCard, Bell, Truck, User, Save, CheckCircle,
} from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { DEFAULT_STORE_SETTINGS, StoreSettings, CURRENCIES } from '~/entities/storeOwnerData';

type Tab = 'store' | 'payment' | 'notifications' | 'shipping' | 'account';

const TABS: { id: Tab; titleEn: string; titleAr: string; icon: React.ElementType }[] = [
  { id: 'store', titleEn: 'Store Info', titleAr: 'معلومات المتجر', icon: Store },
  { id: 'payment', titleEn: 'Payment & Currencies', titleAr: 'الدفع والعملات', icon: CreditCard },
  { id: 'notifications', titleEn: 'Notifications', titleAr: 'الإشعارات', icon: Bell },
  { id: 'shipping', titleEn: 'Shipping', titleAr: 'الشحن والتوصيل', icon: Truck },
  { id: 'account', titleEn: 'Account', titleAr: 'الحساب', icon: User },
];

const PAYMENT_METHODS = [
  { id: 'cash', labelEn: 'Cash on Delivery', labelAr: 'الدفع عند الاستلام' },
  { id: 'card', labelEn: 'Credit / Debit Card', labelAr: 'بطاقة ائتمانية / مدى' },
  { id: 'transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل بنكي' },
  { id: 'mada', labelEn: 'Mada', labelAr: 'مدى' },
  { id: 'stc', labelEn: 'STC Pay', labelAr: 'STC Pay' },
  { id: 'apple_pay', labelEn: 'Apple Pay', labelAr: 'Apple Pay' },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label className="text-sm font-medium text-foreground sm:w-52 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder = '' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function NumberInput({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <input
      type="number"
      min={min}
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

const StoreOwnerSettings = () => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const toggleCurrency = (code: string) => {
    const list = settings.acceptedCurrencies;
    set('acceptedCurrencies', list.includes(code) ? list.filter(c => c !== code) : [...list, code]);
  };

  const togglePayment = (method: string) => {
    const list = settings.paymentMethods;
    set('paymentMethods', list.includes(method) ? list.filter(m => m !== method) : [...list, method]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Settings', 'الإعدادات')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Manage your store preferences and configurations.', 'إدارة تفضيلات وإعدادات متجرك.')}</p>
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

          {/* ── Store Info ── */}
          {activeTab === 'store' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Store Information', 'معلومات المتجر')}
              </h2>
              <div className="space-y-4">
                <FieldRow label={t('Store Name (English)', 'اسم المتجر (إنجليزي)')}>
                  <TextInput value={settings.storeNameEn} onChange={v => set('storeNameEn', v)} />
                </FieldRow>
                <FieldRow label={t('Store Name (Arabic)', 'اسم المتجر (عربي)')}>
                  <TextInput value={settings.storeNameAr} onChange={v => set('storeNameAr', v)} />
                </FieldRow>
                <FieldRow label={t('Description (English)', 'الوصف (إنجليزي)')}>
                  <textarea
                    value={settings.descriptionEn}
                    onChange={e => set('descriptionEn', e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </FieldRow>
                <FieldRow label={t('Description (Arabic)', 'الوصف (عربي)')}>
                  <textarea
                    value={settings.descriptionAr}
                    onChange={e => set('descriptionAr', e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </FieldRow>
                <FieldRow label={t('Logo URL', 'رابط الشعار')}>
                  <TextInput value={settings.logoUrl} onChange={v => set('logoUrl', v)} placeholder="https://..." />
                </FieldRow>
                <FieldRow label={t('Contact Email', 'البريد الإلكتروني')}>
                  <TextInput value={settings.contactEmail} onChange={v => set('contactEmail', v)} />
                </FieldRow>
                <FieldRow label={t('Phone', 'رقم الهاتف')}>
                  <TextInput value={settings.phone} onChange={v => set('phone', v)} />
                </FieldRow>
                <FieldRow label={t('Address', 'العنوان')}>
                  <TextInput value={settings.address} onChange={v => set('address', v)} />
                </FieldRow>
                <FieldRow label={t('Tax Rate (%)', 'نسبة الضريبة (%)')}>
                  <NumberInput value={settings.taxRate} onChange={v => set('taxRate', v)} min={0} />
                </FieldRow>
              </div>
            </>
          )}

          {/* ── Payment & Currencies ── */}
          {activeTab === 'payment' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Accepted Currencies', 'العملات المقبولة')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CURRENCIES.map(c => {
                  const selected = settings.acceptedCurrencies.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => toggleCurrency(c.code)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors
                        ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
                    >
                      <span className="text-lg font-bold">{c.symbol}</span>
                      <div className="text-start">
                        <p className="text-sm font-semibold">{c.code}</p>
                        <p className="text-xs text-muted-foreground">{t(c.nameEn, c.nameAr)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 pt-2">
                {t('Payment Methods', 'طرق الدفع')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(m => {
                  const selected = settings.paymentMethods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => togglePayment(m.id)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors
                        ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
                    >
                      <CreditCard className="h-4 w-4 shrink-0" />
                      {t(m.labelEn, m.labelAr)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Notification Preferences', 'تفضيلات الإشعارات')}
              </h2>
              <div className="space-y-5">
                <Toggle
                  checked={settings.notifyNewOrder}
                  onChange={v => set('notifyNewOrder', v)}
                  labelEn="Notify me on new orders"
                  labelAr="إشعارات عند وصول طلبات جديدة"
                />
                <Toggle
                  checked={settings.notifyLowStock}
                  onChange={v => set('notifyLowStock', v)}
                  labelEn="Notify me on low stock alerts"
                  labelAr="إشعارات عند انخفاض المخزون"
                />
                {settings.notifyLowStock && (
                  <FieldRow label={t('Low Stock Threshold (units)', 'حد المخزون المنخفض (وحدة)')}>
                    <NumberInput value={settings.lowStockThreshold} onChange={v => set('lowStockThreshold', v)} min={1} />
                  </FieldRow>
                )}
              </div>
            </>
          )}

          {/* ── Shipping ── */}
          {activeTab === 'shipping' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Shipping & Delivery', 'الشحن والتوصيل')}
              </h2>
              <div className="space-y-4">
                <FieldRow label={t('Delivery Fee (SAR)', 'رسوم التوصيل (ر.س)')}>
                  <NumberInput value={settings.deliveryFee} onChange={v => set('deliveryFee', v)} min={0} />
                </FieldRow>
                <FieldRow label={t('Free Shipping Above (SAR)', 'شحن مجاني عند الطلب فوق (ر.س)')}>
                  <NumberInput value={settings.freeShippingThreshold} onChange={v => set('freeShippingThreshold', v)} min={0} />
                </FieldRow>
                <FieldRow label={t('Estimated Delivery (Days)', 'وقت التوصيل المتوقع (أيام)')}>
                  <NumberInput value={settings.estimatedDeliveryDays} onChange={v => set('estimatedDeliveryDays', v)} min={1} />
                </FieldRow>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p>
                  {t(
                    `Current: SAR ${settings.deliveryFee} delivery fee · Free above SAR ${settings.freeShippingThreshold} · ${settings.estimatedDeliveryDays} days delivery.`,
                    `الحالي: رسوم التوصيل ${settings.deliveryFee} ر.س · مجاني فوق ${settings.freeShippingThreshold} ر.س · ${settings.estimatedDeliveryDays} أيام توصيل.`,
                  )}
                </p>
              </div>
            </>
          )}

          {/* ── Account ── */}
          {activeTab === 'account' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Change Password', 'تغيير كلمة المرور')}
              </h2>
              <div className="space-y-4 max-w-md">
                <FieldRow label={t('Current Password', 'كلمة المرور الحالية')}>
                  <input
                    type="password"
                    value={password.current}
                    onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </FieldRow>
                <FieldRow label={t('New Password', 'كلمة المرور الجديدة')}>
                  <input
                    type="password"
                    value={password.next}
                    onChange={e => setPassword(p => ({ ...p, next: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </FieldRow>
                <FieldRow label={t('Confirm Password', 'تأكيد كلمة المرور')}>
                  <input
                    type="password"
                    value={password.confirm}
                    onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </FieldRow>
                {password.next && password.next.length < 8 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{t('Password must be at least 8 characters.', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.')}</p>
                )}
                {password.next && password.confirm && password.next !== password.confirm && (
                  <p className="text-xs text-destructive">{t('Passwords do not match.', 'كلمتا المرور غير متطابقتين.')}</p>
                )}
              </div>
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
            >
              <Save className="h-4 w-4" />
              {t('Save Changes', 'حفظ التغييرات')}
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

export default StoreOwnerSettings;









