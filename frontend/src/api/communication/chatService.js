/**
 * ChatService - Real-time communication service layer
 * Coordinates localStorage persistence and cross-tab/cross-role BroadcastChannel communication.
 */

import { communicationBus } from './broadcastBus';
import { getStoredAuth } from '../apiClient';
import {
  getStoredThreads,
  getStoredThreadById,
  saveThreads,
  appendMessage,
  markThreadAsReadInStorage,
  updateThreadRentalInStorage,
  upsertCustomerChatThread,
  DEMO_CUSTOMERS,
  getSafeAvatar
} from './chatStorage';

export const CHAT_EVENTS = {
  MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
  THREAD_READ: 'CHAT_THREAD_READ',
  RENTAL_UPDATED: 'CHAT_RENTAL_UPDATED'
};

const getChatAuthHeaders = () => {
  const token = getStoredAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const chatService = {
  getThreads() {
    return getStoredThreads();
  },

  getThreadById(threadId) {
    return getStoredThreadById(threadId);
  },

  upsertCustomerThread(payload) {
    const result = upsertCustomerChatThread(payload);
    if (result) {
      communicationBus.postMessage({ type: CHAT_EVENTS.RENTAL_UPDATED, threadId: result.thread.id, thread: result.thread, timestamp: Date.now() });
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
  async sendMessage({ threadId, sender, text, senderName = '', meta = {} }) {
    if (!threadId || !text?.trim()) return null;

    const currentThread = getStoredThreadById(threadId);
    const authUserId = Number(getStoredAuth()?.user?.userId);
    const customerId = Number(currentThread?.participantUserId) || (sender === 'customer' ? authUserId : 0);
    const senderId = sender === 'expert' ? authUserId : customerId;
    if (!Number.isInteger(senderId) || senderId <= 0) throw new Error('Không xác định được người gửi tin nhắn');

    let conversationId = Number(currentThread?.conversationId);
    if (!conversationId && customerId > 0) {
      const conversationResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getChatAuthHeaders() },
        body: JSON.stringify({ participantOne: customerId, participantTwo: sender === 'expert' ? senderId : 5, type: sender === 'worker' ? 'STAFF_EXP' : 'CUST_EXP' })
      });
      const conversationPayload = await conversationResponse.json();
      if (!conversationResponse.ok || !conversationPayload.success) throw new Error(conversationPayload.message || 'Không thể mở hội thoại');
      conversationId = Number(conversationPayload.data?.conversationId);
      if (!conversationId) throw new Error('Hội thoại thiếu mã định danh');
      this.setThreadConversationId(threadId, conversationId);
    }
    if (!conversationId) throw new Error('Không tìm thấy hội thoại để gửi tin nhắn');

    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getChatAuthHeaders() },
      body: JSON.stringify({ senderId, content: text.trim(), attachmentUrl: meta?.photoUrl || null })
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Gửi tin nhắn thất bại');

    const messageMeta = sender === 'customer'
      ? Object.fromEntries(Object.entries(meta).filter(([key]) => !['plotCode', 'plotContext', 'crop'].includes(key)))
      : meta;

    const result = appendMessage(threadId, {
      id: payload.data?.messageId || Date.now(),
      backendMessageId: payload.data?.messageId || null,
      conversationId,
      sender,
      text: text.trim(),
      senderName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...messageMeta
    });

    if (result) {
      communicationBus.postMessage({
        type: CHAT_EVENTS.MESSAGE_SENT,
        threadId,
        message: result.message,
        thread: result.thread,
        timestamp: Date.now()
      });

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
      if (event.key === 'farmely_chat_threads_v9') {
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

  async syncBackendMessages({ role, userId } = {}) {
    try {
      if (!userId) return;
      const query = role === 'expert' ? `expertId=${userId}` : `userId=${userId}`;
      const res = await fetch(`/api/conversations?${query}`, { headers: getChatAuthHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      const backendConvs = json?.data;
      if (!Array.isArray(backendConvs) || backendConvs.length === 0) return;

      const threads = getStoredThreads();
      let hasNewOverall = false;

      const customerGroups = new Map();
      backendConvs.filter((conversation) => conversation.type === 'CUST_EXP').forEach((conversation) => {
        const firstId = Number(conversation.participantOne);
        const secondId = Number(conversation.participantTwo);
        const customerId = firstId === 5 ? secondId : firstId;
        const expertId = firstId === 5 ? firstId : secondId;
        if (!customerId) return;
        const key = `${customerId}:${expertId || 5}`;
        if (!customerGroups.has(key)) customerGroups.set(key, { customerId, expertId: expertId || 5, conversations: [] });
        customerGroups.get(key).conversations.push(conversation);
      });

      customerGroups.forEach(({ customerId, expertId, conversations }) => {
        const knownCustomer = DEMO_CUSTOMERS.find((customer) => Number(customer.userId) === customerId);
        const conversationIds = conversations.map((conversation) => Number(conversation.conversationId)).filter(Boolean);
        const backendMessages = conversations.flatMap((conversation) => (conversation.messages || []).map((message) => {
          const text = message.text || message.content || '';
          const senderId = Number(message.senderId);
          const sender = message.sender || (senderId === expertId ? 'expert' : 'customer');
          return {
            id: message.messageId || message.id || `${conversation.conversationId}-${text}`,
            backendMessageId: message.messageId || message.id || null,
            conversationId: Number(conversation.conversationId),
            sender,
            senderId: message.senderId,
            senderName: message.senderName || (sender === 'expert' ? 'Chuyên gia' : 'Khách hàng'),
            text,
            time: message.time || 'Vừa xong',
            createdAt: message.createdAt,
            seen: true
          };
        }));

        const customerName = backendMessages.find((message) => message.sender !== 'expert')?.senderName;
        const candidates = threads.filter((thread) => thread.role === 'customer' && (
          Number(thread.participantUserId) === customerId ||
          (knownCustomer && (thread.id === knownCustomer.threadId || String(thread.customerEmail || '').toLowerCase() === knownCustomer.email.toLowerCase())) ||
          (thread.conversationIds || []).some((id) => conversationIds.includes(Number(id))) ||
          conversationIds.includes(Number(thread.conversationId)) ||
          (customerName && String(thread.customerName || '').trim().toLowerCase() === customerName.trim().toLowerCase())
        ));
        const existing = candidates[0] || null;
        const directConversation = [...conversations].sort((a, b) => Number(a.conversationId) - Number(b.conversationId))[0];
        const oldMessages = candidates.flatMap((thread) => thread.messages || []);
        const mergedMessages = [...oldMessages, ...backendMessages];
        const uniqueMessages = mergedMessages.filter((message, index, all) => {
          const messageId = message.backendMessageId || message.id;
          return all.findIndex((candidate) => String(candidate.backendMessageId || candidate.id) === String(messageId)
            && candidate.text === message.text && candidate.sender === message.sender) === index;
        }).sort((a, b) => {
          const timeA = Date.parse(a.createdAt || '') || (Number(a.id) > 1e12 ? Number(a.id) : 0);
          const timeB = Date.parse(b.createdAt || '') || (Number(b.id) > 1e12 ? Number(b.id) : 0);
          return timeA - timeB;
        });
        const threadId = existing?.id || knownCustomer?.threadId || `CONS-${customerId}`;
        const thread = upsertCustomerChatThread({
          threadId,
          conversationId: directConversation?.conversationId,
          participantUserId: customerId,
          customerName: customerName || existing?.customerName || knownCustomer?.name || `Khách hàng #${customerId}`,
          customerEmail: existing?.customerEmail || knownCustomer?.email,
          customerAvatar: existing?.customerAvatar
        })?.thread;
        if (!thread) return;
        thread.conversationIds = conversationIds;
        thread.messages = uniqueMessages;
        thread.lastTime = uniqueMessages.at(-1)?.time || 'Chưa có tin nhắn';
        thread.status = uniqueMessages.at(-1)?.sender === 'customer' ? 'PENDING' : 'REPLIED';
        thread.unread = existing?.unread || false;

        const candidateIds = new Set(candidates.map((candidate) => candidate.id));
        const currentIndex = threads.findIndex((candidate) => candidate.id === thread.id);
        threads.splice(currentIndex >= 0 ? currentIndex : threads.length, currentIndex >= 0 ? 1 : 0, thread);
        for (let index = threads.length - 1; index >= 0; index -= 1) {
          if (threads[index].id !== thread.id && candidateIds.has(threads[index].id)) threads.splice(index, 1);
        }
        hasNewOverall = true;
      });

      backendConvs.filter((conversation) => ['ADMIN_EXP', 'STAFF_EXP'].includes(conversation.type)).forEach((bConv) => {
        let threadIndex = threads.findIndex((t) =>
          (bConv.conversationId && Number(t.conversationId) === Number(bConv.conversationId)) ||
          t.id === bConv.id ||
          (bConv.conversationId && (t.id === `CONS-${bConv.conversationId}` || t.conversationId === bConv.conversationId)) ||
          (bConv.customerName && t.customerName && t.customerName.toLowerCase() === bConv.customerName.toLowerCase())
        );

        const partnerRole = bConv.role === 'admin' ? 'admin' : 'worker';
        const thread = threadIndex >= 0
          ? { ...threads[threadIndex] }
          : {
              id: bConv.id || `CONS-${bConv.conversationId}`,
              conversationId: Number(bConv.conversationId),
              conversationIds: [Number(bConv.conversationId)],
              participantUserId: Number(bConv.participantOneId) || undefined,
              role: partnerRole,
              roleLabel: bConv.roleLabel || (partnerRole === 'admin' ? 'Ban Quản Trị' : 'CVLĐ Hiện Trường'),
              category: partnerRole,
              customerName: bConv.customerName || (partnerRole === 'admin' ? 'Ban Quản Trị Farmely' : 'Nhân viên hiện trường'),
              customerEmail: bConv.customerEmail || '',
              customerAvatar: getSafeAvatar(null, partnerRole),
              expertName: bConv.expertName || '',
              isOnline: false,
              lastTime: 'Chưa có tin nhắn',
              status: 'REPLIED',
              unread: false,
              messages: []
            };
        thread.conversationId = Number(bConv.conversationId);
        thread.conversationIds = [...new Set([...(thread.conversationIds || []), Number(bConv.conversationId)].filter(Boolean))];
        thread.role = partnerRole;
        thread.roleLabel = bConv.roleLabel || thread.roleLabel;
        thread.category = partnerRole;

        if (Array.isArray(bConv.messages) && bConv.messages.length > 0) {
          const currentIds = new Set(thread.messages.map((message) => String(message.backendMessageId || message.id)));
          bConv.messages.forEach((bMsg) => {
            const messageText = bMsg.text || bMsg.content || '';
            const messageId = bMsg.id || bMsg.messageId || `${bConv.conversationId}-${messageText}`;
            if (!currentIds.has(String(messageId))) {
              hasNewOverall = true;
              thread.messages.push({
                id: messageId,
                backendMessageId: bMsg.messageId || bMsg.id || null,
                conversationId: Number(bConv.conversationId),
                sender: bMsg.sender || (Number(bMsg.senderId) === 5 ? 'expert' : partnerRole),
                senderId: bMsg.senderId,
                senderName: bMsg.senderName,
                text: messageText,
                time: bMsg.time || 'Vừa xong',
                seen: true
              });
            }
          });
        }
        const latestMessage = thread.messages.at(-1);
        if (latestMessage) {
          thread.lastTime = latestMessage.time || 'Vừa xong';
          thread.status = latestMessage.sender === 'expert' ? 'REPLIED' : 'PENDING';
        }
        if (threadIndex >= 0) threads[threadIndex] = thread;
        else threads.push(thread);
        hasNewOverall = true;
      });

      if (hasNewOverall) {
        saveThreads(threads);
        communicationBus.postMessage({ type: CHAT_EVENTS.RENTAL_UPDATED, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('[Chat] Đồng bộ hội thoại thất bại:', error);
    }
  }
};

