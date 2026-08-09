/**
 * Notification entity — domain model (back office).
 *
 * Extracted from the legacy `entities/backOfficeData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Back-office notifications keep the operations
 * team informed about orders, drivers, deliveries and customer messages
 * (`GET /api/backoffice/notifications`,
 * `PUT /api/backoffice/notifications/read`).
 */
export type BackOfficeNotificationType =
  | 'new_order'
  | 'driver_update'
  | 'delivery_confirmed'
  | 'customer_message';

export interface BackOfficeNotification {
  id: string;
  type: BackOfficeNotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  timestamp: string;
  isRead: boolean;
  orderId?: string;
}
