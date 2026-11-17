import React from 'react';
import { CheckCircle2, Ticket, Receipt, ArrowRight, RotateCcw, CreditCard, Printer } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { Link } from 'react-router-dom';

export function POSOrderSuccessModal({
  isOpen,
  onClose,
  createdOrder,
  onStartNextOrder,
  onOpenPayment,
  onOpenReceipt,
}) {
  if (!isOpen || !createdOrder) return null;

  const isPaid =
    createdOrder.paymentStatus === 'paid' ||
    createdOrder.paymentStatus === 'successful';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Check Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-white">
            Order Created Successfully!
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Walk-in counter order is recorded and queued for kitchen preparation.
          </p>
        </div>

        {/* Token & Order Number Card */}
        <div className="bg-navy-950/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold border border-brand-500/30">
            Pickup Token
          </div>
          <div className="text-4xl font-black text-brand-400 tracking-tight">
            #{createdOrder.pickupToken}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Order Number:</span>
            <span className="font-mono font-bold text-white">
              {createdOrder.orderNumber}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Amount:</span>
            <span className="font-extrabold text-emerald-400">
              {formatCurrency(createdOrder.financials?.grandTotal ?? createdOrder.totalAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Payment Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                isPaid
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {createdOrder.orderStatus} • {createdOrder.paymentStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!isPaid && onOpenPayment && (
            <button
              type="button"
              onClick={() => onOpenPayment(createdOrder)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
              <span>Collect Payment (Cash / UPI)</span>
            </button>
          )}

          {isPaid && onOpenReceipt && (
            <button
              type="button"
              onClick={() => onOpenReceipt(createdOrder)}
              className="w-full py-2.5 px-4 bg-navy-800 hover:bg-navy-700 text-white font-extrabold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-brand-400" />
              <span>Print Digital Thermal Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartNextOrder}
            className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Next Counter Order</span>
          </button>

          <Link
            to="/orders"
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View in Order History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
