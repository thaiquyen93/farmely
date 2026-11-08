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
  upsertPlotChatThread,
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

  upsertPlotThread(payload) {
    const result = upsertPlotChatThread(payload);
    if (result) {
      communicationBus.postMessage({ type: CHAT_EVENTS.RENTAL_UPDATED, threadId: payload.threadId, thread: result.thread, timestamp: Date.now() });
    }
    return result;
  },

  setThreadConversationId(threadId, conversationId) {
    if (!threadId || !conversationId) return null;
    const updated = getStoredThreads().map((thread) => thread.id === threadId ? { ...thread, conversationId: Number(conversationId) } : thread);
    saveThreads(updated);
    communicationBus.postMessage({ type: CHAT_EVENTS.RENTAL_UPDATED, threadId, timestamp: Date.now() });
    return updated.find((thread) => thread.id === threadId) || null;
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
        const numericConvId = getStoredThreadById(threadId)?.conversationId || (/^(CONS|WORK)-\d+$/.test(threadId) ? parseInt(threadId.replace(/\D/g, ''), 10) : null);
        if (numericConvId) fetch(`/api/conversations/${numericConvId}/messages`, {
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
          (bConv.conversationId && Number(t.conversationId) === Number(bConv.conversationId)) ||
          t.id === bConv.id ||
          (bConv.conversationId && (t.id === `CONS-${bConv.conversationId}` || t.conversationId === bConv.conversationId)) ||
          (bConv.plotId && t.plotChat && String(t.plotCode) === `P-${bConv.plotId}` && bConv.messages?.some((message) => message.senderName && message.senderName === t.customerName)) ||
          (!bConv.plotId && bConv.customerName && t.customerName && t.customerName.toLowerCase() === bConv.customerName.toLowerCase())
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
              const messageText = bMsg.text || bMsg.content || '';
              if (!currentTexts.has(messageText)) {
                hasNewOverall = true;
                const inquiry = messageText.match(/Mình đang xem (.+?) \((P-?\d+)\)(?: và quan tâm giống (.+?))?\. Nhờ chuyên gia tư vấn giúp mình\./i);
                thread.messages.push({
                  id: bMsg.id || bMsg.messageId || Date.now() + Math.random(),
                  sender: bMsg.sender || (Number(bMsg.senderId) === 5 ? 'expert' : 'customer'),
                  senderId: bMsg.senderId,
                  senderName: bMsg.senderName,
                  text: messageText,
                  time: bMsg.time || 'Vừa xong',
                  seen: true,
                  ...(inquiry ? { plotContext: { plotName: inquiry[1], plotCode: inquiry[2], crop: inquiry[3] || '' } } : {})
                });
              }
            });
          }
          threads[threadIndex] = thread;
        } else if (bConv.plotId && bConv.type === 'CUST_EXP') {
          const plotCode = `P-${bConv.plotId}`;
          const messages = Array.isArray(bConv.messages) ? bConv.messages.map((bMsg) => {
            const text = bMsg.text || bMsg.content || '';
            const inquiry = text.match(/Mình đang xem (.+?) \((P-?\d+)\)(?: và quan tâm giống (.+?))?\. Nhờ chuyên gia tư vấn giúp mình\./i);
            const plotContext = inquiry ? { plotName: inquiry[1], plotCode: inquiry[2], crop: inquiry[3] || '' } : undefined;
            return {
              id: bMsg.id || bMsg.messageId || Date.now() + Math.random(),
              sender: bMsg.sender || (Number(bMsg.senderId) === 5 ? 'expert' : 'customer'),
              senderId: bMsg.senderId,
              senderName: bMsg.senderName || 'Khách hàng',
              text,
              time: bMsg.time || 'Vừa xong',
              seen: true,
              ...(plotContext ? { plotContext } : {})
            };
          }) : [];
          threads.unshift({
            id: `CONS-${bConv.participantOne || 'CUSTOMER'}-PLOT-${plotCode.replace(/[^a-zA-Z0-9]/g, '_')}`,
            conversationId: bConv.conversationId,
            role: 'customer', roleLabel: bConv.rentalId ? 'Khách thuê đất' : 'Khách tư vấn trước thuê', category: 'expert', plotChat: true,
            rentalStatus: bConv.rentalId ? 'RENTED' : 'NOT_RENTED', rentalId: bConv.rentalId || null,
            customerName: messages.find((message) => message.sender !== 'expert')?.senderName || `Khách hàng #${bConv.participantOne || ''}`,
            customerAvatar: getSafeAvatar(null, 'customer'), plotCode, plotName: `Thửa ${plotCode}`,
            crop: messages.find((message) => message.plotContext)?.plotContext.crop || '',
            stage: bConv.rentalId ? 'Đang thuê thửa đất' : 'Đang tìm hiểu thửa đất', expertName: 'ThS. Nguyễn Hoàng Nam', isOnline: false,
            lastTime: messages.at(-1)?.time || 'Chưa có tin nhắn',
            status: messages.some((message) => message.sender !== 'expert') ? 'PENDING' : 'REPLIED', unread: false, messages
          });
          hasNewOverall = true;
        }
      });

      if (hasNewOverall) {
        saveThreads(threads);
        communicationBus.postMessage({ type: CHAT_EVENTS.RENTAL_UPDATED, timestamp: Date.now() });
      }
    } catch (_) {
      // offline fallback
    }
  }
};

