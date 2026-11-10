/**
 * ChatStorage - Manages persistence for conversations and messages in browser localStorage
 * Cleaned to SSoT: 1 Demo Customer (Lô Thái Quyền), 1 Field Worker (Trần Văn Lực), 1 Admin (Ban Quản Trị).
 * No dummy mock clutter. Real-time cross-tab synchronization.
 */

const STORAGE_KEY = 'farmely_chat_threads_v9';

export const DEMO_CUSTOMERS = [
  {
    id: 'CUST-01',
    threadId: 'CONS-401',
    userId: 1,
    name: 'Lô Thái Quyền',
    email: 'customer@farmely.vn',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    expertName: 'ThS. Nguyễn Hoàng Nam'
  }
];

export const DEFAULT_AVATARS = {
  customer: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  worker: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  expert: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  admin: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
};

export const getSafeAvatar = (url, role = 'customer') => {
  if (url && typeof url === 'string' && url.trim().length > 5 && !url.includes('placeholder')) {
    return url;
  }
  return DEFAULT_AVATARS[role] || DEFAULT_AVATARS.customer;
};

function mergeDuplicateCustomerThreads(threads) {
  const output = [];
  threads.forEach((thread) => {
    if (thread?.role !== 'customer') {
      output.push(thread);
      return;
    }
    const email = String(thread.customerEmail || '').trim().toLowerCase();
    const userId = Number(thread.participantUserId);
    const index = output.findIndex((candidate) => {
      if (candidate.role !== 'customer') return false;
      const candidateId = Number(candidate.participantUserId);
      const candidateEmail = String(candidate.customerEmail || '').trim().toLowerCase();
      if (userId && candidateId && userId !== candidateId) return false;
      return Boolean((userId && candidateId === userId) || (email && candidateEmail === email));
    });
    if (index < 0) {
      output.push(thread);
      return;
    }

    const existing = output[index];
    const messages = [...(existing.messages || []), ...(thread.messages || [])];
    const seenMessages = new Set();
    const mergedMessages = messages.filter((message) => {
      const key = `${message.backendMessageId || message.id || ''}:${message.sender || ''}:${message.text || ''}`;
      if (seenMessages.has(key)) return false;
      seenMessages.add(key);
      return true;
    });
    output[index] = {
      ...thread,
      ...existing,
      participantUserId: Number(existing.participantUserId) || userId || undefined,
      customerEmail: existing.customerEmail || thread.customerEmail,
      conversationId: existing.conversationId || thread.conversationId,
      conversationIds: [...new Set([...(existing.conversationIds || []), ...(thread.conversationIds || []), existing.conversationId, thread.conversationId].filter(Boolean).map(Number).filter(Number.isFinite))],
      messages: mergedMessages,
      lastTime: (thread.messages || []).length > (existing.messages || []).length ? thread.lastTime : existing.lastTime,
      unread: Boolean(existing.unread || thread.unread)
    };
  });

  return output;
}

/**
 * Retrieve all threads from storage, or initialize if empty
 */
export function getStoredThreads() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    // Dọn dẹp cache mock cũ
    try {
      window.localStorage.removeItem('farmely_chat_threads_v6');
      window.localStorage.removeItem('farmely_chat_threads_v5');
    } catch (_) {}

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const cleaned = mergeDuplicateCustomerThreads(parsed);

    if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.error('[ChatStorage] Error loading threads from localStorage:', err);
    return [];
  }
}

/**
 * Get a specific thread by ID
 */
export function getStoredThreadById(threadId) {
  const threads = getStoredThreads();
  return threads.find((t) => t.id === threadId) || null;
}

