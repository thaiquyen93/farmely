import React, { useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import FloatingExpertChat from './FloatingExpertChat';

export default function GlobalExpertChat() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const threadId = useMemo(() => `CONS-${user?.id || user?.email || 'CUSTOMER'}`, [user?.id, user?.email]);
  const { currentThread, sendMessage } = useRealtimeChat({
    role: 'customer',
    initialThreadId: threadId,
    senderName: user?.fullName || user?.name || 'Khách hàng'
  });

  if (!user || user.role !== 'CUSTOMER') return null;
  return (
    <FloatingExpertChat
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      thread={currentThread}
      senderName={user.fullName || user.name || 'Khách hàng'}
      input={input}
      setInput={setInput}
      onSubmit={(event) => { event?.preventDefault(); if (input.trim()) { sendMessage(input); setInput(''); } }}
      openMode="expert"
      scrollRef={scrollRef}
    />
  );
}
