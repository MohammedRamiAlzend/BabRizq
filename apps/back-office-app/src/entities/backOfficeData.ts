/*
 * ─── API: Back Office — Notifications ───────────────────────────────────────
 *
 * GET /api/backoffice/notifications?page=1&pageSize=20&type=
 * Headers: Authorization: ******  (role must be "back_office")
 * Paginated response value:
 *   { items: BackOfficeNotification[]; totalItems, page, pageSize, totalPages }
 *   BackOfficeNotification: {
 *     id: string (GUID); type: 'new_order'|'driver_update'|'delivery_confirmed'|'customer_message';
 *     titleEn: string; titleAr: string; bodyEn: string; bodyAr: string;
 *     timestamp: string (ISO 8601); isRead: boolean; orderId?: string;
 *   }
 *
 * PUT /api/backoffice/notifications/read
 * DTO: { ids: string[] }
 * Response value: null
 *
 * ─── API: Back Office — Chat ─────────────────────────────────────────────────
 *
 * GET /api/backoffice/chat/conversations
 * Response value: BackOfficeChatConversation[]
 *
 * GET /api/backoffice/chat/conversations/{id}/messages?page=1&pageSize=50
 * Response value: { items: BackOfficeChatMessage[]; ... }
 *
 * POST /api/backoffice/chat/conversations/{id}/messages
 * DTO: { content: string }
 * Response value: BackOfficeChatMessage (newly created)
 *
 * WebSocket: ws://api/backoffice/chat/ws?token=<jwt>
 *   Server pushes BackOfficeChatMessage when the other party sends a message.
 *
 * Standard envelope:
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

// ─── Notifications ───────────────────────────────────────────────────────────

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

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type BackOfficeChatSender = 'back_office' | 'customer' | 'store';

export interface BackOfficeChatMessage {
  id: string;
  sender: BackOfficeChatSender;
  textEn: string;
  textAr: string;
  timestamp: string;
}

export type BackOfficeConversationType = 'customer' | 'store';

export interface BackOfficeChatConversation {
  id: string;
  type: BackOfficeConversationType;
  partnerNameEn: string;
  partnerNameAr: string;
  lastMessageEn: string;
  lastMessageAr: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: BackOfficeChatMessage[];
}

export const INITIAL_CONVERSATIONS: BackOfficeChatConversation[] = [
  {
    id: 'conv1',
    type: 'customer',
    partnerNameEn: 'Sara Mansour',
    partnerNameAr: 'سارة منصور',
    lastMessageEn: 'When will my order arrive?',
    lastMessageAr: 'متى سيصل طلبي؟',
    lastTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unreadCount: 2,
    messages: [
      {
        id: 'cm1',
        sender: 'customer',
        textEn: 'Hello, I placed an order an hour ago.',
        textAr: 'مرحبا، لقد قدمت طلبًا منذ ساعة.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cm2',
        sender: 'back_office',
        textEn: 'Hello Sara! Your order #BRQ-1041 is being processed.',
        textAr: 'مرحباً سارة! طلبك #BRQ-1041 قيد المعالجة.',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cm3',
        sender: 'customer',
        textEn: 'When will my order arrive?',
        textAr: 'متى سيصل طلبي؟',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'conv2',
    type: 'customer',
    partnerNameEn: 'Khalid Nasser',
    partnerNameAr: 'خالد ناصر',
    lastMessageEn: 'Thank you for the update!',
    lastMessageAr: 'شكراً على التحديث!',
    lastTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    messages: [
      {
        id: 'cm4',
        sender: 'customer',
        textEn: 'Is my order ready for pickup?',
        textAr: 'هل طلبي جاهز للاستلام؟',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cm5',
        sender: 'back_office',
        textEn: 'Yes! A driver has been assigned and will pick it up shortly.',
        textAr: 'نعم! تم تعيين سائق وسيستلمه قريباً.',
        timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cm6',
        sender: 'customer',
        textEn: 'Thank you for the update!',
        textAr: 'شكراً على التحديث!',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'conv3',
    type: 'store',
    partnerNameEn: 'TechZone Store',
    partnerNameAr: 'متجر تك زون',
    lastMessageEn: 'We have restocked the headphones.',
    lastMessageAr: 'قمنا بتجديد مخزون السماعات.',
    lastTimestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    unreadCount: 1,
    messages: [
      {
        id: 'cm7',
        sender: 'back_office',
        textEn: 'Hi TechZone, please confirm stock availability for order #BRQ-1041.',
        textAr: 'مرحباً تك زون، يرجى تأكيد توافر المخزون للطلب #BRQ-1041.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cm8',
        sender: 'store',
        textEn: 'We have restocked the headphones.',
        textAr: 'قمنا بتجديد مخزون السماعات.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// ─── Driver Locations (mock map data) ────────────────────────────────────────
/*
 * NOTE: This is a placeholder for real map integration.
 * In production, driver coordinates would be pushed via WebSocket or polled
 * from GET /api/backoffice/drivers/locations.
 * Integrating a real map library (e.g. Mapbox GL JS or Google Maps) requires
 * replacing the visual placeholder in BackOfficeMap.tsx with the actual SDK.
 */

export interface DriverLocation {
  driverId: string;
  /** Normalized 0–100 horizontal position on the mock map canvas */
  x: number;
  /** Normalized 0–100 vertical position on the mock map canvas */
  y: number;
  status: 'available' | 'assigned' | 'in_transit';
}

export const DRIVER_LOCATIONS: DriverLocation[] = [
  { driverId: 'd1', x: 30, y: 40, status: 'in_transit' },
  { driverId: 'd2', x: 65, y: 55, status: 'assigned' },
  { driverId: 'd3', x: 50, y: 25, status: 'available' },
  { driverId: 'd4', x: 78, y: 70, status: 'available' },
];









