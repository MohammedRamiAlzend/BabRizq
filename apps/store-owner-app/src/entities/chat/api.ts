/**
 * Chat entity — mock API.
 *
 * Simulates the store-owner chat endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/POST /api/store-owner/chat`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { ChatMessage } from './model';

/** In-memory thread. TODO(migration): replaced by `GET /api/store-owner/chat`. */
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'msg1', sender: 'admin', textEn: 'Welcome to BabRizq platform! How can we help you today?', textAr: 'مرحباً بك في منصة بابرزق! كيف يمكننا مساعدتك اليوم؟', timestamp: '2026-04-10T09:00:00Z' },
  { id: 'msg2', sender: 'owner', textEn: 'Hi, I have a question about adding products to my store.', textAr: 'مرحباً، لدي سؤال حول إضافة منتجات لمتجري.', timestamp: '2026-04-10T09:05:00Z' },
  { id: 'msg3', sender: 'admin', textEn: 'Of course! You can add products from the Products Management section. Would you like a step-by-step guide?', textAr: 'بالتأكيد! يمكنك إضافة المنتجات من قسم إدارة المنتجات. هل تريد دليلاً خطوة بخطوة؟', timestamp: '2026-04-10T09:06:00Z' },
  { id: 'msg4', sender: 'owner', textEn: 'Yes please, also how can I set prices in multiple currencies?', textAr: 'نعم من فضلك، وأيضاً كيف يمكنني ضبط الأسعار بعدة عملات؟', timestamp: '2026-04-10T09:08:00Z' },
  { id: 'msg5', sender: 'admin', textEn: 'When adding or editing a product, you will find the "Prices" section which supports multiple currencies. You can add a price for each currency you sell in.', textAr: 'عند إضافة أو تعديل منتج، ستجد قسم "الأسعار" الذي يدعم عدة عملات. يمكنك إضافة سعر لكل عملة تبيع بها.', timestamp: '2026-04-10T09:10:00Z' },
  { id: 'msg6', sender: 'owner', textEn: 'Perfect, thank you! One more thing — can I generate QR codes for my products?', textAr: 'ممتاز، شكراً! سؤال أخير — هل يمكنني توليد رموز QR لمنتجاتي؟', timestamp: '2026-04-10T09:12:00Z' },
  { id: 'msg7', sender: 'admin', textEn: 'Yes! In the product edit form, there is a "Generate QR Code" button that creates a scannable QR code for your product.', textAr: 'نعم! في نموذج تعديل المنتج، يوجد زر "توليد رمز QR" الذي ينشئ رمز QR قابل للمسح لمنتجك.', timestamp: '2026-04-10T09:13:00Z' },
];

/** Simulates `GET /api/store-owner/chat`. */
export async function getChatMessages(): Promise<ChatMessage[]> {
  return new Promise(resolve => setTimeout(() => resolve(INITIAL_CHAT_MESSAGES), 100));
}

/** Simulates `POST /api/store-owner/chat`. */
export async function sendChatMessage(
  input: Omit<ChatMessage, 'id'>
): Promise<ChatMessage> {
  return new Promise(resolve =>
    setTimeout(() => {
      const message: ChatMessage = {
        ...input,
        id: `msg${INITIAL_CHAT_MESSAGES.length + 1}`,
      };
      INITIAL_CHAT_MESSAGES.push(message);
      resolve(message);
    }, 100)
  );
}
