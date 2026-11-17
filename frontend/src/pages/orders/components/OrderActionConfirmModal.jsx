import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  X,
  CreditCard,
  Ban,
  AlertCircle,
  IndianRupee
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

/**
 * OrderActionConfirmModal
 * Dedicated confirmation modal for sensitive operations:
 * 1. Cancel Order (Void walk-in counter ticket)
 * 2. Process Refund (Full or Partial simulated refund for paid orders)
 */
export function OrderActionConfirmModal({
  isOpen,
  actionType = 'cancel', // 'cancel' | 'refund'
  order,
  balances = null,
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const grandTotal = Number(order?.financials?.grandTotal ?? order?.totalAmount ?? 0);
  const totalCollected = balances?.totalCollected ?? grandTotal;
  const totalRefunded = balances?.totalRefunded ?? Number(order?.totalRefundedAmount ?? 0);
  const remainingRefundable = Math.max(0, totalCollected - totalRefunded);

  const [refundAmount, setRefundAmount] = useState(remainingRefundable);

  useEffect(() => {
    if (order) {
      const rem = Math.max(0, (balances?.totalCollected ?? Number(order.financials?.grandTotal ?? order.totalAmount ?? 0)) - (balances?.totalRefunded ?? Number(order.totalRefundedAmount ?? 0)));
      setRefundAmount(rem);
      setReason('');
      setNotes('');
    }
  }, [order, balances]);

  if (!isOpen || !order) return null;

  const isRefund = actionType === 'refund';
  const numericAmount = Number(refundAmount);
  const isAmountValid = isRefund ? numericAmount > 0 && numericAmount <= remainingRefundable : true;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRefund && !isAmountValid) return;

    onConfirm({
      reason: reason.trim() || (isRefund ? 'Customer requested refund' : 'Staff cancelled order'),
      notes: notes.trim(),
      amount: isRefund ? numericAmount : grandTotal,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up text-slate-800">
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isRefund ? 'bg-amber-50/70 border-amber-200' : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isRefund
                  ? 'bg-amber-500/20 text-amber-700'
                  : 'bg-rose-500/20 text-rose-700'
              }`}
            >
              {isRefund ? <RotateCcw className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isRefund ? 'Process Refund (Full / Partial)' : 'Cancel Walk-in Order'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {order.orderNumber} (Token #{order.pickupToken || '—'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Original Order Total:</span>
              <span className="font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Collected:</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalCollected)}</span>
            </div>
            {isRefund && totalRefunded > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Already Refunded:</span>
                <span>-{formatCurrency(totalRefunded)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Current Payment Status:</span>
              <span className="font-bold uppercase text-emerald-600">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Current Kitchen Stage:</span>
              <span className="font-bold uppercase text-brand-600">{order.orderStatus}</span>
            </div>
            {isRefund && (
              <div className="pt-1.5 border-t border-slate-200 flex justify-between font-extrabold text-xs text-slate-900">
                <span>Remaining Refundable Balance:</span>
                <span className="text-amber-800">{formatCurrency(remainingRefundable)}</span>
              </div>
            )}
          </div>

          {/* Refund Amount Input for Partial or Full Refund */}
          {isRefund && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Refund Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRefundAmount(remainingRefundable)}
                    className="text-[10px] text-brand-600 hover:underline font-bold"
                  >
                    Full Balance (₹{remainingRefundable})
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={remainingRefundable}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500 font-mono font-bold text-slate-900"
                  required
                />
              </div>
              {numericAmount > remainingRefundable && (
                <p className="text-[10px] text-rose-600 font-semibold">
                  Refund amount cannot exceed remaining balance (₹{remainingRefundable}).
                </p>
              )}
            </div>
          )}

          {/* Business Rule Notice */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isRefund
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="leading-relaxed">
              {isRefund ? (
                <>
                  <span className="font-bold">Financial Audit Record:</span> Processing a refund records a transaction in the payments audit log and updates payment status to{' '}
                  <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">
                    {numericAmount < remainingRefundable ? 'partially_refunded' : 'refunded'}
                  </code>
                  . As per PRD rules, refunding a payment does <strong>not</strong> alter the order's kitchen preparation status.
                </>
              ) : (
                <>
                  <span className="font-bold">Order Void:</span> This will cancel order{' '}
                  <span className="font-mono">{order.orderNumber}</span> and remove it from active kitchen queue.
                </>
              )}
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reason for {isRefund ? 'Refund' : 'Cancellation'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="">Select a reason...</option>
              {isRefund ? (
                <>
                  <option value="Customer changed mind / Left counter">Customer changed mind / Left counter</option>
                  <option value="Item out of stock / Sold out in kitchen">Item out of stock / Sold out in kitchen</option>
                  <option value="Food preparation delay / Customer cancelled">Food preparation delay / Customer cancelled</option>
                  <option value="Partial order adjustment / Item unavailable">Partial order adjustment / Item unavailable</option>
                  <option value="Cashier correction">Cashier correction</option>
                  <option value="Quality dissatisfaction">Quality dissatisfaction</option>
                </>
              ) : (
                <>
                  <option value="Customer walked away before payment">Customer walked away before payment</option>
                  <option value="Payment failed / Abandoned">Payment failed / Abandoned</option>
                  <option value="Accidental duplicate punch">Accidental duplicate punch</option>
                  <option value="Item unavailable">Item unavailable</option>
                </>
              )}
            </select>
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Additional Audit Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved by Shift Lead..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isProcessing || !reason || (isRefund && !isAmountValid)}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 ${
                isRefund
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : (
                <>
                  {isRefund ? <RotateCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>{isRefund ? `Confirm Refund (${formatCurrency(numericAmount)})` : 'Confirm Cancellation'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
