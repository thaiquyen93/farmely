/**
 * ChatService - Real-time communication service layer
 * Coordinates localStorage persistence and cross-tab/cross-role BroadcastChannel communication.
 */

import { communicationBus } from './broadcastBus';
import {
  getStoredThreads,
  getStoredThreadById,
  saveThreads,
  appendMessage,
  markThreadAsReadInStorage,
  updateThreadRentalInStorage,
  getSafeAvatar,
  DEMO_CUSTOMERS,
  DEMO_WORKERS,
  DEMO_EXPERTS
} from './chatStorage';

export const CHAT_EVENTS = {
  MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
  THREAD_READ: 'CHAT_THREAD_READ',
  RENTAL_UPDATED: 'CHAT_RENTAL_UPDATED'
};

export const chatService = {
  getThreads() {
    return getStoredThreads();
  },

  getThreadById(threadId) {
    return getStoredThreadById(threadId);
  },

  /**
   * Send a new message to a thread
   */
  sendMessage({ threadId, sender, text, senderName = '', meta = {} }) {
    if (!threadId || !text?.trim()) return null;

    const result = appendMessage(threadId, {
      id: Date.now(),
      sender,
      text: text.trim(),
      senderName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...meta
    });

    if (result) {
      communicationBus.postMessage({
        type: CHAT_EVENTS.MESSAGE_SENT,
        threadId,
        message: result.message,
        thread: result.thread,
        timestamp: Date.now()
      });

      // Only database-backed conversations have a real conversation ID.
      try {
        const conversationId = Number(result.thread.conversationId);
        const auth = JSON.parse(window.localStorage.getItem('farmely_auth') || '{}');
        const senderId = Number(auth.user?.userId);
        if (Number.isSafeInteger(conversationId) && conversationId > 0 && Number.isSafeInteger(senderId) && senderId > 0) {
          fetch(`/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, senderName, content: text.trim(), attachmentUrl: meta?.photoUrl || null })
          }).catch(() => {});
        }
      } catch (e) {
        // Keep the local draft when the backend is unavailable.
      }
    }

    return result;
  },

  /**
   * Mark a thread as read (clear unread badge)
   */
  markThreadAsRead(threadId) {
    if (!threadId) return null;

    const result = markThreadAsReadInStorage(threadId);
    if (result) {
      communicationBus.postMessage({
        type: CHAT_EVENTS.THREAD_READ,
        threadId,
        thread: result.thread,
        timestamp: Date.now()
      });
    }

    return result;
  },

  updateRentalContext(payload) {
    const result = updateThreadRentalInStorage(payload);
    communicationBus.postMessage({
      type: CHAT_EVENTS.RENTAL_UPDATED,
      threadId: payload.threadId,
      thread: result.thread,
      timestamp: Date.now()
    });
    return result;
  },

  /**
   * Listen for real-time chat updates across tabs or windows
   */
  onChatUpdate(callback) {
    const unsubscribeBus = communicationBus.subscribe((data) => {
      if (data?.type === CHAT_EVENTS.MESSAGE_SENT || data?.type === CHAT_EVENTS.THREAD_READ || data?.type === CHAT_EVENTS.RENTAL_UPDATED) {
        callback(data);
      }
    });

    // Also support storage event for different browser windows
    const handleStorage = (event) => {
      if (event.key === 'farmely_chat_threads_v6') {
        callback({ type: 'STORAGE_SYNC', timestamp: Date.now() });
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribeBus();
      window.removeEventListener('storage', handleStorage);
    };
  },

  getDemoCustomers() {
    return DEMO_CUSTOMERS;
  },

  getDemoWorkers() {
    return DEMO_WORKERS;
  },

  getDemoExperts() {
    return DEMO_EXPERTS;
  },

  async syncBackendMessages(userId) {
    try {
      const url = Number.isSafeInteger(Number(userId)) && Number(userId) > 0
        ? `/api/conversations?userId=${Number(userId)}`
        : '/api/conversations';
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const backendConvs = json?.data;
      if (!Array.isArray(backendConvs) || backendConvs.length === 0) return;

      const threads = getStoredThreads();
      backendConvs.forEach((bConv) => {
        const threadId = `CONS-${bConv.conversationId}`;
        const threadIndex = threads.findIndex((t) => t.id === threadId || Number(t.conversationId) === Number(bConv.conversationId));
        const previous = threadIndex >= 0 ? threads[threadIndex] : {};
        const messages = Array.isArray(bConv.messages) ? bConv.messages : [];
        const thread = {
          ...previous,
          id: threadId,
          conversationId: bConv.conversationId,
          participantOneId: bConv.participantOneId,
          participantTwoId: bConv.participantTwoId,
          rentalId: bConv.rentalId,
          plotId: bConv.plotId,
          type: bConv.type,
          backendStatus: bConv.status,
          role: bConv.role,
          roleLabel: bConv.roleLabel,
          customerName: bConv.customerName,
          customerAvatar: previous.customerAvatar || getSafeAvatar(null, bConv.role),
          plotCode: bConv.plotCode,
          plotName: bConv.plotName,
          crop: bConv.crop,
          messages,
          lastTime: messages.at(-1)?.time || previous.lastTime || '',
          status: previous.status || 'REPLIED',
          unread: previous.unread || false
        };
        if (threadIndex >= 0) threads[threadIndex] = thread;
        else threads.unshift(thread);
      });

      saveThreads(threads);
      communicationBus.postMessage({ type: CHAT_EVENTS.SYNC_COMPLETED, timestamp: Date.now() });
    } catch (_) {
      // offline fallback
    }
  }
};

