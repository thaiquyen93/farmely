import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  headerVariant = 'default', // 'default' | 'green'
  variant,
  headerColor,
  zIndex = 'z-[100]'
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onCloseRef.current();

      if (e.key === 'Tab' && isOpen && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      const previouslyFocused = document.activeElement;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
      return () => {
        window.clearTimeout(focusTimer);
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        previouslyFocused?.focus?.();
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndex} flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/70 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        ref={dialogRef}
        className={`relative z-10 my-auto flex max-h-[calc(100dvh-1.5rem)] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-elevated animate-scaleUp sm:max-h-[calc(100dvh-2rem)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        {(() => {
          const isGreenHeader = headerVariant === 'green' || variant === 'green' || headerColor === 'green';
          return (
            <div
              className={`flex shrink-0 items-start justify-between border-b px-4 py-3 sm:px-6 sm:py-5 ${
                isGreenHeader
                  ? 'bg-[#294C3B] text-white border-[#1f3a2d]'
                  : 'border-brand-border/60 bg-brand-cream/40'
              }`}
            >
              <div>
                <h3
                  id={titleId}
                  className={`font-heading text-xl font-bold ${
                    isGreenHeader ? 'text-white' : 'text-brand-dark'
                  }`}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p
                    className={`text-xs mt-0.5 ${
                      isGreenHeader ? 'text-emerald-100/90' : 'text-brand-muted'
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className={`min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                  isGreenHeader
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-stone-400 hover:text-brand-dark hover:bg-stone-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          );
        })()}

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
