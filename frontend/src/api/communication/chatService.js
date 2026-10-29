/** Conversation data lives on the server. This cache only keeps the current view responsive. */
const threadCache = new Map();
const preferredConversations = new Map();
const listeners = new Set();

const publish = () => listeners.forEach((listener) => listener());
const parseBody = async (response) => {
  const body = await response.json();
  if (!response.ok || body?.success === false) throw new Error(body?.message || 'Không thể tải hội thoại.');
  return body?.data;
};

export const CHAT_EVENTS = { MESSAGE_SENT: 'CHAT_MESSAGE_SENT', THREAD_READ: 'CHAT_THREAD_READ' };

export const chatService = {
  getThreads(userId) { return threadCache.get(Number(userId)) || []; },
  getThreadById(threadId, userId) {
    return this.getThreads(userId).find((thread) => thread.id === threadId) || null;
  },
  async syncBackendMessages(userId, role = 'customer') {
    if (!Number(userId)) return [];
    const read = () => fetch(`/api/conversations?userId=${Number(userId)}`).then(parseBody);
    let preferredId = preferredConversations.get(Number(userId));
    if (role !== 'expert') {
      if (!preferredId) {
        const preferred = await fetch('/api/conversations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantOne: Number(userId), type: role === 'worker' ? 'STAFF_EXP' : 'CUST_EXP' })
        }).then(parseBody);
        preferredId = preferred?.conversationId;
        if (preferredId) preferredConversations.set(Number(userId), preferredId);
      }
    }
    const rows = await read();
    if (preferredId) rows.sort((a, b) => Number(b.conversationId === preferredId) - Number(a.conversationId === preferredId));
    const threads = rows.map((row) => ({
      ...row,
      id: `CONS-${row.conversationId}`,
      role: row.role || 'customer', category: row.role || 'customer',
      customerName: row.customerName || '', expertName: row.expertName || '',
      plotCode: row.plotCode || '', crop: row.crop || '',
      messages: Array.isArray(row.messages) ? row.messages : [],
      unread: false,
      lastMessage: row.messages?.at(-1)?.text || '',
      lastTime: row.messages?.at(-1)?.time || ''
    }));
    threadCache.set(Number(userId), threads);
    publish();
    return threads;
  },
  async sendMessage({ threadId, senderId, text, meta = {}, userId, role }) {
    const conversationId = Number(String(threadId || '').replace(/^CONS-/, ''));
    if (!conversationId || !senderId || !text?.trim()) throw new Error('Chưa chọn hội thoại.');
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, content: text.trim(), attachmentUrl: meta.photoUrl || null })
    }).then(parseBody);
    await this.syncBackendMessages(userId, role);
    return true;
  },
  markThreadAsRead() { publish(); },
  updateRentalContext() { publish(); },
  onChatUpdate(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }
};
