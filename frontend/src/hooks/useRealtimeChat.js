import { useState, useEffect, useCallback, useMemo } from 'react';
import { chatService } from '../api/communication/chatService';

/**
 * Custom hook for real-time chat with cross-tab sync and backend persistence
 * @param {Object} options
 * @param {'expert'|'customer'|'worker'} options.role
 * @param {string} [options.initialThreadId]
 * @param {string} [options.senderName]
 */
export function useRealtimeChat({ role = 'customer', initialThreadId = null, senderName = '' } = {}) {
  // Wait for the authenticated backend sync before showing cached threads from another session.
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
  const [activeFilter, setActiveFilter] = useState('all');

  // Sync threads from storage
  const refreshThreads = useCallback(() => {
    const latest = chatService.getThreads();
    setThreads(latest);
  }, []);

  // Sync backend messages on mount if available
  useEffect(() => {
    if (typeof chatService.syncBackendMessages === 'function') {
      const sync = () => chatService.syncBackendMessages().then(() => {
        refreshThreads();
      }).catch(() => {});
      sync();
      const timer = window.setInterval(sync, 10000);
      return () => window.clearInterval(timer);
    }
  }, [refreshThreads]);

  // Update selectedThreadId if initialThreadId changes
  useEffect(() => {
    if (initialThreadId && initialThreadId !== selectedThreadId) {
      setSelectedThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  // Set default selectedThreadId if not set
  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0]?.id || null);
    } else if (!initialThreadId && selectedThreadId && !threads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(threads[0]?.id || null);
    }
  }, [initialThreadId, selectedThreadId, threads]);

  // Listen to real-time events across windows / tabs
  useEffect(() => {
    const unsubscribe = chatService.onChatUpdate(() => {
      refreshThreads();
    });

    return unsubscribe;
  }, [refreshThreads]);

  const currentThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || (!selectedThreadId ? threads[0] : null);
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
  const sendMessage = useCallback((text, customSenderName = '', meta = {}) => {
    if (!selectedThreadId || !text?.trim()) return null;

    const actualSender = customSenderName || senderName;
    const res = chatService.sendMessage({
      threadId: selectedThreadId,
      sender: role,
      text: text.trim(),
      senderName: actualSender,
      meta
    });

    refreshThreads();
    return res;
  }, [selectedThreadId, role, senderName, refreshThreads]);

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
    refreshThreads
  };
}
