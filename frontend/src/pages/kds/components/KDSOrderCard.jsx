import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Flame,
  ChefHat,
  Bell,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  CreditCard,
  Banknote,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { formatTime } from '../../../utils/dateUtils';

/**
 * KDSOrderCard Component
 * Displays an individual order with prominent pickup token, live elapsed timer,
 * dynamic delay indicators, item checklist, customer notes, and stage action buttons.
 */
export function KDSOrderCard({
  order,
  onTransition,
  now = Date.now(),
}) {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItemCheck = (idx) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Calculate elapsed time in seconds from order creation
  const elapsedSeconds = useMemo(() => {
    if (!order?.createdAt) return 0;
    const createdTime = new Date(order.createdAt).getTime();
    return Math.max(0, Math.floor((now - createdTime) / 1000));
  }, [order?.createdAt, now]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;

  // Delay urgency categories:
  // < 10 mins: normal / on-time
  // 10 - 15 mins: warning
  // > 15 mins: delayed / urgent
  const delayLevel = useMemo(() => {
    if (order.orderStatus === 'completed') return 'completed';
    if (elapsedMinutes >= 15) return 'delayed';
    if (elapsedMinutes >= 10) return 'warning';
    return 'normal';
  }, [elapsedMinutes, order.orderStatus]);

  const delayStyles = {
    normal: {
      cardBorder: 'border-slate-800 bg-navy-900/95 hover:border-slate-700',
      badgeBg: 'bg-slate-800/80 text-slate-300 border-slate-700',
      icon: Clock,
      label: `${elapsedMinutes}m ${remainingSeconds}s`,
    },
    warning: {
      cardBorder: 'border-amber-500/60 bg-navy-900/95 hover:border-amber-400 shadow-lg shadow-amber-950/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      icon: AlertTriangle,
      label: `>10m Warning (${elapsedMinutes}m)`,
    },
    delayed: {
      cardBorder: 'border-rose-500 bg-navy-900/95 ring-1 ring-rose-500/60 shadow-xl shadow-rose-950/40 animate-pulse-subtle',
      badgeBg: 'bg-rose-500/25 text-rose-200 border-rose-500/70 animate-pulse',
      icon: AlertCircle,
      label: `>15m DELAYED (${elapsedMinutes}m)`,
    },
    completed: {
      cardBorder: 'border-slate-800/80 bg-navy-950/80 opacity-80 hover:opacity-100',
      badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: CheckCircle2,
      label: `Served`,
    },
  }[delayLevel];

  // Payment badge rendering
  const paymentBadge = useMemo(() => {
    const status = (order.paymentStatus || 'pending').toLowerCase();
    if (status === 'paid' || status === 'successful') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          PAID
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3" />
          PAYMENT FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        PAY PENDING
      </span>
    );
  }, [order.paymentStatus]);

  const items = order.items || [];
  const allItemsChecked = items.length > 0 && items.every((_, idx) => checkedItems[idx]);

  return (
    <div
      className={`rounded-2xl border p-4 text-white transition-all duration-150 flex flex-col justify-between ${delayStyles.cardBorder}`}
      data-testid={`kds-card-${order.id}`}
      data-order-number={order.orderNumber}
      data-status={order.orderStatus}
    >
      {/* Top Header: Large Token & Timer */}
      <div>
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {/* Token Badge */}
            <div className="flex flex-col items-center justify-center bg-brand-500/20 border border-brand-500/40 text-brand-400 font-extrabold px-3 py-1.5 rounded-xl min-w-[58px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-300">Token</span>
              <span className="text-xl sm:text-2xl font-black leading-tight tracking-tight text-white">
                #{order.pickupToken || '—'}
              </span>
            </div>
            <div>
              <div className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                {order.orderNumber}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span>Ordered:</span>
                <span className="text-slate-300 font-medium">{formatTime(order.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Delay Indicator / Live Timer Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border font-mono tracking-tight ${delayStyles.badgeBg}`}
              title={`Elapsed time since order placement: ${elapsedMinutes}m ${remainingSeconds}s`}
            >
              <delayStyles.icon className="w-3 h-3" />
              <span>{delayStyles.label}</span>
            </span>

            {/* Financial Status Badge */}
            {paymentBadge}
          </div>
        </div>

        {/* Customer Special Notes / Allergy Banner */}
        {order.customerNotes && (
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <div className="leading-snug">
              <span className="font-bold uppercase text-[10px] tracking-wide text-amber-400 block">Chef Note:</span>
              <span>{order.customerNotes}</span>
            </div>
          </div>
        )}

        {/* Items List with Interactive Line Checkmarks */}
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1">
            <span>Items ({items.reduce((acc, it) => acc + (it.quantity || 1), 0)} pcs)</span>
            <span className="text-[10px] text-slate-400">Tap to check off</span>
          </div>

          <ul className="space-y-1.5">
            {items.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <li
                  key={`${item.menuItemId || item.name}-${idx}`}
                  onClick={() => toggleItemCheck(idx)}
                  className={`flex items-start justify-between gap-2 p-2 rounded-lg cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-slate-800/40 text-slate-400 line-through opacity-70'
                      : 'bg-navy-800/80 hover:bg-navy-800 text-slate-100 border border-slate-800/60'
                  }`}
                  title="Click to mark item prepared"
                >
                  <div className="flex items-start gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-sm text-white">
                        {item.quantity}x
                      </span>{' '}
                      <span className={`text-sm ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {item.name}
                      </span>
                      {item.category && (
                        <span className="block text-[10px] text-slate-400">{item.category}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Stage Progression & Revert Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        {/* Stage-Specific Primary Action */}
        {order.orderStatus === 'received' && (
          <button
            onClick={() => onTransition(order.id, 'preparing')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            data-testid={`action-start-preparing-${order.id}`}
          >
            <Flame className="w-4 h-4" />
            <span>Start Preparing</span>
          </button>
        )}

        {order.orderStatus === 'preparing' && (
          <button
            onClick={() => onTransition(order.id, 'ready')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            data-testid={`action-mark-ready-${order.id}`}
          >
            <Bell className="w-4 h-4" />
            <span>Mark Ready</span>
          </button>
        )}

        {order.orderStatus === 'ready' && (
          <button
            onClick={() => onTransition(order.id, 'completed')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            data-testid={`action-complete-order-${order.id}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete / Serve</span>
          </button>
        )}

        {order.orderStatus === 'completed' && (
          <div className="flex-1 py-2 px-3 rounded-xl bg-slate-800/70 text-slate-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Served to Customer</span>
          </div>
        )}

        {/* Operational Revert / Undo Action */}
        {order.orderStatus === 'preparing' && (
          <button
            onClick={() => onTransition(order.id, 'received')}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Revert to Received"
            aria-label="Revert to Received"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {order.orderStatus === 'ready' && (
          <button
            onClick={() => onTransition(order.id, 'preparing')}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Revert to Preparing"
            aria-label="Revert to Preparing"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {order.orderStatus === 'completed' && (
          <button
            onClick={() => onTransition(order.id, 'ready')}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs flex items-center gap-1 px-2.5"
            title="Undo Complete (Return to Ready)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        )}
      </div>
    </div>
  );
}

