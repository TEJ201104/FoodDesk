import React from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Percent,
  IndianRupee,
  Phone,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

export function POSCartSidebar({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  customerMobile = '',
  onChangeMobile,
  customerNotes = '',
  onChangeNotes,
  discountType = 'none',
  onChangeDiscountType,
  discountValue = 0,
  onChangeDiscountValue,
  paymentMethod = 'cash',
  onChangePaymentMethod,
  subtotal = 0,
  discountAmount = 0,
  grandTotal = 0,
  onOpenReview,
  activeStall,
}) {
  const totalItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-2xl shadow-card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-navy-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Counter Order</span>
              <span className="px-2 py-0.2 rounded-full bg-slate-800 text-brand-400 text-[10px] font-mono font-bold">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeStall?.name || 'Walk-in Counter'}
            </p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            title="Clear Cart"
            className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Clear</span>
          </button>
        )}
      </div>

      {/* Customer Contact & Notes (Collapsible or compact) */}
      <div className="p-3 bg-navy-950/40 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <input
            type="tel"
            value={customerMobile}
            onChange={(e) => onChangeMobile(e.target.value)}
            placeholder="Customer Mobile (Optional)"
            className="w-full pl-8 pr-3 py-1.5 bg-navy-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={customerNotes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Special instructions / notes"
            className="w-full pl-8 pr-3 py-1.5 bg-navy-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[360px] scrollbar-thin scrollbar-thumb-slate-800">
        {cartItems.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-2 text-slate-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-400">Cart is empty</p>
            <p className="text-[11px] text-slate-500 max-w-[200px] mt-0.5">
              Select items from the food menu to create a walk-in order.
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const itemTotal = item.sellingPrice * item.quantity;

            return (
              <div
                key={item.id}
                className="bg-navy-950/80 border border-slate-800/90 rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all hover:border-slate-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-100 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{formatCurrency(item.sellingPrice)}</span>
                    <span>×</span>
                    <span>{item.quantity}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(itemTotal)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-navy-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  title="Remove from Cart"
                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Calculation & Financial Controls */}
      {cartItems.length > 0 && (
        <div className="p-4 bg-navy-950 border-t border-slate-800 space-y-3">
          {/* Discount Tool */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-500" />
                <span>Apply Discount</span>
              </span>

              {/* Discount Type Toggle */}
              <div className="flex items-center gap-1 bg-navy-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    onChangeDiscountType('none');
                    onChangeDiscountValue(0);
                  }}
                  className={`px-2 py-0.5 rounded ${
                    discountType === 'none'
                      ? 'bg-brand-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDiscountType('percentage')}
                  className={`px-2 py-0.5 rounded ${
                    discountType === 'percentage'
                      ? 'bg-brand-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDiscountType('fixed')}
                  className={`px-2 py-0.5 rounded ${
                    discountType === 'fixed'
                      ? 'bg-brand-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ₹
                </button>
              </div>
            </div>

            {discountType !== 'none' && (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : subtotal}
                    value={discountValue || ''}
                    onChange={(e) => onChangeDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'Discount % (e.g. 10)' : 'Amount in ₹'}
                    className="w-full px-2.5 py-1 bg-navy-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                {/* Presets */}
                {discountType === 'percentage' ? (
                  <div className="flex items-center gap-1">
                    {[5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => onChangeDiscountValue(pct)}
                        className="px-2 py-1 rounded bg-navy-900 border border-slate-800 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {[20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onChangeDiscountValue(amt)}
                        className="px-2 py-1 rounded bg-navy-900 border border-slate-800 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Selector (Counter simulation) */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Payment Method
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => onChangePaymentMethod('cash')}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-brand-500 text-white border-brand-500 font-bold shadow-sm'
                    : 'bg-navy-900 border-slate-800 text-slate-300 hover:bg-navy-800'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => onChangePaymentMethod('upi_static_qr')}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  paymentMethod === 'upi_static_qr'
                    ? 'bg-brand-500 text-white border-brand-500 font-bold shadow-sm'
                    : 'bg-navy-900 border-slate-800 text-slate-300 hover:bg-navy-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => onChangePaymentMethod('upi_gateway')}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  paymentMethod === 'upi_gateway'
                    ? 'bg-brand-500 text-white border-brand-500 font-bold shadow-sm'
                    : 'bg-navy-900 border-slate-800 text-slate-300 hover:bg-navy-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Online</span>
              </button>
            </div>
          </div>

          {/* Subtotal, Discount & Grand Total Breakdown */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
              <div>
                <span className="text-sm font-extrabold text-white">Grand Total</span>
                <span className="text-[10px] text-slate-400 block">Inclusive of all taxes</span>
              </div>
              <span className="text-xl font-black text-brand-400 tracking-tight">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Review & Submit Button */}
          <button
            type="button"
            onClick={onOpenReview}
            disabled={cartItems.length === 0}
            className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Review & Create Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

