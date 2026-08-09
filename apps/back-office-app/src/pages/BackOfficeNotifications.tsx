/*
 * ─── API: Back Office — Notifications ───────────────────────────────────────
 *
 * GET /api/backoffice/notifications?page=1&pageSize=20&type=
 * Headers: Authorization: ******  (role must be "back_office")
 * Paginated response value:
 *   { items: BackOfficeNotification[]; totalItems, page, pageSize, totalPages }
 *
 * PUT /api/backoffice/notifications/read
 * DTO: { ids: string[] }
 * Response value: null
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import {
  INITIAL_NOTIFICATIONS,
  BackOfficeNotification,
  BackOfficeNotificationType,
} from '~/entities/notification';
import {
  Bell,
  ShoppingBag,
  Truck,
  CheckCircle2,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';

/* ---------- Helpers ---------- */

const TYPE_META: Record<
  BackOfficeNotificationType,
  { icon: typeof Bell; colorClass: string; labelEn: string; labelAr: string }
> = {
  new_order: {
    icon: ShoppingBag,
    colorClass: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    labelEn: 'New Order',
    labelAr: 'طلب جديد',
  },
  driver_update: {
    icon: Truck,
    colorClass: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    labelEn: 'Driver Update',
    labelAr: 'تحديث سائق',
  },
  delivery_confirmed: {
    icon: CheckCircle2,
    colorClass: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    labelEn: 'Delivery Confirmed',
    labelAr: 'تم التوصيل',
  },
  customer_message: {
    icon: MessageSquare,
    colorClass: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30',
    labelEn: 'Customer Message',
    labelAr: 'رسالة عميل',
  },
};

const FILTER_TYPES: Array<'all' | BackOfficeNotificationType> = [
  'all',
  'new_order',
  'driver_update',
  'delivery_confirmed',
  'customer_message',
];

const FILTER_LABELS: Record<'all' | BackOfficeNotificationType, { en: string; ar: string }> = {
  all: { en: 'All', ar: 'الكل' },
  new_order: { en: 'New Order', ar: 'طلب جديد' },
  driver_update: { en: 'Driver Update', ar: 'تحديث سائق' },
  delivery_confirmed: { en: 'Delivered', ar: 'تم التوصيل' },
  customer_message: { en: 'Customer', ar: 'عميل' },
};

function formatRelativeTime(iso: string, lang: 'en' | 'ar'): string {
  try {
    const ts = new Date(iso).getTime();
    if (isNaN(ts)) return '—';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return lang === 'ar' ? 'الآن' : 'just now';
    if (mins < 60) return lang === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return lang === 'ar' ? `منذ ${hrs} س` : `${hrs}h ago`;
    return lang === 'ar' ? `منذ ${Math.floor(hrs / 24)} ي` : `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '—';
  }
}

/* ---------- Main Page ---------- */

const BackOfficeNotifications = () => {
  const { t, lang } = useLocale();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<BackOfficeNotification[]>(INITIAL_NOTIFICATIONS);
  const [typeFilter, setTypeFilter] = useState<'all' | BackOfficeNotificationType>('all');

  const filtered = useMemo(
    () =>
      typeFilter === 'all'
        ? notifications
        : notifications.filter(n => n.type === typeFilter),
    [notifications, typeFilter],
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClick = (notif: BackOfficeNotification) => {
    markRead(notif.id);
    if (notif.orderId) {
      navigate(`/back-office/shipments/${notif.orderId}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Notifications', 'الإشعارات')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? t(`${unreadCount} unread notifications`, `${unreadCount} إشعارات غير مقروءة`)
              : t('All caught up!', 'لا توجد إشعارات جديدة')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            {t('Mark all as read', 'تحديد الكل كمقروء')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TYPES.map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${typeFilter === f
                ? 'gradient-gold text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
          >
            {t(FILTER_LABELS[f].en, FILTER_LABELS[f].ar)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-20" />
            <p className="text-sm">{t('No notifications', 'لا توجد إشعارات')}</p>
          </div>
        )}
        {filtered.map(notif => {
          const meta = TYPE_META[notif.type];
          const Icon = meta.icon;
          return (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-start flex items-start gap-4 px-5 py-4 transition-colors ${notif.isRead ? 'hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/8'
                }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5 ${meta.colorClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${notif.isRead ? 'text-foreground' : 'text-primary'}`}>
                    {t(notif.titleEn, notif.titleAr)}
                  </p>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatRelativeTime(notif.timestamp, lang)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {t(notif.bodyEn, notif.bodyAr)}
                </p>
                {notif.orderId && (
                  <p className="text-xs text-primary mt-1">
                    {t('Tap to view order details →', 'اضغط لعرض تفاصيل الطلب ←')}
                  </p>
                )}
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <span className="mt-2 shrink-0 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BackOfficeNotifications;









