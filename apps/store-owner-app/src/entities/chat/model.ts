/**
 * Chat entity — domain model.
 *
 * Extracted from the legacy `entities/storeOwnerData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). A chat message is exchanged between the store
 * owner and the platform support/admin team
 * (`GET/POST /api/store-owner/chat`).
 */
export interface ChatMessage {
  id: string;
  sender: 'owner' | 'admin';
  textEn: string;
  textAr: string;
  timestamp: string;
}
