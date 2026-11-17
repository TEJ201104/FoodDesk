import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
}) {
  return (
    <div
      className={twMerge(
        'bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden',
        className
      )}
    >
      {(title || subtitle || action) && (
        <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className={`px-5 py-3 bg-surface-50 border-t border-slate-100 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
}

