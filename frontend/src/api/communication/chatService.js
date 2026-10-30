/** Conversation data lives on the server. This cache only keeps the current view responsive. */
import { apiFetch, unwrapData } from '../apiClient';

const threadCache = new Map();
const listeners = new Set();

const publish = () => listeners.forEach((listener) => listener());

export const CHAT_EVENTS = { MESSAGE_SENT: 'CHAT_MESSAGE_SENT', THREAD_READ: 'CHAT_THREAD_READ' };

export const chatService = {
  getThreads(userId) { return threadCache.get(Number(userId)) || []; },
  getThreadById(threadId, userId) {
    return this.getThreads(userId).find((thread) => thread.id === threadId) || null;
  },
  async syncBackendMessages(userId, role = 'customer') {
    if (!Number(userId)) return [];
    const rows = unwrapData(await apiFetch(`/api/conversations?userId=${Number(userId)}`)) || [];
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
    await apiFetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ senderId, content: text.trim(), attachmentUrl: meta.photoUrl || null })
    });
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
