/**
 * Chat application service — the platform support-chat use cases behind
 * `/api/store/chat` (store owner ↔ platform) and `/api/backoffice/chat`
 * (operator ↔ stores and customers).
 *
 * A `store` conversation is auto-created the first time a store owner sends
 * a message (partner = the store, operator = the first back_office user).
 * `customer` conversations are created the same way from the customer side
 * in a future phase; the operator-facing list/conversation endpoints already
 * support both `type` values.
 *
 * unreadCount semantics: it counts messages addressed TO the conversation
 * owner (store owner or operator). Marking messages read resets it.
 */
import { Injectable } from '@nestjs/common';
import { ApiError } from '../../../shared/common/errors/api-error';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';
import {
  BackofficeChatConversationView,
  BackofficeChatMessageView,
  StoreChatMessageView,
  toBackofficeChatConversationView,
  toBackofficeChatMessageView,
  toStoreChatMessageView,
} from './chat.mapper';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Store owner side (/api/store/chat)
  // ------------------------------------------------------------------

  /**
   * GET /store/chat/messages — paginated history for the store's support
   * conversation, oldest-first (per chat.md). Returns an empty page when no
   * conversation exists yet (no error).
   */
  async listStoreMessages(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const conversation = await this.findStoreConversation(store.id);
    if (!conversation) {
      return buildPaginated<StoreChatMessageView>([], 0, query.page, query.pageSize);
    }

    const where = { conversationId: conversation.id };
    const [rows, totalItems] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.chatMessage.count({ where }),
    ]);
    return buildPaginated(
      rows.map(toStoreChatMessageView),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /**
   * POST /store/chat/messages — the store owner sends a message to the
   * platform. Auto-creates the store↔operator conversation on first send.
   */
  async sendStoreMessage(
    ownerUserId: string,
    storeId: string | undefined,
    content: string,
  ): Promise<StoreChatMessageView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    this.assertNonEmpty(content);

    const conversation =
      (await this.findStoreConversation(store.id)) ??
      (await this.createStoreConversation(store.id));

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'store',
        senderId: store.id,
        content,
      },
    });
    await this.touchConversation(conversation.id, content);
    return toStoreChatMessageView(message);
  }

  /**
   * PUT /store/chat/messages/read — marks the given messages as read.
   * Only messages addressed to the store (sender = operator) are touched;
   * the store can never mutate its own messages.
   */
  async markStoreMessagesRead(
    ownerUserId: string,
    storeId: string | undefined,
    messageIds: string[],
  ): Promise<null> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    if (messageIds.length === 0) {
      throw ApiError.badRequest('EMPTY_IDS', 'messageIds must not be empty');
    }
    const conversation = await this.findStoreConversation(store.id);
    if (!conversation) return null;

    await this.prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        conversationId: conversation.id,
        senderType: { not: 'store' },
      },
      data: { isRead: true },
    });
    await this.syncUnreadCount(conversation.id, 'store');
    return null;
  }

  // ------------------------------------------------------------------
  // Back-office operator side (/api/backoffice/chat)
  // ------------------------------------------------------------------

  /**
   * GET /backoffice/chat/conversations — every conversation for this
   * operator, most recent first, optionally filtered by `type`.
   */
  async listConversations(
    backOfficeUserId: string,
    type?: string,
  ): Promise<BackofficeChatConversationView[]> {
    const conversations = await this.prisma.chatConversation.findMany({
      where: {
        backOfficeUserId,
        ...(type ? { type } : {}),
      },
      orderBy: { lastTimestamp: 'desc' },
    });
    if (conversations.length === 0) return [];

    const partnerNames = await this.loadPartnerNames(conversations);
    return conversations.map((conversation) => {
      const partner = partnerNames.get(conversation.partnerId);
      return toBackofficeChatConversationView(
        conversation,
        partner?.nameEn ?? 'Unknown',
        partner?.nameAr ?? 'غير معروف',
      );
    });
  }

  /**
   * GET /backoffice/chat/conversations/:id/messages — paginated history
   * (oldest-first). Marks every unread partner message in the conversation
   * as read and resets the operator's unread count (side effect per chat.md).
   */
  async listConversationMessages(
    backOfficeUserId: string,
    conversationId: string,
    query: { page: number; pageSize: number },
  ) {
    await this.assertOwnedConversation(backOfficeUserId, conversationId);

    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderType: { not: 'back_office' },
        isRead: false,
      },
      data: { isRead: true },
    });
    await this.syncUnreadCount(conversationId, 'back_office');

    const where = { conversationId };
    const [rows, totalItems] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.chatMessage.count({ where }),
    ]);
    return buildPaginated(
      rows.map(toBackofficeChatMessageView),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  /**
   * POST /backoffice/chat/conversations/:id/messages — the operator replies
   * inside an existing conversation.
   */
  async sendBackofficeMessage(
    backOfficeUserId: string,
    conversationId: string,
    content: string,
  ): Promise<BackofficeChatMessageView> {
    await this.assertOwnedConversation(backOfficeUserId, conversationId);
    this.assertNonEmpty(content);

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: 'back_office',
        senderId: backOfficeUserId,
        content,
      },
    });
    await this.touchConversation(conversationId, content);
    return toBackofficeChatMessageView(message);
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private assertNonEmpty(content: string): void {
    if (!content || content.trim().length === 0) {
      throw ApiError.badRequest('EMPTY_MESSAGE', 'Message content cannot be empty');
    }
  }

  /** The store's support conversation (partnerId = storeId, type = store). */
  private findStoreConversation(storeId: string) {
    return this.prisma.chatConversation.findFirst({
      where: { type: 'store', partnerId: storeId },
      orderBy: { lastTimestamp: 'asc' },
    });
  }

  /**
   * Creates the store↔operator conversation. The operator is the first
   * `back_office` user (alphabetical); a 503 keeps the contract honest when
   * no operator account exists yet.
   */
  private async createStoreConversation(storeId: string) {
    const operator = await this.prisma.user.findFirst({
      where: { role: 'back_office' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!operator) {
      throw new ApiError(
        'NO_BACKOFFICE_OPERATOR',
        503,
        'No support operator is available yet',
      );
    }
    return this.prisma.chatConversation.create({
      data: {
        backOfficeUserId: operator.id,
        type: 'store',
        partnerType: 'store',
        partnerId: storeId,
      },
    });
  }

  /** Loads partner names (Store or User) for a set of conversations. */
  private async loadPartnerNames(
    conversations: { partnerType: string; partnerId: string }[],
  ): Promise<Map<string, { nameEn: string; nameAr: string }>> {
    const storeIds = conversations
      .filter((c) => c.partnerType === 'store')
      .map((c) => c.partnerId);
    const userIds = conversations
      .filter((c) => c.partnerType === 'customer')
      .map((c) => c.partnerId);

    const [stores, users] = await Promise.all([
      storeIds.length
        ? this.prisma.store.findMany({
            where: { id: { in: storeIds } },
            select: { id: true, nameEn: true, nameAr: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, nameEn: true, nameAr: true },
          })
        : Promise.resolve([]),
    ]);

    const map = new Map<string, { nameEn: string; nameAr: string }>();
    for (const store of stores) map.set(store.id, { nameEn: store.nameEn, nameAr: store.nameAr });
    for (const user of users) map.set(user.id, { nameEn: user.nameEn, nameAr: user.nameAr });
    return map;
  }

  private async assertOwnedConversation(
    backOfficeUserId: string,
    conversationId: string,
  ) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, backOfficeUserId },
      select: { id: true },
    });
    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }
  }

  /** Bumps lastMessage* / lastTimestamp after a new message is created. */
  private async touchConversation(
    conversationId: string,
    content: string,
  ): Promise<void> {
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageEn: content,
        lastMessageAr: content,
        lastTimestamp: new Date(),
      },
    });
  }

  /**
   * Recomputes unreadCount for a conversation: messages addressed to the
   * conversation owner that are still unread (operator messages for the
   * store owner; partner messages for the operator).
   */
  private async syncUnreadCount(
    conversationId: string,
    ownerType: 'store' | 'back_office',
  ): Promise<void> {
    const unreadCount = await this.prisma.chatMessage.count({
      where: {
        conversationId,
        isRead: false,
        senderType: ownerType === 'store' ? 'back_office' : { not: 'back_office' },
      },
    });
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { unreadCount },
    });
  }
}
