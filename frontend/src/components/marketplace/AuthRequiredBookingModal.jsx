import React, { useMemo } from 'react';
import { LogIn, User, Maximize2, Tag, HelpCircle, FileText } from 'lucide-react';
import Modal from '../common/Modal';

export function SproutHeaderIcon({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 25C9 19.5 13.5 16 19 15"
        stroke="#1E7B4E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left Leaf */}
      <path
        d="M7 19.5C6 14 9.5 8.5 15 7.5C16 11.5 13.5 17 7 19.5Z"
        fill="#1E7B4E"
      />
      {/* Right Leaf */}
      <path
        d="M17 15C18 9.5 22.5 5.5 28 5.5C28.5 11 25 16.5 17 15Z"
        fill="#2E995B"
      />
    </svg>
  );
}

export function PlotFieldPinIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {/* Curved agricultural field furrows */}
      <path
        d="M14 43 C21 36 31 32 46 32 C51 32 55 34 56 36"
        stroke="#1E7B4E"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M11 48 C19 41 32 36 49 36 C54 36 58 38 59 40"
        stroke="#1E7B4E"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M8 53 C18 45 34 40 52 40 C57 40 60 42 61 44"
        stroke="#1E7B4E"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Transverse ridges */}
      <path d="M16 41 L10 54" stroke="#1E7B4E" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M26 34 L20 54" stroke="#1E7B4E" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M37 32 L33 54" stroke="#1E7B4E" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M48 33 L47 54" stroke="#1E7B4E" strokeWidth="2.8" strokeLinecap="round" />
      {/* Center Pin */}
      <path
        d="M32 9 C26.8 9 22.5 13.3 22.5 18.5 C22.5 25.5 32 33 32 33 C32 33 41.5 25.5 41.5 18.5 C41.5 13.3 37.2 9 32 9 Z"
        fill="#13673B"
      />
      <circle cx="32" cy="18" r="3" fill="white" />
    </svg>
  );
}

