/**
 * Chat entity — mock API (back office).
 *
 * Simulates the chat endpoints from `docs/needed-endpoints-from-backend.md`
 * (`GET /api/backoffice/chat/conversations`,
 * `GET …/conversations/{id}/messages`, `POST …/conversations/{id}/messages`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { BackOfficeChatConversation, BackOfficeChatMessage, BackOfficeChatSender } from './model';

/** In-memory conversations. TODO(migration): replaced by `GET /api/backoffice/chat/conversations`. */
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

/** Simulates `GET /api/backoffice/chat/conversations`. */
export async function getConversations(): Promise<BackOfficeChatConversation[]> {
  return new Promise(resolve => setTimeout(() => resolve(INITIAL_CONVERSATIONS), 100));
}

/** Simulates `POST /api/backoffice/chat/conversations/{id}/messages`. */
export async function sendChatMessage(
  conversationId: string,
  sender: BackOfficeChatSender,
  textEn: string,
  textAr: string
): Promise<BackOfficeChatMessage> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const conversation = INITIAL_CONVERSATIONS.find(c => c.id === conversationId);
      if (!conversation) {
        reject(new Error('Conversation not found'));
        return;
      }
      const message: BackOfficeChatMessage = {
        id: `cm${Date.now()}`,
        sender,
        textEn,
        textAr,
        timestamp: new Date().toISOString(),
      };
      conversation.messages.push(message);
      conversation.lastMessageEn = textEn;
      conversation.lastMessageAr = textAr;
      conversation.lastTimestamp = message.timestamp;
      conversation.unreadCount = 0;
      resolve(message);
    }, 100)
  );
}
