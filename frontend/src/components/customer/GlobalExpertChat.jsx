import React, { useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import FloatingExpertChat from './FloatingExpertChat';

export default function GlobalExpertChat() {
  const { user } = useAuthStore();
  const [activeChat, setActiveChat] = useState(null);
  const [expertInput, setExpertInput] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const expertScrollRef = useRef(null);
  const aiScrollRef = useRef(null);
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

  const submitAiMessage = (event) => {
    event.preventDefault();
    const question = aiInput.trim();
    if (!question) return;
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAiMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, sender: 'user', senderName: user?.fullName || user?.name || fallbackName, text: question, time },
      { id: `ai-${Date.now()}`, sender: 'ai', senderName: 'Farmely AI', text: 'Trợ lý AI chưa được backend cấu hình. Bạn có thể dùng kênh chuyên gia để nhận tư vấn từ dữ liệu thật.', time }
    ]);
    setAiInput('');
  };

  if (!user || !isSupportedRole) return null;
  return (
    <>
      <FloatingExpertChat
        isOpen={activeChat === 'ai'}
        onOpen={() => setActiveChat('ai')}
        onClose={() => setActiveChat(null)}
        mode="ai"
        messages={aiMessages}
        senderName={user.fullName || user.name || fallbackName}
        bottomOffset={isStaff ? 160 : 92}
        avoidMobileNav={!isStaff}
        input={aiInput}
        setInput={setAiInput}
        onSubmit={submitAiMessage}
        scrollRef={aiScrollRef}
      />
      <FloatingExpertChat
        isOpen={activeChat === 'expert'}
        onOpen={() => setActiveChat('expert')}
        onClose={() => setActiveChat(null)}
        thread={currentThread}
        senderName={user.fullName || user.name || fallbackName}
        ownSenderRole={chatRole}
        bottomOffset={isStaff ? 92 : 24}
        avoidMobileNav={!isStaff}
        input={expertInput}
        setInput={setExpertInput}
        onSubmit={(event) => { event.preventDefault(); if (expertInput.trim()) { sendMessage(expertInput); setExpertInput(''); } }}
        scrollRef={expertScrollRef}
      />
    </>
  );
}
