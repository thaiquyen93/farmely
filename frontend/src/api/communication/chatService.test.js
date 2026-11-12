import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatService } from './chatService';
import { saveThreads } from './chatStorage';

describe('backend conversation synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps equal names on separate customer accounts and merges conversations for one account', async () => {
    saveThreads([
      { id: 'rental-21', role: 'customer', participantUserId: 21, customerName: 'Nguyễn An', messages: [{ id: 'local', sender: 'customer', text: 'Local history' }] }
    ]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [
        { conversationId: 101, type: 'CUST_EXP', participantOne: 21, participantTwo: 5, messages: [{ messageId: 1, senderId: 21, senderName: 'Nguyễn An', content: 'First' }] },
        { conversationId: 102, type: 'CUST_EXP', participantOne: 21, participantTwo: 5, messages: [{ messageId: 2, senderId: 5, content: 'Reply' }] },
        { conversationId: 103, type: 'CUST_EXP', participantOne: 22, participantTwo: 5, messages: [{ messageId: 3, senderId: 22, senderName: 'Nguyễn An', content: 'Different account' }] }
      ] })
    }));

    await chatService.syncBackendMessages({ role: 'expert', userId: 5 });
    const threads = chatService.getThreads();
    expect(threads).toHaveLength(2);
    expect(threads.find((thread) => thread.participantUserId === 21).messages.map((message) => message.text))
      .toEqual(['Local history', 'First', 'Reply']);
    expect(threads.find((thread) => thread.participantUserId === 22).messages.map((message) => message.text))
      .toEqual(['Different account']);
  });
});
