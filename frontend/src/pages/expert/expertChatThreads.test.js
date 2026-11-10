import { describe, expect, it } from 'vitest';
import { getVisibleExpertThreads } from './expertChatThreads';

describe('expert inbox', () => {
  it('counts only conversations with messages from other accounts', () => {
    const threads = [
      { id: 'empty', role: 'customer', participantUserId: 2, messages: [], status: 'PENDING' },
      { id: 'self', role: 'customer', participantUserId: 5, messages: [{ id: 1 }], status: 'PENDING' },
      { id: 'customer', role: 'customer', participantUserId: 2, messages: [{ id: 2 }], status: 'PENDING' },
      { id: 'worker', role: 'worker', participantUserId: 9, messages: [{ id: 3 }], status: 'REPLIED' }
    ];
    expect(getVisibleExpertThreads(threads, 5).map((thread) => thread.id)).toEqual(['customer', 'worker']);
  });
});
