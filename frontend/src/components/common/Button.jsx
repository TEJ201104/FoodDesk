import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-400 shadow-sm shadow-brand-500/20',
    secondary: 'bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-900 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-surface-50 focus:ring-slate-300',
    darkOutline: 'border border-slate-700 text-slate-200 bg-navy-900/80 hover:bg-navy-800 hover:text-white focus:ring-slate-600 shadow-sm',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm shadow-red-500/20',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400 shadow-sm shadow-emerald-600/20',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 rounded-lg',
  };

  const resolvedClass = twMerge(
    baseStyles,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={resolvedClass}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
}
