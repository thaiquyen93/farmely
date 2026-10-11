import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'available', 'reserved', 'rented', 'maintenance', 'fallow', 'success', 'warning', 'info', 'neutral'
  size = 'md',
  className = ''
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const variantStyles = {
    // Business statuses
    AVAILABLE: "bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold",
    RESERVED: "bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold",
    RENTED: "bg-blue-50 text-blue-800 border border-blue-200/80 font-semibold",
    MAINTENANCE: "bg-orange-50 text-orange-800 border border-orange-200/80 font-semibold",
    FALLOW: "bg-stone-100 text-stone-700 border border-stone-200 font-semibold",
    ONLINE: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
    OFFLINE: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
    ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
    DRAFT: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",
    ARCHIVED: "bg-stone-100 text-stone-600 border border-stone-200 font-semibold",
    COMPATIBLE: "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold",
    NOT_COMPATIBLE: "bg-rose-50 text-rose-800 border border-rose-200 font-semibold",
    REVIEW_REQUIRED: "bg-amber-50 text-amber-800 border border-amber-200 font-semibold",
    // Generic
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium",
    warning: "bg-amber-50 text-amber-800 border border-amber-200 font-medium",
    danger: "bg-rose-50 text-rose-800 border border-rose-200 font-medium",
    info: "bg-sky-50 text-sky-800 border border-sky-200 font-medium",
    neutral: "bg-brand-cream text-brand-dark border border-brand-border font-medium",
    default: "bg-slate-100 text-slate-700 border border-slate-200 font-medium",
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full tracking-wide transition-colors ${sizeStyles[size]} ${style} ${className}`}>
      {children}
    </span>
  );
}