export function upsertCustomerChatThread({ threadId, conversationId, participantUserId, customerName, customerEmail, customerAvatar }) {
  if (!threadId) return null;
  const threads = getStoredThreads();
  const normalizedEmail = String(customerEmail || '').trim().toLowerCase();
  const numericUserId = Number(participantUserId);
  const existingIndexes = threads.map((thread, index) => ({ thread, index })).filter(({ thread }) => {
    const sameId = thread.id === threadId;
    const sameUser = numericUserId && Number(thread.participantUserId) === numericUserId;
    const sameEmail = normalizedEmail && String(thread.customerEmail || '').trim().toLowerCase() === normalizedEmail
      && (!numericUserId || !Number(thread.participantUserId) || Number(thread.participantUserId) === numericUserId);
    return thread.role === 'customer' && (sameId || sameUser || sameEmail);
  });
  const existingIndex = existingIndexes[0]?.index ?? -1;
  const existing = existingIndex >= 0 ? threads[existingIndex] : null;
  const existingMessages = existingIndexes.flatMap(({ thread }) => thread.messages || []);
  const uniqueMessages = existingMessages.filter((message, index, all) => all.findIndex((candidate) =>
    String(candidate.backendMessageId || candidate.id || '') === String(message.backendMessageId || message.id || '')
      && candidate.sender === message.sender && candidate.text === message.text
  ) === index);
  const { plotChat: _plotChat, plotCode: _plotCode, plotName: _plotName, plots: _plots, crop: _crop, rentalId: _rentalId, stage: _stage, ...existingConversation } = existing || {};
  const thread = {
    ...existingConversation,
    id: existing?.id || threadId,
    ...(conversationId ? { conversationId: Number(conversationId) } : {}),
    ...(participantUserId ? { participantUserId: Number(participantUserId) } : {}),
    role: 'customer',
    roleLabel: 'Khách hàng',
    category: 'expert',
    customerName: customerName || existing?.customerName || 'Khách hàng Farmely',
    customerEmail: customerEmail || existing?.customerEmail || '',
    customerAvatar: customerAvatar || existing?.customerAvatar || getSafeAvatar(null, 'customer'),
    expertName: existing?.expertName || 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: existing?.lastTime || 'Chưa có tin nhắn',
    status: existing?.status || 'PENDING',
    unread: existing?.unread || false,
    messages: uniqueMessages
  };
  const matchingIds = new Set(existingIndexes.map(({ thread }) => thread.id));
  const updatedThreads = existingIndex >= 0
    ? threads.filter((item, index) => !matchingIds.has(item.id) || index === existingIndex).map((item, index) =>
      item.id === thread.id ? thread : item
    )
    : [thread, ...threads];
  saveThreads(updatedThreads);
  return { thread, threads: updatedThreads };
}

/**
 * Save threads to storage
 */
export function saveThreads(threads) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (err) {
    console.error('[ChatStorage] Error saving threads to localStorage:', err);
  }
}

/**
 * Append a message to a thread and update status.
 * Automatically creates a thread on the fly if it does not exist (e.g. for new registered accounts).
 */
export function appendMessage(threadId, message) {
  const threads = getStoredThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);

  // If thread does not exist yet (e.g. newly registered user), create it on the fly!
  if (threadIndex === -1) {
    const newThread = {
      id: threadId,
      role: message.sender === 'worker' ? 'worker' : 'customer',
      roleLabel: message.sender === 'worker' ? 'CVLĐ Hiện Trường' : 'Khách hàng',
      customerName: message.senderName || 'Khách Hàng Mới',
      customerAvatar: getSafeAvatar(null, message.sender === 'worker' ? 'worker' : 'customer'),
      expertName: 'ThS. Nguyễn Hoàng Nam',
      isOnline: true,
      lastTime: message.time || 'Vừa xong',
      status: 'PENDING',
      unread: true,
      messages: [message]
    };
    const updatedThreads = [newThread, ...threads];
    saveThreads(updatedThreads);
    return { thread: newThread, message, threads: updatedThreads };
  }

  const thread = { ...threads[threadIndex] };
  const newMessages = [...thread.messages, message];

  thread.messages = newMessages;
  thread.lastTime = message.time || 'Vừa xong';

  if (message.sender === 'expert') {
    thread.status = 'REPLIED';
    thread.unread = false;
  } else {
    thread.status = 'PENDING';
    thread.unread = true;
  }

  // Pop up to the top: move thread with new message to index 0
  const remainingThreads = threads.filter((_, idx) => idx !== threadIndex);
  const updatedThreads = [thread, ...remainingThreads];
  saveThreads(updatedThreads);

  return { thread, message, threads: updatedThreads };
}

/**
 * Mark a thread as read (clear unread badge)
 * @param {string} threadId
 */
export function markThreadAsReadInStorage(threadId) {
  const threads = getStoredThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex === -1) return null;

  const thread = { ...threads[threadIndex], unread: false };
  const updatedThreads = [...threads];
  updatedThreads[threadIndex] = thread;
  saveThreads(updatedThreads);

  return { thread, threads: updatedThreads };
}

export function updateThreadRentalInStorage({ threadId, conversationId, participantUserId, customerName, customerEmail, customerAvatar }) {
  const threads = getStoredThreads();

  // Không bao giờ gán đè Ban Quản Trị hoặc tạo thêm Admin thành Khách Thuê Đất
  if (/Ban Quản Trị|Admin/i.test(customerName || '') || String(threadId || '').toLowerCase().includes('admin')) {
    return { thread: null, threads };
  }

  return upsertCustomerChatThread({ threadId, conversationId, participantUserId, customerName, customerEmail, customerAvatar });
}
