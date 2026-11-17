import React from 'react';
import { X, CheckCircle2, ShoppingBag, Receipt, AlertCircle, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

export function POSOrderReviewModal({
  isOpen,
  onClose,
  onConfirmOrder,
  isSubmitting = false,
  cartItems = [],
  customerMobile = '',
  customerNotes = '',
  subtotal = 0,
  discountType = 'none',
  discountValue = 0,
  discountAmount = 0,
  grandTotal = 0,
  paymentMethod = 'cash',
  activeStall,
  nextOrderPreview,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-navy-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-navy-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Review Walk-in Order
              </h3>
              <p className="text-xs text-slate-400">
                {activeStall?.name} ({activeStall?.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Order Preview Badge Banner */}
          <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Planned Order Number
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {nextOrderPreview?.nextOrderNumber || 'ORD-YYYYMMDD-XXXX'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Pickup Token
              </span>
              <span className="font-extrabold text-brand-400 text-sm">
                #{nextOrderPreview?.nextPickupToken || 1}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          {(customerMobile || customerNotes) && (
            <div className="bg-navy-950/40 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
              {customerMobile && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Customer Mobile:</span>
                  <span className="text-slate-200 font-mono font-semibold">
                    +91 {customerMobile}
                  </span>
                </div>
              )}
              {customerNotes && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Special Notes:</span>
                  <span className="text-slate-200 italic">{customerNotes}</span>
                </div>
              )}
            </div>
          )}

          {/* Items Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ordered Items ({cartItems.length})
            </h4>
            <div className="divide-y divide-slate-800/60 bg-navy-950/60 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-slate-400 block text-[11px]">
                      {formatCurrency(item.sellingPrice)} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-slate-200">
                    {formatCurrency(item.sellingPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span>
                  Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'})
                </span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span>Payment Method</span>
              <span className="font-semibold text-slate-200 uppercase">
                {paymentMethod.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
              <span className="text-sm font-bold text-white">Grand Total</span>
              <span className="text-xl font-extrabold text-brand-400">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Order will be assigned an atomic sequence number, preserved with full item snapshots, and dispatched to the Kitchen Display System (KDS).
          </p>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-navy-950 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Back to Editing
          </button>
          <button
            type="button"
            onClick={onConfirmOrder}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Creating Order...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Create Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

