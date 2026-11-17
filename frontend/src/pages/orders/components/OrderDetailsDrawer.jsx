import React, { useMemo } from 'react';
import {
  X,
  Receipt,
  Printer,
  CreditCard,
  Banknote,
  RotateCcw,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  ChefHat,
  Flame,
  Bell,
  User,
  Phone,
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  History
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateTime } from '../../../utils/dateUtils';
import { Badge } from '../../../components/common/Badge';

/**
 * OrderDetailsDrawer Component
 * Slide-over drawer / modal displaying complete order information, item snapshots,
 * pricing, financial breakdown, lifecycle timeline, and payment transaction history.
 */
export function OrderDetailsDrawer({
  isOpen,
  order,
  payments = [],
  balances = null,
  onClose,
  onOpenReceipt,
  onOpenPayment,
  onRequestCancel,
  onRequestRefund,
}) {
  if (!isOpen || !order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const financials = order.financials || {};
  const subtotal = financials.subtotal ?? order.totalAmount ?? 0;
  const discountAmount = financials.discountAmount ?? 0;
  const grandTotal = financials.grandTotal ?? order.totalAmount ?? 0;
  const cogs = financials.totalCostOfGoodsSold ?? 0;
  const grossProfit = Math.max(0, grandTotal - cogs);
  const marginPercent = grandTotal > 0 ? Math.round((grossProfit / grandTotal) * 100) : 0;

  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'successful';
  const isPartiallyRefunded = order.paymentStatus === 'partially_refunded';
  const isFullyRefunded = order.paymentStatus === 'refunded';
  const isCancelled = order.orderStatus === 'cancelled';
  const isCompleted = order.orderStatus === 'completed';

  // Balances calculation
  const totalCollected = balances?.totalCollected ?? (isPaid || isPartiallyRefunded || isFullyRefunded ? grandTotal : 0);
  const totalRefunded = balances?.totalRefunded ?? Number(order.totalRefundedAmount ?? 0);
  const remainingRefundable = Math.max(0, totalCollected - totalRefunded);

  // Build Chronological Lifecycle Timeline
  const timelineEvents = useMemo(() => {
    const events = [];

    // 1. Creation
    if (order.createdAt) {
      events.push({
        title: 'Order Placed at Counter',
        subtitle: `Walk-in ticket created by ${order.createdBy || 'Staff'}`,
        timestamp: order.createdAt,
        status: 'done',
        icon: FileText,
        color: 'sky',
      });
    }

    // 2. Initial Payment Event
    if ((isPaid || isPartiallyRefunded || isFullyRefunded) && order.paymentDetails?.verifiedAt) {
      events.push({
        title: 'Payment Confirmed',
        subtitle: `Method: ${order.paymentMethod || 'cash'} • Ref: ${order.paymentDetails?.transactionRef || 'Direct'}`,
        timestamp: order.paymentDetails.verifiedAt,
        status: 'done',
        icon: CreditCard,
        color: 'emerald',
      });
    } else if (order.paymentStatus === 'failed') {
      events.push({
        title: 'Payment Attempt Failed',
        subtitle: order.paymentDetails?.error || 'Counter payment could not be completed',
        timestamp: order.updatedAt || order.createdAt,
        status: 'failed',
        icon: AlertCircle,
        color: 'rose',
      });
    }

    // 3. Kitchen Preparing
    if (order.preparingAt) {
      events.push({
        title: 'Food Preparation Started',
        subtitle: 'Cook acknowledged ticket in KDS',
        timestamp: order.preparingAt,
        status: 'done',
        icon: Flame,
        color: 'amber',
      });
    }

    // 4. Ready for Pickup
    if (order.readyAt) {
      events.push({
        title: 'Food Ready for Pickup',
        subtitle: `Token #${order.pickupToken} called for counter handover`,
        timestamp: order.readyAt,
        status: 'done',
        icon: Bell,
        color: 'emerald',
      });
    }

    // 5. Completed
    if (order.completedAt) {
      events.push({
        title: 'Order Served & Completed',
        subtitle: 'Food handed over to customer',
        timestamp: order.completedAt,
        status: 'done',
        icon: CheckCircle2,
        color: 'brand',
      });
    }

    // 6. Cancellation
    if (isCancelled) {
      events.push({
        title: 'Order Cancelled / Voided',
        subtitle: `Reason: ${order.cancellationReason || 'Staff cancelled ticket'}`,
        timestamp: order.cancelledAt || order.updatedAt,
        status: 'cancelled',
        icon: Ban,
        color: 'rose',
      });
    }

    // 7. Refund Events from payments audit log
    const refundRecords = (payments || []).filter(
      (p) => p.paymentStatus === 'refunded' || p.paymentStatus === 'partially_refunded'
    );
    if (refundRecords.length > 0) {
      refundRecords.forEach((r, idx) => {
        events.push({
          title: r.paymentDetails?.isPartial ? `Partial Refund #${idx + 1}` : 'Refund Processed',
          subtitle: `Amount: ${formatCurrency(r.amount)} • Reason: ${r.paymentDetails?.refundReason || 'Staff initiated refund'}`,
          timestamp: r.createdAt || r.paymentDetails?.refundedAt,
          status: 'refunded',
          icon: RotateCcw,
          color: 'amber',
        });
      });
    } else if (isFullyRefunded || isPartiallyRefunded) {
      events.push({
        title: isPartiallyRefunded ? 'Partial Refund Processed' : 'Full Refund Processed',
        subtitle: `Total Refunded: ${formatCurrency(totalRefunded)} • Reason: ${order.refundReason || 'Customer requested refund'}`,
        timestamp: order.refundedAt || order.updatedAt,
        status: 'refunded',
        icon: RotateCcw,
        color: 'amber',
      });
    }

    // Sort chronologically
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [order, isPaid, isPartiallyRefunded, isFullyRefunded, isCancelled, grandTotal, payments, totalRefunded]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/70 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Drawer Panel */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-navy-950 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 font-extrabold flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold tracking-wider text-brand-300">Token</span>
              <span className="text-lg font-black leading-tight text-white">#{order.pickupToken || '—'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white font-mono tracking-wider">
                  {order.orderNumber}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stall: <span className="text-slate-200 font-semibold">{order.stallId}</span> • Placed {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                order.orderStatus === 'completed'
                  ? 'success'
                  : order.orderStatus === 'cancelled'
                  ? 'danger'
                  : 'warning'
              }
              size="md"
            >
              {order.orderStatus}
            </Badge>
            <Badge
              variant={
                isPaid
                  ? 'success'
                  : isPartiallyRefunded || isFullyRefunded
                  ? 'warning'
                  : order.paymentStatus === 'failed'
                  ? 'danger'
                  : 'warning'
              }
              size="md"
            >
              {order.paymentStatus}
            </Badge>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 text-xs">
          {/* Customer Special Notes / Allergy Banner */}
          {order.customerNotes && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase text-[10px] tracking-wider text-amber-700 block">Chef Instructions:</span>
                <span className="text-xs font-medium">{order.customerNotes}</span>
              </div>
            </div>
          )}

          {/* Cancellation Notice Banner */}
          {isCancelled && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase text-[10px] tracking-wider text-rose-700 block">Order Cancelled:</span>
                <span className="text-xs">{order.cancellationReason || 'No specific cancellation reason provided.'}</span>
                {order.cancelledAt && (
                  <span className="block text-[10px] text-rose-600 mt-0.5 font-mono">
                    Cancelled at: {formatDateTime(order.cancelledAt)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Refund Status Banner (Full or Partial) */}
          {(isPartiallyRefunded || isFullyRefunded) && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase text-[10px] tracking-wider text-amber-800 block">
                    {isPartiallyRefunded ? 'Partial Refund Audit:' : 'Full Refund Processed:'}
                  </span>
                  <span className="text-xs font-semibold">
                    Refund Reason: {order.refundReason || 'Customer requested refund'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-amber-200/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Collected:</span>
                  <span className="font-bold font-mono text-slate-800">{formatCurrency(totalCollected)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Refunded:</span>
                  <span className="font-bold font-mono text-amber-800">{formatCurrency(totalRefunded)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Remaining:</span>
                  <span className="font-bold font-mono text-slate-800">{formatCurrency(remainingRefundable)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer & Counter Information Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Customer Mobile</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {order.customerMobile || 'Walk-in (Unspecified)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Order Type</span>
              <span className="font-bold text-slate-900 text-xs uppercase">
                {order.orderType || 'Walk-in'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Cashier / Staff</span>
              <span className="font-medium text-slate-800 text-xs truncate block">
                {order.createdBy || 'Counter Staff'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Payment Method</span>
              <span className="font-bold text-slate-900 text-xs uppercase">
                {order.paymentMethod || 'cash'}
              </span>
            </div>
          </div>

          {/* Deep Item Snapshot Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-brand-500" />
                <span>Historical Item Snapshot ({items.reduce((acc, it) => acc + (it.quantity || 1), 0)} pcs)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Frozen at Order Placement</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-subtle">
              <table className="w-full text-left divide-y divide-slate-100">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {items.map((item, idx) => (
                    <tr key={`${item.menuItemId || item.name}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-[10px]">
                        {item.category || '—'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(item.itemTotal || item.sellingPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Audit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Financial Summary</span>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold font-mono text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({financials.discountType || 'applied'}):</span>
                  <span className="font-semibold font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-brand-600 font-mono">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Profit & Cost Audit</span>
              <div className="flex justify-between text-slate-600">
                <span>Estimated COGS:</span>
                <span className="font-semibold font-mono text-slate-900">{formatCurrency(cogs)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gross Profit:</span>
                <span className="font-semibold font-mono text-emerald-600">{formatCurrency(grossProfit)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Gross Margin:</span>
                <span className="font-mono text-slate-800">{marginPercent}%</span>
              </div>
            </div>
          </div>

          {/* Chronological Lifecycle Timeline */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <History className="w-4 h-4 text-brand-500" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Order Lifecycle Timeline
              </h3>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineEvents.map((evt, idx) => {
                const Icon = evt.icon;
                return (
                  <div key={idx} className="relative group">
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        evt.status === 'done'
                          ? 'border-emerald-500 text-emerald-600'
                          : evt.status === 'failed' || evt.status === 'cancelled'
                          ? 'border-rose-500 text-rose-600'
                          : 'border-amber-500 text-amber-600'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          evt.status === 'done'
                            ? 'bg-emerald-500'
                            : evt.status === 'failed' || evt.status === 'cancelled'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{evt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(evt.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{evt.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Transaction Audit Records */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span>Payment Records & Audit Log ({payments.length} entries)</span>
              </h3>
            </div>

            {payments.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                No external payment transaction records found in store.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{p.id}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            p.paymentStatus === 'paid' || p.paymentStatus === 'successful'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.paymentStatus === 'refunded' || p.paymentStatus === 'partially_refunded'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Method: <span className="font-semibold text-slate-700 uppercase">{p.paymentMethod}</span>
                        {p.paymentDetails?.transactionRef && (
                          <span> • Ref: <code className="font-mono text-slate-800">{p.paymentDetails.transactionRef}</code></span>
                        )}
                        {p.paymentDetails?.refundReason && (
                          <span> • Reason: <span className="text-amber-800 font-medium">{p.paymentDetails.refundReason}</span></span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 font-mono text-sm block">
                        {formatCurrency(p.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {formatDateTime(p.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Thermal Receipt Button */}
            {(isPaid || isPartiallyRefunded || isFullyRefunded) && (
              <button
                type="button"
                onClick={() => onOpenReceipt(order)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-brand-400" />
                <span>Thermal Receipt</span>
              </button>
            )}

            {/* Collect / Retry Payment Button */}
            {!isPaid && !isPartiallyRefunded && !isFullyRefunded && !isCancelled && (
              <button
                type="button"
                onClick={() => onOpenPayment(order)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{order.paymentStatus === 'failed' ? 'Retry Payment' : 'Collect Payment'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Cancel Order Action (for active unpaid orders) */}
            {!isCancelled && !isPaid && !isPartiallyRefunded && !isFullyRefunded && !isCompleted && (
              <button
                type="button"
                onClick={() => onRequestCancel(order)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}

            {/* Process Refund Action (for paid or partially refunded orders with remaining balance) */}
            {(isPaid || isPartiallyRefunded) && remainingRefundable > 0 && (
              <button
                type="button"
                onClick={() => onRequestRefund(order)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isPartiallyRefunded ? 'Process Add’l Refund' : 'Process Refund'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
