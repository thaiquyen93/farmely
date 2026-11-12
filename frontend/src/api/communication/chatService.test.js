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

  it('syncs customer conversations without overwriting participantUserId with expertId', async () => {
    saveThreads([
      { id: 'CONS-401', role: 'customer', participantUserId: 1, customerName: 'Lô Thái Quyền', customerEmail: 'customer@farmely.vn', messages: [] }
    ]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            conversationId: 1,
            type: 'CUST_EXP',
            participantOne: 1,
            participantTwo: 5,
            customerName: 'Lô Thái Quyền',
            expertName: 'ThS. Nguyễn Hoàng Nam',
            messages: [
              { messageId: 10, senderId: 1, senderName: 'Lô Thái Quyền', content: 'Em hỏi về cà chua bi', createdAt: '2026-11-10T10:00:00Z' },
              { messageId: 11, senderId: 5, senderName: 'ThS. Nguyễn Hoàng Nam', content: 'Độ ẩm 68% đạt chuẩn nhé', createdAt: '2026-11-10T10:01:00Z' }
            ]
          }
        ]
      })
    }));

    await chatService.syncBackendMessages({ role: 'customer', userId: 1 });
    const threads = chatService.getThreads();
    expect(threads).toHaveLength(1);
    const thread = threads[0];
    expect(thread.id).toBe('CONS-401');
    expect(thread.participantUserId).toBe(1);
    expect(thread.expertId).toBe(5);
    expect(thread.customerName).toBe('Lô Thái Quyền');
    expect(thread.messages.map((m) => [m.sender, m.text])).toEqual([
      ['customer', 'Em hỏi về cà chua bi'],
      ['expert', 'Độ ẩm 68% đạt chuẩn nhé']
    ]);
  });

  it('sends messages with true senderUserId for both customer and expert', async () => {
    saveThreads([
      { id: 'CONS-2', role: 'customer', participantUserId: 2, customerName: 'Đào Duy Anh', messages: [] }
    ]);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { conversationId: 2 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { messageId: 201 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { messageId: 202 } })
      });
    vi.stubGlobal('fetch', fetchMock);

    await chatService.sendMessage({
      threadId: 'CONS-2',
      sender: 'customer',
      senderUserId: 2,
      senderName: 'Đào Duy Anh',
      text: 'Chào chuyên gia'
    });

    await chatService.sendMessage({
      threadId: 'CONS-2',
      sender: 'expert',
      senderUserId: 5,
      senderName: 'ThS. Nguyễn Hoàng Nam',
      text: 'Chào Duy Anh'
    });

    const convBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(convBody).toEqual({ participantOne: 2, participantTwo: 5, type: 'CUST_EXP' });

    const custMsgBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(custMsgBody.senderId).toBe(2);
    expect(custMsgBody.content).toBe('Chào chuyên gia');

    const expMsgBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(expMsgBody.senderId).toBe(5);
    expect(expMsgBody.content).toBe('Chào Duy Anh');
  });

  it('heals corrupted CONS-401 and removes bogus expert self-threads from storage', () => {
    saveThreads([
      { id: 'CONS-USER-5', role: 'customer', participantUserId: 5, customerName: 'ThS. Nguyễn Hoàng Nam', messages: [] },
      { id: 'CONS-401', role: 'customer', participantUserId: 5, customerName: 'ThS. Nguyễn Hoàng Nam', messages: [{ id: 1, sender: 'customer', text: 'Hi' }] }
    ]);

    const threads = chatService.getThreads();
    expect(threads).toHaveLength(1);
    expect(threads[0].id).toBe('CONS-401');
    expect(threads[0].participantUserId).toBe(1);
    expect(threads[0].customerName).toBe('Lô Thái Quyền');
  });
});
