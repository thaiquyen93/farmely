import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, unwrapData } from '../api/apiClient';
import { useAuthStore } from '../stores/authStore';

const roleName = (role) => {
  const value = String(role || '').toUpperCase();
  if (value === 'EXPERT') return 'expert';
  if (value === 'STAFF' || value === 'FIELD_WORKER') return 'worker';
  return 'customer';
};

const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  : '';

export function normalizeConversation(conversation, context) {
  const { currentUserId, usersById, rentalsById, plotsById } = context;
  const otherId = Number(conversation.participantOne) === currentUserId
    ? Number(conversation.participantTwo)
    : Number(conversation.participantOne);
  const other = usersById.get(otherId) || {};
  const rental = rentalsById.get(Number(conversation.rentalId)) || {};
  const plot = plotsById.get(Number(conversation.plotId || rental.plotId)) || {};
  const otherRole = roleName(other.role);
  const participants = [
    other,
    usersById.get(Number(conversation.participantOne)),
    usersById.get(Number(conversation.participantTwo))
  ];
  const expert = participants.find((item) => roleName(item?.role) === 'expert');
  const messages = (conversation.messages || []).map((message) => {
    const sender = usersById.get(Number(message.senderId)) || {};
    return {
      id: message.messageId,
      sender: roleName(sender.role),
      senderName: message.senderName || sender.fullName || 'Người dùng Farmely',
      text: message.content,
      photoUrl: message.attachmentUrl,
      time: formatTime(message.createdAt || message.time)
    };
  });
  const last = messages.at(-1);

  return {
    id: String(conversation.conversationId),
    conversationId: conversation.conversationId,
    role: otherRole,
    category: otherRole,
    roleLabel: otherRole === 'worker' ? 'Nhân viên hiện trường' : otherRole === 'expert' ? 'Chuyên gia' : 'Khách hàng',
    customerName: other.fullName || other.email || `Người dùng #${otherId}`,
    customerAvatar: other.avatarUrl || other.avatar || '',
    expertName: expert?.fullName || 'Chuyên gia Farmely',
    plotCode: plot.plotCode || rental.plotCode || '',
    plotName: plot.plotName || rental.plotName || 'Chưa gắn thửa đất',
    crop: rental.cropName || rental.varietyName || 'Chưa cập nhật cây trồng',
    rentalStatus: conversation.rentalId ? 'RENTED' : 'NOT_RENTED',
    status: conversation.status === 'CLOSED' ? 'RESOLVED' : 'PENDING',
    unread: false,
    isOnline: false,
    lastTime: last?.time || formatTime(conversation.createdAt),
    messages
  };
}

/** Backend-backed conversation hook shared by Customer, Expert and Staff dashboards. */
export function useRealtimeChat({ role = 'customer', initialThreadId = null, senderName = '' } = {}) {
  const { user } = useAuthStore();
  const currentUserId = Number(user?.userId || user?.id);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId ? String(initialThreadId) : null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshThreads = useCallback(async () => {
    if (!currentUserId) {
      setThreads([]);
      return [];
    }
    setLoading(true);
    try {
      const [conversationPayload, userPayload, rentalPayload, plotPayload] = await Promise.all([
        apiFetch(`/api/v1/conversations?userId=${currentUserId}`),
        apiFetch('/api/users'),
        apiFetch('/api/rentals'),
        apiFetch('/api/plots')
      ]);
      const users = unwrapData(userPayload) || [];
      const rentals = unwrapData(rentalPayload) || [];
      const plots = unwrapData(plotPayload) || [];
      const context = {
        currentUserId,
        usersById: new Map(users.map((item) => [Number(item.userId || item.id), item])),
        rentalsById: new Map(rentals.map((item) => [Number(item.rentalId || item.id), item])),
        plotsById: new Map(plots.map((item) => [Number(item.plotId || item.id), item]))
      };
      const next = (unwrapData(conversationPayload) || []).map((item) => normalizeConversation(item, context));
      setThreads(next);
      setError('');
      setSelectedThreadId((current) => next.some((item) => item.id === String(current))
        ? String(current)
        : next[0]?.id || null);
      return next;
    } catch (loadError) {
      setThreads([]);
      setError(loadError.message || 'Không thể tải hội thoại từ máy chủ.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    refreshThreads();
    const timer = window.setInterval(refreshThreads, 15000);
    return () => window.clearInterval(timer);
  }, [refreshThreads]);

  useEffect(() => {
    if (initialThreadId && threads.some((item) => item.id === String(initialThreadId))) {
      setSelectedThreadId(String(initialThreadId));
    }
  }, [initialThreadId, threads]);

  const currentThread = useMemo(
    () => threads.find((item) => item.id === String(selectedThreadId)) || null,
    [threads, selectedThreadId]
  );

  const filteredThreads = useMemo(() => threads.filter((thread) => {
    if (activeFilter === 'unread') return thread.unread;
    if (activeFilter === 'expert') return thread.role === 'expert' || thread.role === 'customer';
    if (activeFilter === 'worker') return thread.role === 'worker';
    return true;
  }), [threads, activeFilter]);

  const sendMessage = useCallback(async (text, customSenderName = '') => {
    if (!selectedThreadId || !text?.trim() || !currentUserId) return null;
    try {
      const payload = await apiFetch(`/api/v1/conversations/${selectedThreadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUserId,
          senderName: customSenderName || senderName || user?.fullName,
          content: text.trim(),
          attachmentUrl: null
        })
      });
      await refreshThreads();
      return unwrapData(payload);
    } catch (sendError) {
      setError(sendError.message || 'Không thể gửi tin nhắn.');
      return null;
    }
  }, [currentUserId, refreshThreads, selectedThreadId, senderName, user?.fullName]);

  const markAsRead = useCallback(() => {}, []);

  return {
    threads,
    filteredThreads,
    selectedThreadId,
    setSelectedThreadId,
    currentThread,
    activeFilter,
    setActiveFilter,
    sendMessage,
    markAsRead,
    refreshThreads,
    loading,
    error,
    role
  };
}
