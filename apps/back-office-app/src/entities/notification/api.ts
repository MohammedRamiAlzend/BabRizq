/**
 * Notification entity — mock API (back office).
 *
 * Simulates the notification endpoints from
 * `docs/needed-endpoints-from-backend.md`
 * (`GET /api/backoffice/notifications?page=&pageSize=&type=`,
 * `PUT /api/backoffice/notifications/read`). Seed data is copied verbatim from
 * the legacy monolith.
 */
import { BackOfficeNotification } from './model';

/** In-memory notifications. TODO(migration): replaced by `GET /api/backoffice/notifications`. */
export const INITIAL_NOTIFICATIONS: BackOfficeNotification[] = [
  {
    id: 'notif1',
    type: 'new_order',
    titleEn: 'New Order Received',
    titleAr: 'طلب جديد وصل',
    bodyEn: 'Order #BRQ-1048 from Ahmed Al-Rashid — 899 SAR',
    bodyAr: 'طلب #BRQ-1048 من أحمد الراشد — ٨٩٩ ر.س',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    orderId: 'fo1',
  },
  {
    id: 'notif2',
    type: 'driver_update',
    titleEn: 'Driver Status Update',
    titleAr: 'تحديث حالة السائق',
    bodyEn: 'Yusuf Al-Mutairi has picked up order #BRQ-1035',
    bodyAr: 'يوسف المطيري استلم الطلب #BRQ-1035',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    isRead: false,
    orderId: 'fo5',
  },
  {
    id: 'notif3',
    type: 'delivery_confirmed',
    titleEn: 'Delivery Confirmed',
    titleAr: 'تم تأكيد التوصيل',
    bodyEn: 'Order #BRQ-1033 has been delivered to Nora Al-Qahtani',
    bodyAr: 'تم توصيل الطلب #BRQ-1033 إلى نورة القحطاني',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: true,
    orderId: 'fo6',
  },
  {
    id: 'notif4',
    type: 'customer_message',
    titleEn: 'Customer Message',
    titleAr: 'رسالة من عميل',
    bodyEn: 'Sara Mansour: "When will my order arrive?"',
    bodyAr: 'سارة منصور: "متى سيصل طلبي؟"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif5',
    type: 'new_order',
    titleEn: 'New Order Received',
    titleAr: 'طلب جديد وصل',
    bodyEn: 'Order #BRQ-1047 from Mohammed Ibrahim — 207 SAR',
    bodyAr: 'طلب #BRQ-1047 من محمد إبراهيم — ٢٠٧ ر.س',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    orderId: 'fo7',
  },
];

/** Simulates `GET /api/backoffice/notifications`. */
export async function getNotifications(): Promise<BackOfficeNotification[]> {
  return new Promise(resolve => setTimeout(() => resolve(INITIAL_NOTIFICATIONS), 100));
}

/** Simulates `PUT /api/backoffice/notifications/read` with `{ ids: string[] }`. */
export async function markNotificationsRead(ids: string[]): Promise<void> {
  return new Promise(resolve =>
    setTimeout(() => {
      for (const notification of INITIAL_NOTIFICATIONS) {
        if (ids.includes(notification.id)) notification.isRead = true;
      }
      resolve();
    }, 100)
  );
}
