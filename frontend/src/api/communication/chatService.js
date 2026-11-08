/**
 * ChatService - Real-time communication service layer
 * Coordinates localStorage persistence and cross-tab/cross-role BroadcastChannel communication.
 */

import { communicationBus } from './broadcastBus';
import { useAuthStore } from '../../stores/authStore';
import {
  getStoredThreads,
  getStoredThreadById,
  saveThreads,
  appendMessage,
  markThreadAsReadInStorage,
  updateThreadRentalInStorage,
  upsertPlotChatThread,
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
  async getMyActiveRentals() {
    const token = useAuthStore.getState().token || useAuthStore.getState().user?.token;
    if (!token) return [];
    const response = await fetch('/api/conversations/my-rentals', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Không tải được danh sách thửa đang thuê.');
    const result = await response.json();
    return result.data || [];
  },

  async sendPlotMessage({ rentalId, plotCode, text = '', senderName }) {
    const auth = useAuthStore.getState();
    const token = auth.token || auth.user?.token;
    if (!token) throw new Error('Vui lòng đăng nhập để nhắn cho chuyên gia.');
    const response = await fetch('/api/conversations/plot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rentalId, content: text.trim() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Không gửi được tin nhắn cho thửa đất.');
    }
    const result = await response.json();
    const threadId = `CONS-RENTAL-${rentalId}`;
    const threads = getStoredThreads().filter((thread) => thread.id !== threadId || thread.conversationId);
    if (!threads.some((thread) => thread.id === threadId)) {
      threads.unshift({ id: threadId, conversationId: result.data.conversationId,
        role: 'customer', roleLabel: 'Khách thuê đất', category: 'expert',
        rentalStatus: 'RENTED', rentalId: Number(rentalId), plotCode,
        plotName: `Thửa ${plotCode}`, customerName: senderName,
        customerEmail: auth.user?.email || '', expertName: 'ThS. Nguyễn Hoàng Nam',
        messages: [], status: 'PENDING' });
      saveThreads(threads);
    } else {
      saveThreads(threads);
      this.setThreadConversationId(threadId, result.data.conversationId);
    }
    return text.trim()
      ? this.sendMessage({ threadId, sender: 'customer', senderName, text, meta: { localOnly: true, serverMessageId: result.data.messageId } })
      : getStoredThreadById(threadId);
  },
  async sendPreRentalMessage({ text, senderName }) {
    const auth = useAuthStore.getState();
    const token = auth.token || auth.user?.token;
    if (!token) throw new Error('Vui lòng đăng nhập để nhắn cho chuyên gia.');
    const response = await fetch('/api/conversations/pre-rental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: text.trim() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Không gửi được tin nhắn. Vui lòng thử lại.');
    }
    const result = await response.json();
    const threadId = `CONS-CUSTOMER-${auth.user?.userId || auth.user?.id || auth.user?.email || 'CUSTOMER'}`;
    const threads = getStoredThreads().filter((thread) => thread.id !== threadId || thread.conversationId);
    saveThreads(threads);
    const existing = threads.find((thread) => thread.id === threadId);
    if (!existing) {
      threads.unshift({ id: threadId, role: 'customer', roleLabel: 'Khách tư vấn trước thuê',
        category: 'expert', rentalStatus: 'NOT_RENTED', rentalId: null,
        customerName: senderName, customerEmail: auth.user?.email || '',
        expertName: 'ThS. Nguyễn Hoàng Nam', messages: [], status: 'PENDING' });
      saveThreads(threads);
    }
    this.setThreadConversationId(threadId, result.data.conversationId);
    return this.sendMessage({ threadId, sender: 'customer', senderName, text, meta: { localOnly: true, serverMessageId: result.data.messageId } });
  },
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
        if (numericConvId && !meta.localOnly) fetch(`/api/conversations/${numericConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().token || useAuthStore.getState().user?.token || ''}` },
          body: JSON.stringify({
            senderId: useAuthStore.getState().user?.userId || (sender === 'expert' ? 5 : (sender === 'worker' ? 8 : 1)),
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
      const token = useAuthStore.getState().token || useAuthStore.getState().user?.token;
      if (!token) return;
      const res = await fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      const backendConvs = json?.data;
      if (!Array.isArray(backendConvs)) return;

      const threads = getStoredThreads();
      let hasNewOverall = false;
      const backendIds = new Set(backendConvs.map((conv) => Number(conv.conversationId)));
      const canonicalIds = new Map(backendConvs.filter((conv) => conv.type === 'CUST_EXP').map((conv) => [
        Number(conv.conversationId),
        conv.rentalId ? `CONS-RENTAL-${conv.rentalId}` : conv.plotId
          ? `CONS-${conv.participantOneId}-PLOT-${String(conv.plotCode || `P-${conv.plotId}`).replace(/[^a-zA-Z0-9]/g, '_')}`
          : `CONS-CUSTOMER-${conv.participantOneId}`
      ]));
      const currentAuth = useAuthStore.getState().user;
      const isExpert = currentAuth?.role === 'EXPERT';
      for (let i = threads.length - 1; i >= 0; i -= 1) {
        const thread = threads[i];
        if (thread.role !== 'customer') continue;
        const ownThread = currentAuth?.role === 'CUSTOMER' && (
          thread.customerEmail?.toLowerCase() === currentAuth.email?.toLowerCase() ||
          thread.customerName === currentAuth.fullName ||
          thread.id === 'CONS-401' || thread.id === `CONS-${currentAuth.id}`
        );
        if ((isExpert || ownThread) && (!thread.conversationId || !backendIds.has(Number(thread.conversationId)) ||
          (canonicalIds.has(Number(thread.conversationId)) && thread.id !== canonicalIds.get(Number(thread.conversationId))))) {
          threads.splice(i, 1);
          hasNewOverall = true;
        }
      }

      // Older widget messages were browser-only; remove the false "sent" copy.
      const currentUser = useAuthStore.getState().user;
      const legacyWidgetId = `CONS-${currentUser?.id || currentUser?.email || 'CUSTOMER'}`;
      for (let i = threads.length - 1; i >= 0; i -= 1) {
        if (threads[i].id === legacyWidgetId && !threads[i].conversationId) {
          threads.splice(i, 1);
          hasNewOverall = true;
        }
      }

      // A rental starts a fresh plot conversation; pre-rental inquiries never carry over.
      const rentedCustomers = new Set(backendConvs.filter((conv) => conv.rentalId).map((conv) => Number(conv.participantOneId)));
      const activeConversations = new Set(backendConvs.map((conv) => Number(conv.conversationId)));
      for (let i = threads.length - 1; i >= 0; i -= 1) {
        const thread = threads[i];
        if (thread.rentalStatus === 'NOT_RENTED' && rentedCustomers.has(Number(thread.participantOneId))) {
          threads.splice(i, 1);
          hasNewOverall = true;
        } else if (thread.rentalStatus === 'NOT_RENTED' && thread.conversationId && !activeConversations.has(Number(thread.conversationId))) {
          threads.splice(i, 1);
          hasNewOverall = true;
        }
      }

      backendConvs.forEach((bConv) => {
        const threadIndex = threads.findIndex((t) =>
          bConv.conversationId && Number(t.conversationId) === Number(bConv.conversationId)
        );

        if (threadIndex >= 0) {
          const thread = { ...threads[threadIndex] };
          if (thread.conversationId !== bConv.conversationId || thread.participantOneId !== bConv.participantOneId || thread.rentalStatus !== (bConv.rentalId ? 'RENTED' : 'NOT_RENTED')) hasNewOverall = true;
          thread.conversationId = bConv.conversationId;
          thread.participantOneId = bConv.participantOneId;
          thread.rentalId = bConv.rentalId || null;
          thread.rentalStatus = bConv.rentalId ? 'RENTED' : 'NOT_RENTED';
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
        } else if (bConv.type === 'CUST_EXP') {
          const plotCode = bConv.plotCode || (bConv.plotId ? `P-${bConv.plotId}` : '');
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
            id: bConv.rentalId ? `CONS-RENTAL-${bConv.rentalId}` : bConv.plotId ? `CONS-${bConv.participantOneId}-PLOT-${plotCode.replace(/[^a-zA-Z0-9]/g, '_')}` : `CONS-CUSTOMER-${bConv.participantOneId}`,
            conversationId: bConv.conversationId,
            participantOneId: bConv.participantOneId,
            role: 'customer', roleLabel: bConv.rentalId ? 'Khách thuê đất' : 'Khách tư vấn trước thuê', category: 'expert', plotChat: Boolean(bConv.plotId),
            rentalStatus: bConv.rentalId ? 'RENTED' : 'NOT_RENTED', rentalId: bConv.rentalId || null,
            customerName: bConv.customerName || messages.find((message) => message.sender !== 'expert')?.senderName || `Khách hàng #${bConv.participantOneId || ''}`,
            customerEmail: bConv.customerEmail || '',
            customerAvatar: getSafeAvatar(null, 'customer'), plotCode, plotName: bConv.plotName || (plotCode ? `Thửa ${plotCode}` : ''),
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

