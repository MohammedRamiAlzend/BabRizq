/**
 * Unit tests for the chat mock API (`./api.ts`).
 */
import { describe, it, expect } from 'vitest';
import { INITIAL_CHAT_MESSAGES, getChatMessages, sendChatMessage } from './api';

describe('store-owner chat mock API', () => {
  it('exposes a bilingual thread with valid senders', () => {
    expect(INITIAL_CHAT_MESSAGES.length).toBeGreaterThan(0);
    for (const msg of INITIAL_CHAT_MESSAGES) {
      expect(['owner', 'admin']).toContain(msg.sender);
      expect(msg.textEn).toBeTruthy();
      expect(msg.textAr).toBeTruthy();
      expect(msg.timestamp).toBeTruthy();
    }
  });

  it('getChatMessages resolves the seed data', async () => {
    expect(await getChatMessages()).toEqual(INITIAL_CHAT_MESSAGES);
  });

  it('sendChatMessage appends a message with a fresh id', async () => {
    const before = INITIAL_CHAT_MESSAGES.length;
    const message = await sendChatMessage({
      sender: 'owner', textEn: 'Thanks!', textAr: 'شكراً!', timestamp: '2026-04-10T10:00:00Z',
    });
    expect(INITIAL_CHAT_MESSAGES.length).toBe(before + 1);
    expect(message.sender).toBe('owner');
  });
});
