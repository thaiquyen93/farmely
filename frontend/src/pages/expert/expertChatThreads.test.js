import { describe, expect, it } from 'vitest';
import { getVisibleExpertThreads, resolveActiveExpertThread } from './expertChatThreads';

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

  it('includes an explicitly selected thread even before first message', () => {
    const threads = [
      { id: 'empty', role: 'customer', participantUserId: 2, messages: [], status: 'PENDING' },
      { id: 'customer', role: 'customer', participantUserId: 2, messages: [{ id: 2 }], status: 'PENDING' }
    ];
    expect(getVisibleExpertThreads(threads, 5, 'empty').map((thread) => thread.id)).toEqual(['empty', 'customer']);
  });

  it('keeps empty threads hidden by default, but resolves an explicitly opened direct plot thread', () => {
    const threads = [
      { id: 'CONS-401', role: 'customer', participantUserId: 1, customerName: 'Lô Thái Quyền', messages: [] },
      { id: 'self', role: 'customer', participantUserId: 5, customerName: 'Self', messages: [] }
    ];
    const visible = getVisibleExpertThreads(threads, 5);
    expect(visible).toEqual([]);

    expect(resolveActiveExpertThread(threads, visible, 'CONS-401', null, 5)).toBeNull();
    expect(resolveActiveExpertThread(threads, visible, 'CONS-401', 'CONS-401', 5)?.id).toBe('CONS-401');
    expect(resolveActiveExpertThread(threads, visible, 'self', 'self', 5)).toBeNull();
  });
});
