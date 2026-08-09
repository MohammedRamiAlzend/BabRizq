/**
 * Chat entity — domain model (back office).
 *
 * Extracted from the legacy `entities/backOfficeData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Back-office chat holds conversations with
 * customers and stores (`GET/POST /api/backoffice/chat/conversations…`,
 * realtime via WebSocket per `docs/needed-endpoints-from-backend.md`).
 */
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
