import { describe, expect, it } from 'vitest';
import { INITIAL_CONVERSATIONS, getConversations, sendChatMessage } from './api';

describe('chat API (back office)', () => {
  it('returns all conversations', async () => {
    const conversations = await getConversations();
    expect(conversations).toHaveLength(INITIAL_CONVERSATIONS.length);
  });

  it('conversations reference a customer or store partner', async () => {
    const conversations = await getConversations();
    for (const conversation of conversations) {
      expect(['customer', 'store']).toContain(conversation.type);
      expect(conversation.partnerNameEn).toBeTruthy();
    }
  });

  it('appends a message and bumps the last-message metadata', async () => {
    const before = await getConversations();
    const conversation = before[0];
    const messagesBefore = conversation.messages.length;

    const message = await sendChatMessage(
      conversation.id,
      'back_office',
      'On its way!',
      'في الطريق!'
    );

    expect(message.sender).toBe('back_office');
    expect(message.textEn).toBe('On its way!');
    expect(conversation.messages).toHaveLength(messagesBefore + 1);
    expect(conversation.lastMessageEn).toBe('On its way!');
    expect(conversation.unreadCount).toBe(0);
  });

  it('rejects messages for unknown conversations', async () => {
    await expect(sendChatMessage('nope', 'back_office', 'hi', 'مرحبا')).rejects.toThrow(
      'Conversation not found'
    );
  });
});
