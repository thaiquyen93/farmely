import { useState, useEffect, useCallback, useMemo } from 'react';
import { chatService } from '../api/communication/chatService';
import { useAuthStore } from '../stores/authStore';

/**
 * Custom hook for real-time chat with cross-tab sync and backend persistence
 * @param {Object} options
 * @param {'expert'|'customer'|'worker'} options.role
 * @param {string} [options.initialThreadId]
 * @param {string} [options.senderName]
 */
export function useRealtimeChat({ role = 'customer', initialThreadId = null, senderName = '' } = {}) {
  const userId = useAuthStore((state) => state.user?.userId);
  const accountRole = useAuthStore((state) => state.user?.role);
  const effectiveRole = accountRole === 'EXPERT' ? 'expert'
    : ['STAFF', 'FIELD_WORKER'].includes(accountRole) ? 'worker' : role;
  const [threads, setThreads] = useState(() => chatService.getThreads(userId));
  const [chatError, setChatError] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
  const [activeFilter, setActiveFilter] = useState('all');

  // Sync threads from storage
  const refreshThreads = useCallback(() => {
    const latest = chatService.getThreads(userId);
    setThreads(latest);
  }, [userId]);

  // Sync backend messages on mount if available
  useEffect(() => {
    if (!userId) return;
    const sync = () => chatService.syncBackendMessages(userId, effectiveRole)
      .then(() => { refreshThreads(); setChatError(''); })
      .catch((error) => setChatError(error.message || 'Không thể tải hội thoại.'));
    sync();
    const timer = setInterval(sync, 5000);
    return () => clearInterval(timer);
  }, [refreshThreads, userId, effectiveRole]);

  // Update selectedThreadId if initialThreadId changes
  useEffect(() => {
    if (initialThreadId && threads.some((thread) => thread.id === initialThreadId) && initialThreadId !== selectedThreadId) {
      setSelectedThreadId(initialThreadId);
    }
  }, [initialThreadId, threads, selectedThreadId]);

  // Set default selectedThreadId if not set
  useEffect(() => {
    if ((!selectedThreadId || !threads.some((thread) => thread.id === selectedThreadId)) && threads.length > 0) {
      setSelectedThreadId(threads[0]?.id || null);
    }
  }, [selectedThreadId, threads]);

  // Listen to real-time events across windows / tabs
  useEffect(() => {
    const unsubscribe = chatService.onChatUpdate(() => {
      refreshThreads();
    });

    return unsubscribe;
  }, [refreshThreads]);

  const currentThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  // Filtered threads for lists
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (activeFilter === 'unread') return t.unread;
      if (activeFilter === 'expert') return t.category === 'expert' || t.role === 'customer';
      if (activeFilter === 'worker') return t.category === 'worker' || t.role === 'worker';
      return true;
    });
  }, [threads, activeFilter]);

  // Send message
  const sendMessage = useCallback(async (text, customSenderName = '', meta = {}) => {
    const targetId = currentThread?.id;
    if (!targetId || !text?.trim()) return null;
    try {
      const result = await chatService.sendMessage({
        threadId: targetId, senderId: Number(userId), userId: Number(userId),
        role: effectiveRole, text: text.trim(), senderName: customSenderName || senderName, meta
      });
      setChatError('');
      refreshThreads();
      return result;
    } catch (error) {
      setChatError(error.message || 'Không thể gửi tin nhắn.');
      return null;
    }
  }, [currentThread?.id, userId, effectiveRole, senderName, refreshThreads]);

  // Mark thread unread as false (for inbox list)
  const markAsRead = useCallback((threadIdToMark) => {
    const targetId = threadIdToMark || selectedThreadId;
    if (!targetId) return;

    chatService.markThreadAsRead(targetId);
    refreshThreads();
  }, [selectedThreadId, refreshThreads]);

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
    chatError
  };
}
