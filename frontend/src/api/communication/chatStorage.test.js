import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredThreads, saveThreads, updateThreadRentalInStorage } from './chatStorage';

describe('customer and expert chat synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps one conversation for a customer across multiple plots', () => {
    const first = updateThreadRentalInStorage({
      threadId: 'CONS-101',
      rentalId: 101,
      participantUserId: 21,
      customerName: 'Nguyễn An',
      plotCode: 'P-01',
      crop: 'Cà chua bi'
    });
    const second = updateThreadRentalInStorage({
      threadId: 'CONS-102',
      rentalId: 102,
      participantUserId: 21,
      customerName: 'Nguyễn An',
      plotCode: 'P-02',
      crop: 'Xà lách Romaine'
    });

    expect(first.thread.id).toBe('CONS-101');
    expect(second.thread.id).toBe('CONS-101');
    expect(getStoredThreads().filter((thread) => thread.customerName === 'Nguyễn An')).toHaveLength(1);
    expect(getStoredThreads().find((thread) => thread.id === 'CONS-101')).not.toHaveProperty('plotCode');
  });

  it('does not merge different accounts that share a name', () => {
    updateThreadRentalInStorage({ threadId: 'CONS-21', participantUserId: 21, customerName: 'Nguyễn An' });
    updateThreadRentalInStorage({ threadId: 'CONS-22', participantUserId: 22, customerName: 'Nguyễn An' });
    expect(getStoredThreads().map((thread) => thread.participantUserId)).toEqual([22, 21]);
  });

  it('preserves messages when merging duplicate threads from storage', () => {
    saveThreads([
      { id: 'first', role: 'customer', participantUserId: 21, messages: [{ id: 1, text: 'hello' }] },
      { id: 'second', role: 'customer', participantUserId: 21, messages: [{ id: 2, text: 'reply' }] }
    ]);
    const threads = getStoredThreads();
    expect(threads).toHaveLength(1);
    expect(threads[0].messages.map((message) => message.text)).toEqual(['hello', 'reply']);
  });

  it('joins an email-only rental thread to its account without crossing account IDs', () => {
    saveThreads([
      { id: 'rental', role: 'customer', customerEmail: 'a@example.com', messages: [{ id: 1, text: 'rental' }] },
      { id: 'account', role: 'customer', participantUserId: 21, customerEmail: 'a@example.com', messages: [{ id: 2, text: 'account' }] },
      { id: 'other', role: 'customer', participantUserId: 22, customerEmail: 'a@example.com', messages: [{ id: 3, text: 'other' }] }
    ]);
    const threads = getStoredThreads();
    expect(threads).toHaveLength(2);
    expect(threads[0].participantUserId).toBe(21);
    expect(threads[0].messages.map((message) => message.text)).toEqual(['rental', 'account']);
    expect(threads[1].messages.map((message) => message.text)).toEqual(['other']);
  });
});
