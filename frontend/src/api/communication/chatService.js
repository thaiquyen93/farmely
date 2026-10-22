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

      // Asynchronously sync with Backend Spring Boot service (Port 8087) if running
      try {
        const numericConvId = parseInt(String(threadId).replace(/\D/g, ''), 10) || 1;
        fetch(`/api/v1/conversations/${numericConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: sender === 'expert' ? 2 : (sender === 'worker' ? 3 : 6),
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
      const res = await fetch('/api/v1/conversations/1/messages');
      if (!res.ok) return;
      const json = await res.json();
      const backendMsgs = json?.data;
      if (!Array.isArray(backendMsgs) || backendMsgs.length === 0) return;

      const threads = getStoredThreads();
      const threadIndex = threads.findIndex((t) => t.id === 'CONS-401');
      if (threadIndex === -1) return;

      const thread = { ...threads[threadIndex] };
      const currentTexts = new Set(thread.messages.map((m) => m.text));

      let hasNew = false;
      const newMessages = [...thread.messages];

      backendMsgs.forEach((bMsg) => {
        if (!currentTexts.has(bMsg.content)) {
          hasNew = true;
          const isExp = Number(bMsg.senderId) === 5 ||
            Number(bMsg.senderId) === 2 ||
            String(bMsg.senderName || '').includes('Nam') ||
            String(bMsg.content || '').includes('Chào anh Quyền');
          const isWorker = Number(bMsg.senderId) === 8 ||
            Number(bMsg.senderId) === 3 ||
            String(bMsg.senderName || '').includes('Lực');

          let formattedTime = 'Vừa xong';
          if (bMsg.createdAt) {
            try {
              formattedTime = new Date(bMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (_) {}
          }

          newMessages.push({
            id: bMsg.messageId || (Date.now() + Math.random()),
            sender: isExp ? 'expert' : isWorker ? 'worker' : 'customer',
            senderName: isExp ? 'ThS. Nguyễn Hoàng Nam' : isWorker ? 'Trần Văn Lực' : (thread.customerName || 'Lô Thái Quyền'),
            text: bMsg.content,
            time: bMsg.time || formattedTime,
            seen: true
          });
        }
      });

      if (hasNew) {
        thread.messages = newMessages;
        threads[threadIndex] = thread;
        saveThreads(threads);
        communicationBus.postMessage({
          type: CHAT_EVENTS.MESSAGE_SENT,
          threadId: 'CONS-401',
          thread,
          timestamp: Date.now()
        });
      }
    } catch (_) {
      // offline fallback
    }
  }
};

