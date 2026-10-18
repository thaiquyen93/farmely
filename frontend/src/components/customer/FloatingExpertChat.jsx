import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Minus, Send, Sparkles } from 'lucide-react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function FloatingExpertChat({
  isOpen,
  onOpen,
  onClose,
  thread,
  senderName,
  ownSenderRole = 'customer',
  bottomOffset = 24,
  avoidMobileNav = false,
  input,
  setInput,
  onSubmit,
  mode = 'expert',
  messages,
  scrollRef
}) {
  const [launcherPosition, setLauncherPosition] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const dragRef = useRef(null);
  const panelRef = useRef(null);
  const isAi = mode === 'ai';
  const LauncherIcon = isAi ? Bot : MessageSquare;
  const title = isAi ? 'Trợ lý nông nghiệp AI' : (thread?.expertName || 'ThS. Nguyễn Hoàng Nam');
  const visibleMessages = messages ?? thread?.messages ?? [];
  const effectiveBottomOffset = bottomOffset + (avoidMobileNav && isMobileViewport ? 72 : 0);

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsidePointer = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) onClose();
    };
    const timer = window.setTimeout(() => document.addEventListener('pointerdown', handleOutsidePointer), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsidePointer);
    };
  }, [isOpen, onClose]);

  const beginDrag = (event, type) => {
    const rect = event.currentTarget.closest('[data-draggable]').getBoundingClientRect();
    dragRef.current = { type, dx: event.clientX - rect.left, dy: event.clientY - rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const width = 56;
    const height = 56;
    const next = {
      x: clamp(event.clientX - dragRef.current.dx, 12, window.innerWidth - width - 12),
      y: clamp(event.clientY - dragRef.current.dy, 84, window.innerHeight - height - 12)
    };
    dragRef.current.moved = true;
    setLauncherPosition(next);
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.type === 'launcher' && !drag.moved) onOpen();
  };

  const panelStyle = launcherPosition
    ? {
        left: launcherPosition.x >= 390 ? launcherPosition.x - 382 : launcherPosition.x + 68,
        top: clamp(launcherPosition.y - 450, 84, Math.max(84, window.innerHeight - 532))
      }
    : { right: 92, bottom: effectiveBottomOffset };

  if (!isOpen) {
    return (
      <div
        data-draggable
        className="fixed z-[60] block"
        style={launcherPosition ? { left: launcherPosition.x, top: launcherPosition.y } : { right: 24, bottom: effectiveBottomOffset }}
      >
        <button
          type="button"
          onPointerDown={(event) => beginDrag(event, 'launcher')}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={() => { dragRef.current = null; }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onOpen();
          }}
          className="group relative flex h-14 w-14 touch-none items-center justify-center rounded-2xl bg-brand-green text-white shadow-elevated transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/25"
          aria-label={`${isAi ? 'Mở trợ lý nông nghiệp AI' : 'Mở chat với chuyên gia'}; có thể kéo để di chuyển`}
        >
          <LauncherIcon className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs font-bold text-white shadow-lg group-hover:block">{isAi ? 'Trợ lý AI' : 'Chat chuyên gia'} • kéo để di chuyển</span>
        </button>
      </div>
    );
  }

  return (
    <section
      ref={panelRef}
      className="fixed inset-x-3 bottom-3 z-[60] flex h-[min(520px,calc(100vh-110px))] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-elevated sm:left-auto sm:right-6 sm:w-[370px]"
      style={panelStyle}
      aria-label={isAi ? 'Cửa sổ trợ lý nông nghiệp AI' : 'Cửa sổ chat với chuyên gia'}
    >
      <header className="flex items-center gap-2 border-b border-white/10 bg-brand-dark px-3 py-2 text-white">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isAi ? 'bg-purple-500' : 'bg-white/10'}`}>
          <LauncherIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black">{title}</p>
          <p className="truncate text-[10px] text-white/60">{isAi ? 'Hỗ trợ kỹ thuật canh tác' : 'Tư vấn trực tiếp từ chuyên gia'}</p>
        </div>
        <button type="button" onClick={onClose} onPointerDown={(event) => event.stopPropagation()} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10" aria-label="Thu nhỏ chat"><Minus className="h-5 w-5" /></button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-brand-cream/25 p-4">
        {!visibleMessages.length ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <LauncherIcon className="mb-3 h-8 w-8 text-brand-green" />
            <p className="font-bold text-brand-dark">{isAi ? 'Hỏi trợ lý AI' : 'Bắt đầu trao đổi với chuyên gia'}</p>
            <p className="mt-1 text-xs text-brand-muted">Hỏi về cây trồng, độ ẩm hoặc dịch vụ chăm sóc.</p>
          </div>
        ) : visibleMessages.map((message) => {
          const isMe = message.sender === ownSenderRole || message.sender === 'user';
          return (
            <div key={message.id} className={`max-w-[86%] ${isMe ? 'ml-auto' : ''}`}>
              <p className={`mb-1 text-[10px] font-bold text-stone-500 ${isMe ? 'text-right' : ''}`}>{isMe ? (message.senderName || senderName) : (message.senderName || (isAi ? 'Farmely AI' : thread?.expertName) || 'Chuyên gia')}</p>
              <div className={`rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${isMe ? 'rounded-br-sm bg-brand-green text-white' : 'rounded-bl-sm border border-brand-border bg-white text-stone-700'}`}>
                {message.prescriptionTag && <p className="mb-2 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800"><Sparkles className="h-3 w-3" />{message.prescriptionTag}</p>}
                {message.photoUrl && <img src={message.photoUrl} alt="Ảnh trao đổi" className="mb-2 max-h-28 w-full rounded-xl object-cover" />}
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
              <p className={`mt-1 text-[9px] text-stone-400 ${isMe ? 'text-right' : ''}`}>{message.time}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-brand-border bg-white p-3">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={isAi ? 'Hỏi AI về cây trồng...' : 'Nhập tin nhắn...'} className="min-w-0 flex-1 rounded-xl border border-brand-border bg-stone-50 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-green/20" />
        <button type="submit" disabled={!input.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white hover:bg-brand-dark disabled:opacity-40" aria-label="Gửi tin nhắn"><Send className="h-4 w-4" /></button>
      </form>
    </section>
  );
}
