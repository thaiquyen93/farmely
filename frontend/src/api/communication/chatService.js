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

      // Asynchronously sync with Backend PostgreSQL / Spring Boot service
      try {
        const numericConvId = parseInt(String(threadId).replace(/\D/g, ''), 10) || 1;
        fetch(`/api/conversations/${numericConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: sender === 'expert' ? 5 : (sender === 'worker' ? 8 : 1),
            senderName,
            content: text.trim(),
            attachmentUrl: meta?.photoUrl || null
          })
        }).catch(() => {
          // Gracefully fallback to local storage if backend service is not running
        });
      } catch (e) {
        // ignore
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

  async syncBackendMessages() {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const json = await res.json();
      const backendConvs = json?.data;
      if (!Array.isArray(backendConvs) || backendConvs.length === 0) return;

      const threads = getStoredThreads();
      let hasNewOverall = false;

      backendConvs.forEach((bConv) => {
        const threadIndex = threads.findIndex((t) =>
          t.id === bConv.id ||
          (bConv.conversationId && (t.id === `CONS-${bConv.conversationId}` || t.conversationId === bConv.conversationId)) ||
          (bConv.customerName && t.customerName && t.customerName.toLowerCase() === bConv.customerName.toLowerCase())
        );

        if (threadIndex >= 0) {
          const thread = { ...threads[threadIndex] };
          thread.conversationId = bConv.conversationId;
          if (bConv.role) thread.role = bConv.role;
          if (bConv.roleLabel) thread.roleLabel = bConv.roleLabel;
          if (bConv.plotCode) thread.plotCode = bConv.plotCode;
          if (bConv.plotName) thread.plotName = bConv.plotName;
          if (bConv.crop) thread.crop = bConv.crop;

          if (Array.isArray(bConv.messages) && bConv.messages.length > 0) {
            const currentTexts = new Set(thread.messages.map((m) => m.text));
            bConv.messages.forEach((bMsg) => {
              if (!currentTexts.has(bMsg.text)) {
                hasNewOverall = true;
                thread.messages.push({
                  id: bMsg.id || Date.now() + Math.random(),
                  sender: bMsg.sender,
                  senderId: bMsg.senderId,
                  senderName: bMsg.senderName,
                  text: bMsg.text,
                  time: bMsg.time || 'Vừa xong',
                  seen: true
                });
              }
            });
          }
          threads[threadIndex] = thread;
        }
      });

      if (hasNewOverall) {
        saveThreads(threads);
        communicationBus.postMessage({
          type: CHAT_EVENTS.SYNC_COMPLETED,
          timestamp: Date.now()
        });
      }
    } catch (_) {
      // offline fallback
    }
  }
};

