import { useState, useEffect, useCallback, useMemo } from 'react';
import { chatService } from '../api/communication/chatService';

/**
 * Custom hook for real-time chat with cross-tab sync and backend persistence
 * @param {Object} options
 * @param {'expert'|'customer'|'worker'} options.role
 * @param {string} [options.initialThreadId]
 * @param {string} [options.senderName]
 */
export function useRealtimeChat({ role = 'customer', initialThreadId = null, senderName = '', userId = null, customerEmail = '' } = {}) {
  const [threads, setThreads] = useState(() => chatService.getThreads());
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
  const [activeFilter, setActiveFilter] = useState('all');

  // Sync threads from storage
  const refreshThreads = useCallback(() => {
    const latest = chatService.getThreads();
    setThreads(latest);
  }, []);

  useEffect(() => {
    if (role !== 'customer' || !userId || !initialThreadId) return;
    chatService.upsertCustomerThread({
      threadId: initialThreadId,
      participantUserId: userId,
      customerName: senderName,
      customerEmail
    });
    refreshThreads();
  }, [role, userId, initialThreadId, senderName, customerEmail, refreshThreads]);

  // Poll the shared backend so separate customer and expert sessions see replies.
  const syncNow = useCallback(async () => {
    if (!userId) return;
    await chatService.syncBackendMessages({ role, userId });
    refreshThreads();
  }, [role, userId, refreshThreads]);

  useEffect(() => {
    if (!userId) return;
    let inFlight = false;
    const sync = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await syncNow();
      } finally {
        inFlight = false;
      }
    };
    sync();
    const timer = window.setInterval(sync, 5000);
    return () => window.clearInterval(timer);
  }, [userId, syncNow]);

  // Update selectedThreadId if initialThreadId changes
  useEffect(() => {
    if (initialThreadId && initialThreadId !== selectedThreadId) {
      setSelectedThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  // Set default selectedThreadId if not set (skip auto-picking invisible threads for expert inbox)
  useEffect(() => {
    if (role === 'expert') return;
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0]?.id || null);
    }
  }, [role, selectedThreadId, threads]);

  // Listen to real-time events across windows / tabs
  useEffect(() => {
    const unsubscribe = chatService.onChatUpdate(() => {
      refreshThreads();
    });

    return unsubscribe;
  }, [refreshThreads]);

  const currentThread = useMemo(() => {
    const byId = threads.find((t) => t.id === selectedThreadId);
    if (byId) return byId;
    if (role === 'customer' && Number(userId) > 0) {
      return threads.find((t) => t.role === 'customer' && Number(t.participantUserId) === Number(userId)) || null;
    }
    if (role === 'worker' && Number(userId) > 0) {
      return threads.find((t) => t.role === 'worker' && Number(t.participantUserId) === Number(userId)) || null;
    }
    return threads[0] || null;
  }, [threads, selectedThreadId, role, userId]);

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
  const sendMessage = useCallback(async (text, customSenderName = '', meta = {}, overrideThreadId = null) => {
    const targetThreadId = overrideThreadId || selectedThreadId;
    if (!targetThreadId || !text?.trim()) return null;

    const actualSender = customSenderName || senderName;
    try {
      const res = await chatService.sendMessage({
        threadId: targetThreadId,
        sender: role,
        text: text.trim(),
        senderName: actualSender,
        senderUserId: userId,
        meta
      });
      refreshThreads();
      return res;
    } catch (error) {
      refreshThreads();
      throw error;
    }
  }, [selectedThreadId, role, senderName, userId, refreshThreads]);

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
    syncNow
  };
}