export default function AuthRequiredBookingModal({
  isOpen,
  onClose,
  plot,
  onLogin,
  onQuickDemoLogin,
  onRegister,
  onViewMap
}) {
  const displayCode = useMemo(() => {
    return plot?.code || plot?.id || 'P-04';
  }, [plot]);

  const displayName = useMemo(() => {
    if (!plot) return `Thửa ${displayCode}`;
    const raw = plot.name || plot.label;
    if (raw) {
      return String(raw).startsWith('Thửa') ? raw : `Thửa ${raw}`;
    }
    return `Thửa ${displayCode}`;
  }, [plot, displayCode]);

  const displayArea = useMemo(() => {
    if (!plot) return '160 m²';
    if (plot.area) {
      return String(plot.area).includes('m²') ? String(plot.area).trim() : `${plot.area} m²`;
    }
    if (plot.sizeNumber) {
      return `${plot.sizeNumber} m²`;
    }
    return '160 m²';
  }, [plot]);

  const displayPrice = useMemo(() => {
    if (!plot) return '1.300.000 đ';
    if (plot.rentalPrice && typeof plot.rentalPrice === 'number') {
      return `${plot.rentalPrice.toLocaleString('vi-VN')} đ`;
    }
    if (plot.price) {
      if (typeof plot.price === 'number') {
        return `${plot.price.toLocaleString('vi-VN')} đ`;
      }
      return String(plot.price).replace(/\/tháng/i, '').trim();
    }
    if (plot.formattedPrice) {
      return String(plot.formattedPrice).replace(/\/tháng/i, '').trim();
    }
    return '1.300.000 đ';
  }, [plot]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      headerVariant="clean"
      headerIcon={<SproutHeaderIcon className="w-7 h-7" />}
      title="Đăng Nhập Để Tiếp Tục"
      subtitle={`${displayCode} • ${displayName}`}
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="relative bg-white px-5 sm:px-7 pt-4 pb-6 overflow-hidden">
        {/* Top Wave Background Artwork */}
        <svg
          className="absolute inset-x-0 top-0 w-full h-36 pointer-events-none select-none"
          viewBox="0 0 480 144"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 0 L480 0 L480 65 C380 95 320 50 240 75 C160 100 90 60 0 85 Z"
            fill="#F0FAF4"
          />
          <path
            d="M0 35 C110 80 180 45 240 70 C310 95 390 60 480 75 L480 105 C390 90 320 120 240 100 C160 80 90 115 0 100 Z"
            fill="#E4F7EC"
            opacity="0.65"
          />
          <path
            d="M0 75 C80 115 170 80 240 95 C310 110 390 80 480 100 L480 125 C380 105 300 130 240 115 C170 100 80 130 0 120 Z"
            fill="#D5F2E0"
            opacity="0.45"
          />
          {/* Floating gentle leaves */}
          <path
            d="M165 44 C162 37 168 31 176 33 C181 35 182 42 176 46 C170 49 166 47 165 44 Z"
            fill="#9FD8B4"
            opacity="0.8"
          />
          <path
            d="M305 38 C301 30 308 24 317 26 C323 28 324 36 318 40 C311 44 307 42 305 38 Z"
            fill="#9FD8B4"
            opacity="0.8"
          />
          <path
            d="M335 52 C332 47 336 43 343 44 C347 45 348 50 344 53 C339 56 336 54 335 52 Z"
            fill="#B4E5C4"
            opacity="0.7"
          />
        </svg>

        {/* Bottom Wave Decoration */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-16 pointer-events-none select-none"
          viewBox="0 0 480 64"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 32 C90 15 180 48 260 38 C340 28 420 48 480 32 L480 64 L0 64 Z"
            fill="#F2FAF5"
          />
          <path
            d="M0 45 C70 30 150 52 220 47 C310 39 390 55 480 45 L480 64 L0 64 Z"
            fill="#E5F7EC"
            opacity="0.7"
          />
          {/* Small leaf on bottom-left */}
          <path
            d="M24 48 C21 42 26 37 33 39 C38 40 38 46 33 49 C28 52 25 51 24 48 Z"
            fill="#88CDA0"
            opacity="0.8"
          />
        </svg>

        {/* Hero Section */}
        <div className="relative z-10 text-center pt-2">
          {/* Central Round LogIn Icon */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#D8F3E5] flex items-center justify-center mx-auto ring-8 ring-white/90 shadow-2xs">
            <LogIn className="w-8 h-8 sm:w-9 sm:h-9 text-[#0F764F] stroke-[2.5]" />
          </div>

          <h3 className="font-heading font-black text-[22px] sm:text-2xl text-stone-900 tracking-tight mt-3">
            Đăng nhập để tiếp tục
          </h3>
          <p className="text-xs sm:text-[13px] text-stone-600 font-medium max-w-[370px] mx-auto text-center leading-relaxed mt-2">
            Vui lòng đăng nhập tài khoản khách hàng để xem chi tiết đầy đủ, chọn mô hình canh tác và ký hợp đồng thuê thửa đất.
          </p>

          {/* Plot Information Card */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E8F8EE] flex items-center justify-center shrink-0 border border-emerald-100/80">
                <PlotFieldPinIcon className="w-10 h-10 text-[#1E7B4E]" />
              </div>

              <div className="space-y-1 min-w-0">
                <div className="font-heading font-black text-xl text-stone-900 leading-tight truncate">
                  {displayCode}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Diện tích</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Đơn giá niêm yết</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between self-stretch text-right shrink-0">
              <span className="inline-block text-xs font-bold text-[#1E7B4E] bg-[#EAF7EE] border border-emerald-200/80 px-3 py-0.5 rounded-full leading-snug">
                {displayName}
              </span>
              <span className="font-heading font-black text-stone-900 text-sm sm:text-base leading-tight mt-1">
                {displayArea}
              </span>
              <span className="font-heading font-black text-[#0E7A4A] text-base sm:text-lg leading-tight mt-1">
                {displayPrice}
              </span>
            </div>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className="space-y-2.5 mt-5">
            <button
              type="button"
              onClick={onLogin}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0F764F] hover:bg-[#0c6241] text-white font-extrabold text-sm sm:text-[15px] tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-sm transition-all duration-150 active:scale-[0.99] cursor-pointer"
            >
              <LogIn className="w-5 h-5 stroke-[2.5]" />
              <span>ĐĂNG NHẬP NGAY</span>
            </button>

            <button
              type="button"
              onClick={onQuickDemoLogin}
              className="w-full py-3 px-4 rounded-2xl border-2 border-[#1E7B4E] bg-white text-[#1E7B4E] hover:bg-emerald-50/60 font-bold text-sm sm:text-[14px] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] cursor-pointer"
            >
              <User className="w-4 h-4 stroke-[2.5] text-[#1E7B4E]" />
              <span>Đăng nhập nhanh (Tài khoản mẫu Khách Hàng)</span>
            </button>
          </div>

          {/* Footer Navigation Links */}
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-stone-600 pt-3 pb-1 relative z-10">
            <button
              type="button"
              onClick={onRegister}
              className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Chưa có tài khoản?</span>
              <span className="text-[#0E7A4A] font-bold hover:underline">Đăng ký →</span>
            </button>
            <span className="text-stone-300">|</span>
            <button
              type="button"
              onClick={onViewMap || onClose}
              className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-semibold transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-stone-500 shrink-0" />
              <span>Xem trên bản đồ trước</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

