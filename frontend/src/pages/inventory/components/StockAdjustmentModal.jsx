import React, { useState, useEffect } from 'react';
import { X, ArrowUpDown, PlusCircle, MinusCircle, AlertCircle, CheckCircle2, PackageCheck } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { stallDataService } from '../../../services/stallDataService.js';

export function StockAdjustmentModal({
  isOpen,
  onClose,
  item,
  currentStall,
  onAdjustmentComplete,
}) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' | 'reduce'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Purchased new stock from vendor');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setAdjustmentType('add');
      setQuantity('');
      setReason('Purchased new stock from vendor');
      setNotes('');
      setErrorMessage('');
    }
    setIsSubmitting(false);
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const currentStock = Number(item.currentStock) || 0;
  const numQty = Number(quantity) || 0;
  const projectedStock = adjustmentType === 'add' ? currentStock + numQty : currentStock - numQty;
  const isNegative = projectedStock < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isNaN(numQty) || numQty <= 0) {
      setErrorMessage('Please enter a valid quantity greater than zero.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please specify an adjustment reason.');
      return;
    }

    if (isNegative) {
      setErrorMessage(
        `Insufficient Stock: Cannot reduce ${numQty} ${item.unit}. Available stock is only ${currentStock} ${item.unit}. Negative stock is strictly disallowed.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = stallDataService.adjustStock(currentStall.id, item.id, {
        type: adjustmentType,
        quantity: numQty,
        reason: reason.trim(),
        notes: notes.trim(),
      });
      onAdjustmentComplete(result.item, result.movement);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Adjust Stock Level</h3>
              <p className="text-xs text-slate-300">
                Ingredient: <span className="font-semibold text-brand-400">{item.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Operation Selector Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Adjustment Operation
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('add');
                  setReason('Purchased new stock from vendor');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  adjustmentType === 'add'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Stock (Intake)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('reduce');
                  setReason('Correction after physical count');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  adjustmentType === 'reduce'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>Reduce Stock</span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Quantity to {adjustmentType === 'add' ? 'Add' : 'Deduct'} ({item.unit}) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder={`e.g. 10`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {item.unit}
              </span>
            </div>
          </div>

          {/* Live Before / After Stock Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Projected Stock Change
            </span>
            <div className="flex items-center justify-between text-xs">
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">Current</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currentStock} {item.unit}
                </span>
              </div>

              <div className="text-slate-400 font-bold text-sm">
                {adjustmentType === 'add' ? '+' : '-'} {numQty}
              </div>

              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">New On-Hand</span>
                <span
                  className={`font-extrabold text-sm ${
                    isNegative
                      ? 'text-rose-600'
                      : projectedStock <= item.minThreshold
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {projectedStock} {item.unit}
                </span>
              </div>
            </div>

            {isNegative && (
              <div className="mt-2 text-[11px] text-rose-600 font-semibold text-center">
                ⚠️ Stock cannot fall below 0.
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Reason *
            </label>
            <input
              type="text"
              placeholder="e.g. Purchased fresh weekly batch, stock reconciliation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Vendor Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #9281, Metro Wholesale"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={adjustmentType === 'add' ? 'success' : 'primary'}
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting || isNegative || numQty <= 0}
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

