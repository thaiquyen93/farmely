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
  async sendMessage({ threadId, sender, text, senderName = '', senderUserId = null, expertId = 5, meta = {} }) {
    if (!threadId || !text?.trim()) return null;

    const currentThread = getStoredThreadById(threadId);
    const storedAuthUser = getStoredAuth()?.user;
    const authUserId = Number(senderUserId || storedAuthUser?.userId || (typeof storedAuthUser?.id === 'number' ? storedAuthUser.id : 0));

    let customerId = 0;
    let targetExpertId = Number(currentThread?.expertId) || Number(expertId) || 5;
    let senderId = 0;

    if (sender === 'expert') {
      senderId = authUserId;
      targetExpertId = authUserId || targetExpertId;
      customerId = Number(currentThread?.participantUserId) || 0;
      if (!customerId || customerId === senderId) {
        const matchedDemo = DEMO_CUSTOMERS.find((c) => c.threadId === threadId);
        if (matchedDemo) {
          customerId = Number(matchedDemo.userId);
        } else {
          const idMatch = String(threadId).match(/^CONS-(?:USER-)?(\d+)$/);
          if (idMatch) customerId = Number(idMatch[1]);
        }
      }
      if (!Number.isInteger(senderId) || senderId <= 0) {
        throw new Error('Không xác định được tài khoản chuyên gia đang gửi');
      }
      if (!Number.isInteger(customerId) || customerId <= 0 || customerId === senderId) {
        throw new Error('Không xác định được người nhận cuộc hội thoại');
      }
    } else {
      senderId = authUserId;
      customerId = authUserId;
      if (!Number.isInteger(senderId) || senderId <= 0) {
        throw new Error('Vui lòng đăng nhập để gửi tin nhắn cho chuyên gia');
      }
    }

    let conversationId = Number(currentThread?.conversationId);
    if (!conversationId && customerId > 0) {
      const convType = currentThread?.role === 'admin'
        ? 'ADMIN_EXP'
        : (sender === 'worker' || currentThread?.role === 'worker')
          ? 'STAFF_EXP'
          : 'CUST_EXP';
      const conversationResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getChatAuthHeaders() },
        body: JSON.stringify({ participantOne: customerId, participantTwo: targetExpertId, type: convType })
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
      body: JSON.stringify({
        senderId,
        senderName: senderName || undefined,
        content: text.trim(),
        attachmentUrl: meta?.photoUrl || null
      })
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
      senderId,
      text: text.trim(),
      senderName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: payload.data?.createdAt || new Date().toISOString(),
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
    if (!result) return null;
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
      const currentUserId = Number(userId);
      if (!currentUserId) return;
      const query = role === 'expert' ? `expertId=${currentUserId}` : `userId=${currentUserId}`;
      const res = await fetch(`/api/conversations?${query}`, { headers: getChatAuthHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      const backendConvs = json?.data;
      if (!Array.isArray(backendConvs) || backendConvs.length === 0) return;

      const threads = getStoredThreads();
      let hasNewOverall = false;

      const customerGroups = new Map();
      backendConvs
        .filter((conversation) => (
          conversation.type === 'CUST_EXP' &&
          conversation.role !== 'admin' &&
          !/Ban Quản Trị|Admin/i.test(conversation.customerName || '')
        ))
        .forEach((conversation) => {
          const firstId = Number(conversation.participantOne);
          const secondId = Number(conversation.participantTwo);
          if (firstId !== currentUserId && secondId !== currentUserId) return;
          if (!firstId || !secondId || firstId === secondId) return;

          const expertId = role === 'expert'
            ? currentUserId
            : (firstId === currentUserId ? secondId : firstId);
          const customerId = role === 'expert'
            ? (firstId === currentUserId ? secondId : firstId)
            : currentUserId;
          if (!customerId || !expertId || customerId === expertId) return;

          const key = `${customerId}:${expertId}`;
          if (!customerGroups.has(key)) customerGroups.set(key, { customerId, expertId, conversations: [] });
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
            photoUrl: message.photoUrl || message.attachmentUrl || null,
            time: message.time || 'Vừa xong',
            createdAt: message.createdAt,
            seen: true
          };
        }));

        const convCustomerName = conversations.find((c) => c.customerName)?.customerName;
        const convCustomerEmail = conversations.find((c) => c.customerEmail)?.customerEmail;
        const convExpertName = conversations.find((c) => c.expertName)?.expertName;
        const customerName = convCustomerName || backendMessages.find((message) => message.sender !== 'expert')?.senderName;

        const candidates = threads.filter((thread) => thread.role === 'customer' && (
          Number(thread.participantUserId) === customerId ||
          thread.id === `CONS-USER-${customerId}` ||
          (knownCustomer && (thread.id === knownCustomer.threadId || String(thread.customerEmail || '').toLowerCase() === knownCustomer.email.toLowerCase())
            && (!Number(thread.participantUserId) || Number(thread.participantUserId) === customerId)) ||
          (thread.conversationIds || []).some((id) => conversationIds.includes(Number(id))) ||
          conversationIds.includes(Number(thread.conversationId))
        ));
        const existing = candidates[0] || null;
        const directConversation = [...conversations].sort((a, b) => Number(a.conversationId) - Number(b.conversationId))[0];
        const oldMessages = candidates.flatMap((thread) => thread.messages || []);

        const dedupedMessages = [];
        const msgKeyIndex = new Map();
        [...oldMessages, ...backendMessages].forEach((message) => {
          const messageId = message.backendMessageId || message.id;
          const key = `${String(messageId)}::${message.sender}::${message.text}`;
          if (!msgKeyIndex.has(key)) {
            msgKeyIndex.set(key, dedupedMessages.length);
            dedupedMessages.push({ ...message });
          } else {
            const idx = msgKeyIndex.get(key);
            dedupedMessages[idx] = {
              ...dedupedMessages[idx],
              ...message,
              createdAt: message.createdAt || dedupedMessages[idx].createdAt,
              photoUrl: message.photoUrl || dedupedMessages[idx].photoUrl,
              senderName: message.senderName || dedupedMessages[idx].senderName
            };
          }
        });
        const uniqueMessages = dedupedMessages.sort((a, b) => {
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
          customerEmail: convCustomerEmail || existing?.customerEmail || knownCustomer?.email,
          customerAvatar: existing?.customerAvatar
        })?.thread;
        if (!thread) return;
        thread.expertId = expertId;
        thread.expertName = convExpertName || thread.expertName || 'ThS. Nguyễn Hoàng Nam';
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
        const partnerRole = bConv.type === 'ADMIN_EXP' ? 'admin' : 'worker';
        const partnerId = Number(bConv.participantOne) === currentUserId ? Number(bConv.participantTwo) : Number(bConv.participantOne);
        const workerThreadId = partnerRole === 'worker' ? `WORK-${bConv.participantOne}` : '';
        let threadIndex = threads.findIndex((t) =>
          (bConv.conversationId && Number(t.conversationId) === Number(bConv.conversationId)) ||
          t.id === bConv.id ||
          (workerThreadId && t.id === workerThreadId) ||
          (bConv.conversationId && (t.id === `CONS-${bConv.conversationId}` || t.conversationId === bConv.conversationId)) ||
          (Number(t.participantUserId) > 0 && Number(t.participantUserId) === partnerId && t.role === partnerRole)
        );

        const thread = threadIndex >= 0
          ? { ...threads[threadIndex] }
          : {
              id: (role === 'worker' && workerThreadId) ? workerThreadId : (bConv.id || `CONS-${bConv.conversationId}`),
              conversationId: Number(bConv.conversationId),
              conversationIds: [Number(bConv.conversationId)],
              participantUserId: role === 'expert' ? partnerId : Number(bConv.participantOne),
              role: partnerRole,
              roleLabel: bConv.roleLabel || (partnerRole === 'admin' ? 'Ban Quản Trị' : 'CVLĐ Hiện Trường'),
              category: partnerRole,
              customerName: bConv.customerName || (partnerRole === 'admin' ? 'Ban Quản Trị Farmely' : 'Nhân viên hiện trường'),
              customerEmail: bConv.customerEmail || '',
              customerAvatar: getSafeAvatar(null, partnerRole),
              expertName: bConv.expertName || 'ThS. Nguyễn Hoàng Nam',
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
                sender: bMsg.sender || (Number(bMsg.senderId) === Number(bConv.participantTwo) ? 'expert' : partnerRole),
                senderId: bMsg.senderId,
                senderName: bMsg.senderName,
                text: messageText,
                photoUrl: bMsg.photoUrl || bMsg.attachmentUrl || null,
                time: bMsg.time || 'Vừa xong',
                createdAt: bMsg.createdAt,
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

