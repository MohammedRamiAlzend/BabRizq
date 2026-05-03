/*
 * ─── API: Admin — My Profile (Account Management) ──────────────────────────
 *
 * GET /api/admin/me
 * Headers: Authorization: Bearer <token>  (role must be "admin")
 * Response value:
 *   { id: string (GUID); name: string; nameAr: string; email: string;
 *     role: 'admin'; joinedDate: string (YYYY-MM-DD) }
 *
 * PUT /api/admin/me
 * DTO: Partial<{ name: string; nameAr: string; email: string }>
 * Response value: updated profile object
 *
 * POST /api/admin/me/change-password
 * DTO: { currentPassword: string; newPassword: string; confirmPassword: string }
 * Response value: null
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useToast } from '@/shared/hooks/use-toast';

type Tab = 'account' | 'password';

const TABS: { id: Tab; titleEn: string; titleAr: string; icon: React.ElementType }[] = [
  { id: 'account', titleEn: 'Account Info', titleAr: 'معلومات الحساب', icon: User },
  { id: 'password', titleEn: 'Change Password', titleAr: 'تغيير كلمة المرور', icon: Lock },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label className="text-sm font-medium text-foreground sm:w-52 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
    />
  );
}

const AdminProfile = () => {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    nameAr: user?.nameAr || '',
    email: user?.email || '',
  });
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async () => {
    // Validation
    if (!profile.name.trim()) {
      toast({ title: t('Name is required', 'الاسم مطلوب'), variant: 'destructive' });
      return;
    }
    if (!profile.email.trim() || !profile.email.includes('@')) {
      toast({ title: t('Valid email is required', 'البريد الإلكتروني صحيح مطلوب'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      setSaved(true);
      toast({ title: t('Profile updated successfully', 'تم تحديث الملف الشخصي بنجاح') });
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast({ title: t('Error updating profile', 'خطأ في تحديث الملف الشخصي'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    // Validation
    if (!password.current) {
      toast({ title: t('Current password is required', 'كلمة المرور الحالية مطلوبة'), variant: 'destructive' });
      return;
    }
    if (!password.next || password.next.length < 8) {
      toast({ title: t('New password must be at least 8 characters', 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'), variant: 'destructive' });
      return;
    }
    if (password.next !== password.confirm) {
      toast({ title: t('Passwords do not match', 'كلمات المرور غير متطابقة'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      setSaved(true);
      toast({ title: t('Password changed successfully', 'تم تغيير كلمة المرور بنجاح') });
      setPassword({ current: '', next: '', confirm: '' });
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast({ title: t('Error changing password', 'خطأ في تغيير كلمة المرور'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('My Profile', 'ملفي الشخصي')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('Manage your account settings and preferences', 'إدارة إعدادات حسابك وتفضيلاتك')}</p>
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

          {/* ── Account Info Tab ── */}
          {activeTab === 'account' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Personal Information', 'المعلومات الشخصية')}
              </h2>

              {/* Profile Display Card */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Administrator', 'مسؤول')}</p>
                    <p className="text-lg font-semibold text-foreground">{user.name}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('User ID', 'معرف المستخدم')}</span>
                    <span className="font-mono text-foreground">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Role', 'الدور')}</span>
                    <span className="font-semibold text-foreground capitalize">{user.role}</span>
                  </div>
                </div>
              </div>

              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Edit Profile', 'تحرير الملف الشخصي')}
              </h2>
              <div className="space-y-4 max-w-md">
                <FieldRow label={t('Name (English)', 'الاسم (إنجليزي)')}>
                  <TextInput
                    value={profile.name}
                    onChange={v => setProfile(p => ({ ...p, name: v }))}
                    placeholder={t('Enter your name', 'أدخل اسمك')}
                  />
                </FieldRow>
                <FieldRow label={t('Name (Arabic)', 'الاسم (عربي)')}>
                  <TextInput
                    value={profile.nameAr}
                    onChange={v => setProfile(p => ({ ...p, nameAr: v }))}
                    placeholder={t('أدخل اسمك', 'Enter your name')}
                  />
                </FieldRow>
                <FieldRow label={t('Email Address', 'عنوان البريد الإلكتروني')}>
                  <TextInput
                    type="email"
                    value={profile.email}
                    onChange={v => setProfile(p => ({ ...p, email: v }))}
                    placeholder={t('your.email@example.com', 'your.email@example.com')}
                  />
                </FieldRow>
              </div>

              {/* Save button */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSaveProfile}
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
            </>
          )}

          {/* ── Password Tab ── */}
          {activeTab === 'password' && (
            <>
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                {t('Change Password', 'تغيير كلمة المرور')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('Enter your current password and a new password to update your account security.', 'أدخل كلمة المرور الحالية وكلمة مرور جديدة لتحديث أمان حسابك.')}</p>

              <div className="space-y-4 max-w-md">
                <FieldRow label={t('Current Password', 'كلمة المرور الحالية')}>
                  <TextInput
                    type="password"
                    value={password.current}
                    onChange={v => setPassword(p => ({ ...p, current: v }))}
                    placeholder={t('••••••••', '••••••••')}
                  />
                </FieldRow>
                <FieldRow label={t('New Password', 'كلمة المرور الجديدة')}>
                  <TextInput
                    type="password"
                    value={password.next}
                    onChange={v => setPassword(p => ({ ...p, next: v }))}
                    placeholder={t('••••••••', '••••••••')}
                  />
                </FieldRow>
                <FieldRow label={t('Confirm Password', 'تأكيد كلمة المرور')}>
                  <TextInput
                    type="password"
                    value={password.confirm}
                    onChange={v => setPassword(p => ({ ...p, confirm: v }))}
                    placeholder={t('••••••••', '••••••••')}
                  />
                </FieldRow>

                {/* Password validation hints */}
                {password.next && password.next.length < 8 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t('Password must be at least 8 characters.', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.')}
                  </p>
                )}
                {password.next && password.confirm && password.next !== password.confirm && (
                  <p className="text-xs text-destructive">{t('Passwords do not match.', 'كلمات المرور غير متطابقة.')}</p>
                )}
              </div>

              {/* Save button */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? t('Updating...', 'جاري التحديث...') : t('Update Password', 'تحديث كلمة المرور')}
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    {t('Saved!', 'تم الحفظ!')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;









