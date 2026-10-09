import React, { useEffect, useRef, useState } from 'react';
import { GripHorizontal, MessageCircle, Send, X } from 'lucide-react';

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 450;
const EDGE = 16;

export default function DraggableChatWidget({
  title = 'Chat với CGNN',
  subtitle = 'Farmely hỗ trợ trong ngày',
  messages = [],
  currentUser = 'Bạn',
  value,
  onChange,
  onSend,
  placeholder = 'Nhập tin nhắn...',
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const dragRef = useRef(null);

  const fitPosition = (x, y) => ({
    x: Math.max(EDGE, Math.min(x, window.innerWidth - Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2) - EDGE)),
    y: Math.max(EDGE, Math.min(y, window.innerHeight - Math.min(PANEL_HEIGHT, window.innerHeight - EDGE * 2) - EDGE)),
  });

  useEffect(() => {
    if (!open || position) return;
    setPosition(fitPosition(window.innerWidth - PANEL_WIDTH - 24, window.innerHeight - PANEL_HEIGHT - 24));
  }, [open, position]);

  useEffect(() => {
    const keepInViewport = () => setPosition(current => current ? fitPosition(current.x, current.y) : current);
    window.addEventListener('resize', keepInViewport);
    return () => window.removeEventListener('resize', keepInViewport);
  }, []);

  const startDrag = event => {
    if (!position) return;
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - position.x, offsetY: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = event => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    setPosition(fitPosition(event.clientX - dragRef.current.offsetX, event.clientY - dragRef.current.offsetY));
  };
  const stopDrag = event => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-2xl ring-4 ring-white/80 transition hover:scale-105 hover:bg-brand-dark" aria-label={`Mở ${title}`} title={title}><MessageCircle size={25} /></button>;

  return <section className="fixed z-50 flex h-[450px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-2xl" style={{ left: position?.x ?? EDGE, top: position?.y ?? EDGE }} aria-label={title}>
    <header onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} className="flex touch-none cursor-move select-none items-center justify-between bg-brand-dark px-4 py-3 text-white">
      <div className="flex min-w-0 items-center gap-2.5"><GripHorizontal size={18} className="shrink-0 text-white/55" /><div className="min-w-0"><h2 className="truncate text-sm font-bold">{title}</h2><p className="truncate text-[11px] text-white/65">{subtitle}</p></div></div>
      <button type="button" onPointerDown={event => event.stopPropagation()} onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Thu gọn chat"><X size={17} /></button>
    </header>
    <div className="flex-1 space-y-3 overflow-y-auto bg-brand-cream/60 p-4 text-sm">
      {messages.map(message => <div key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${message.from === currentUser ? 'ml-auto rounded-tr-sm bg-brand-green text-white' : 'rounded-tl-sm border border-brand-border bg-white text-brand-dark'}`}><span className="mb-0.5 block text-[10px] font-bold opacity-65">{message.from}</span>{message.text}</div>)}
    </div>
    <form onSubmit={onSend} className="flex gap-2 border-t border-brand-border bg-white p-3"><input required value={value} onChange={onChange} placeholder={placeholder} className="min-w-0 flex-1 rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-green" /><button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white hover:bg-brand-dark" aria-label="Gửi tin nhắn"><Send size={17} /></button></form>
  </section>;
}
