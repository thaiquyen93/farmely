import React, { useEffect, useState } from 'react';

/**
 * MARKETPLACE INTRO VEIL — Màn che toàn trang trong lúc bản đồ nạp tile.
 *
 * Khi phase rời khỏi 'waiting', màn che mờ dần 500ms rồi bị THÁO HẲN khỏi DOM
 * (không chỉ trong suốt) để không ăn mất sự kiện chuột của bản đồ.
 */
export default function MarketplaceIntroVeil({ phase = 'waiting' }) {
  const isWaiting = phase === 'waiting';
  const [mounted, setMounted] = useState(isWaiting);

  useEffect(() => {
    if (isWaiting) {
      setMounted(true);
      return undefined;
    }

    const timer = setTimeout(() => setMounted(false), 500);
    return () => clearTimeout(timer);
  }, [isWaiting]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isWaiting}
      className={`absolute inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-slate-950 transition-opacity duration-500 ease-out ${
        isWaiting ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Logo Farmely */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-2xl shadow-panel animate-pulseGlow">
          🌱
        </div>
        <div className="text-left">
          <span className="block text-lg font-extrabold tracking-tight text-white leading-none">
            FARMELY
          </span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mt-1">
            Smart Agri
          </span>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-300">Đang dựng bản đồ trang trại...</p>

      {/* Thanh tiến trình shimmer */}
      <div className="w-56 h-1 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full w-full rounded-full animate-shimmer"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.15) 25%, #10B981 50%, rgba(16,185,129,0.15) 75%, rgba(16,185,129,0) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>
  );
}
