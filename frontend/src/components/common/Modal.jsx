import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl'
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/70 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        ref={dialogRef}
        className={`relative z-10 flex max-h-[calc(100dvh-2rem)] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-elevated animate-scaleUp`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-brand-border/60 bg-brand-cream/40">
          <div>
            <h3 id={titleId} className="font-heading text-xl font-bold text-brand-dark">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-brand-muted mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="min-w-11 min-h-11 inline-flex items-center justify-center text-stone-400 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
