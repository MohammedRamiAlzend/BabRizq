/**
 * Chat mapper — Prisma conversation/message rows → the shapes the
 * store-owner and back-office `chat.md` contracts define.
 *
 * - Store-owner messages (`senderRole: "store_owner" | "admin"`).
 * - Back-office messages (`sender: "back_office" | "customer" | "store"`).
 * - Conversations (`partnerNameEn/Ar`, `lastMessageEn/Ar`, `unreadCount`).
 */
import { ChatConversation, ChatMessage } from '@prisma/client';

/** ChatMessage with the relations a store-owner thread loads. */
export type StoreChatMessage = ChatMessage;

/** Store-owner `ChatMessage` shape (store-owner chat.md). */
export interface StoreChatMessageView {
  id: string;
  senderId: string;
  senderRole: 'store_owner' | 'admin';
  content: string;
  timestamp: string; // ISO 8601
  isRead: boolean;
}

/** Back-office `BackOfficeChatMessage` shape (back-office chat.md). */
export interface BackofficeChatMessageView {
  id: string;
  conversationId: string;
  sender: 'back_office' | 'customer' | 'store';
  content: string;
  timestamp: string; // ISO 8601
  isRead: boolean;
}

/** Back-office `BackOfficeChatConversation` shape (back-office chat.md). */
export interface BackofficeChatConversationView {
  id: string;
  type: 'customer' | 'store';
  partnerNameEn: string;
  partnerNameAr: string;
  partnerId: string;
  lastMessageEn: string;
  lastMessageAr: string;
  lastTimestamp: string; // ISO 8601
  unreadCount: number;
}

/** Maps a store thread row → the store-owner message view. */
export function toStoreChatMessageView(
  message: StoreChatMessage,
): StoreChatMessageView {
  return {
    id: message.id,
    senderId: message.senderId,
    senderRole: message.senderType === 'store' ? 'store_owner' : 'admin',
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    isRead: message.isRead,
  };
}

/** Maps a message row → the back-office message view. */
export function toBackofficeChatMessageView(
  message: ChatMessage,
): BackofficeChatMessageView {
  return {
    id: message.id,
    conversationId: message.conversationId,
    sender: message.senderType as BackofficeChatMessageView['sender'],
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    isRead: message.isRead,
  };
}

/** Maps a conversation row + partner names → the back-office conversation view. */
export function toBackofficeChatConversationView(
  conversation: ChatConversation,
  partnerNameEn: string,
  partnerNameAr: string,
): BackofficeChatConversationView {
  return {
    id: conversation.id,
    type: conversation.type as 'customer' | 'store',
    partnerNameEn,
    partnerNameAr,
    partnerId: conversation.partnerId,
    lastMessageEn: conversation.lastMessageEn ?? '',
    lastMessageAr: conversation.lastMessageAr ?? '',
    lastTimestamp: conversation.lastTimestamp.toISOString(),
    unreadCount: conversation.unreadCount,
  };
}
