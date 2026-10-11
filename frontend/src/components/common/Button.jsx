import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  loading = false,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-heading font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green/30 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-brand-yellow hover:bg-[#E5BE4E] text-brand-dark shadow-sm hover:shadow-yellow-glow active:scale-[0.98]",
    secondary: "bg-brand-green hover:bg-brand-dark text-white shadow-sm active:scale-[0.98]",
    outline: "bg-transparent border border-brand-green/30 hover:border-brand-green text-brand-green hover:bg-brand-green/5 active:scale-[0.98]",
    'outline-light': "bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm active:scale-[0.98]",
    ghost: "bg-transparent text-brand-text hover:bg-brand-dark/5",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-[0.98]",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? "w-3.5 h-3.5" : size === 'lg' ? "w-5 h-5" : "w-4 h-4"} />
      ) : null}
      {children}
    </button>
  );
}
