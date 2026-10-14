import React, { useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import FloatingExpertChat from './FloatingExpertChat';

export default function GlobalExpertChat() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const isStaff = user?.role === 'STAFF';
  const isSupportedRole = user?.role === 'CUSTOMER' || isStaff;
  const chatRole = isStaff ? 'worker' : 'customer';
  const fallbackName = isStaff ? 'Nhân viên hiện trường' : 'Khách hàng';
  const threadId = useMemo(
    () => `${isStaff ? 'WORK' : 'CONS'}-${user?.id || user?.email || (isStaff ? 'STAFF' : 'CUSTOMER')}`,
    [isStaff, user?.id, user?.email]
  );
  const { currentThread, sendMessage } = useRealtimeChat({
    role: chatRole,
    initialThreadId: threadId,
    senderName: user?.fullName || user?.name || fallbackName
  });

  if (!user || !isSupportedRole) return null;
  return (
    <FloatingExpertChat
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      thread={currentThread}
      senderName={user.fullName || user.name || fallbackName}
      ownSenderRole={chatRole}
      bottomOffset={isStaff ? 92 : 24}
      input={input}
      setInput={setInput}
      onSubmit={(event) => { event?.preventDefault(); if (input.trim()) { sendMessage(input); setInput(''); } }}
      openMode="expert"
      scrollRef={scrollRef}
    />
  );
}
