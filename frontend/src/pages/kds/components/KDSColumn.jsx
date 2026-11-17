import React from 'react';
import {
  Inbox,
  Flame,
  Bell,
  CheckCircle2,
  CheckCheck,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';
import { KDSOrderCard } from './KDSOrderCard';

/**
 * KDSColumn Component
 * Represents one of the 4 Kanban columns (Received, Preparing, Ready, Completed).
 * Displays stage count, color-coded header, scrollable cards, and custom empty state.
 */
export function KDSColumn({
  stageKey,
  title,
  subtitle,
  orders = [],
  onTransition,
  now = Date.now(),
}) {
  const columnConfigs = {
    received: {
      icon: Inbox,
      themeColor: 'sky',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      headerBg: 'bg-sky-950/40 border-sky-500/30',
      emptyText: 'No new orders in queue.',
      emptySubtext: 'New walk-in counter tickets will appear here automatically.',
    },
    preparing: {
      icon: Flame,
      themeColor: 'amber',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      headerBg: 'bg-amber-950/40 border-amber-500/30',
      emptyText: 'Kitchen station is clear.',
      emptySubtext: 'Click "Start Preparing" on a received order to begin cooking.',
    },
    ready: {
      icon: Bell,
      themeColor: 'emerald',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      headerBg: 'bg-emerald-950/40 border-emerald-500/30',
      emptyText: 'No orders ready for pickup.',
      emptySubtext: 'Orders marked as ready will wait here for counter pickup.',
    },
    completed: {
      icon: CheckCheck,
      themeColor: 'slate',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      headerBg: 'bg-navy-950/60 border-slate-800',
      emptyText: 'No completed orders yet.',
      emptySubtext: 'Served orders will archive here for operational review.',
    },
  }[stageKey] || {
    icon: UtensilsCrossed,
    themeColor: 'brand',
    badgeBg: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    headerBg: 'bg-navy-900 border-slate-800',
    emptyText: 'No orders.',
    emptySubtext: '',
  };

  const IconComponent = columnConfigs.icon;

  return (
    <div
      className="flex flex-col bg-navy-950/90 rounded-2xl border border-slate-800 overflow-hidden shadow-card min-w-[280px] flex-1"
      data-testid={`kds-column-${stageKey}`}
    >
      {/* Column Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${columnConfigs.headerBg}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-navy-900 border border-slate-700 text-white">
            <IconComponent className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide uppercase">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Counter Badge */}
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${columnConfigs.badgeBg}`}
          data-testid={`kds-count-${stageKey}`}
        >
          {orders.length}
        </span>
      </div>

      {/* Orders Scroll Container */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] min-h-[380px] space-y-3">
        {orders.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-navy-900/60 border border-slate-800/80 flex items-center justify-center mb-3 text-slate-600">
              <IconComponent className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-400">{columnConfigs.emptyText}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
              {columnConfigs.emptySubtext}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <KDSOrderCard
              key={order.id}
              order={order}
              onTransition={onTransition}
              now={now}
            />
          ))
        )}
      </div>
    </div>
  );
}

