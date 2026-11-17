import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, AlertTriangle, Calendar, FileText } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { WASTAGE_REASONS, stallDataService } from '../../../services/stallDataService.js';
import { getKolkataDateOnlyString } from '../../../utils/dateUtils.js';

export function RecordWastageModal({
  isOpen,
  onClose,
  preselectedItem = null,
  allItems = [],
  currentStall,
  onWastageRecorded,
}) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [wastageReason, setWastageReason] = useState(WASTAGE_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
    } else if (allItems.length > 0) {
      setSelectedItemId(allItems[0].id);
    }
    setQuantity('');
    setWastageReason(WASTAGE_REASONS[0]);
    setNotes('');
    setDate(getKolkataDateOnlyString(new Date()));
    setErrorMessage('');
    setIsSubmitting(false);
  }, [preselectedItem, allItems, isOpen]);

  if (!isOpen) return null;

  const currentItem = allItems.find((i) => i.id === selectedItemId) || preselectedItem;
  const availableStock = currentItem ? Number(currentItem.currentStock) || 0 : 0;
  const numQty = Number(quantity) || 0;
  const isOverAvailable = numQty > availableStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentItem) {
      setErrorMessage('Please select an ingredient.');
      return;
    }

    if (isNaN(numQty) || numQty <= 0) {
      setErrorMessage('Wasted quantity must be a valid number greater than zero.');
      return;
    }

    if (numQty > availableStock) {
      setErrorMessage(
        `Wastage quantity (${numQty} ${currentItem.unit}) cannot exceed available stock (${availableStock} ${currentItem.unit}).`
      );
      return;
    }

    if (!wastageReason) {
      setErrorMessage('Please select a wastage reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = stallDataService.recordWastage(currentStall.id, currentItem.id, {
        quantity: numQty,
        wastageReason,
        notes: notes.trim(),
        date,
      });
      onWastageRecorded(result.item, result.movement);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record wastage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-rose-900 text-white flex items-center justify-between border-b border-rose-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-300">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Record Ingredient Wastage</h3>
              <p className="text-xs text-rose-200">
                Stall: <span className="font-semibold text-white">{currentStall?.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-800 transition-colors"
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

          {/* Ingredient Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Ingredient *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              disabled={Boolean(preselectedItem)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:bg-slate-100"
            >
              {allItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stock: {i.currentStock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Reason in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wasted Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Wasted Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="e.g. 2"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {currentItem?.unit || ''}
                </span>
              </div>
            </div>

            {/* Wastage Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Wastage Reason *
              </label>
              <select
                value={wastageReason}
                onChange={(e) => setWastageReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {WASTAGE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Impact Warning Strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Available On-Hand</span>
                <span className="font-bold text-slate-800">
                  {availableStock} {currentItem?.unit}
                </span>
              </div>

              <div className="text-rose-500 font-bold text-sm">
                - {numQty}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Remaining Stock</span>
                <span
                  className={`font-extrabold ${
                    isOverAvailable
                      ? 'text-rose-600'
                      : availableStock - numQty <= (currentItem?.minThreshold || 0)
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {availableStock - numQty} {currentItem?.unit}
                </span>
              </div>
            </div>

            {isOverAvailable && (
              <div className="mt-2 text-[11px] text-rose-600 font-semibold text-center">
                ⚠️ Wastage cannot exceed available stock!
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Wastage Date *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Incident Notes / Details (Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Expired seal broken, freezer temperature drop overnight"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
              variant="danger"
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting || isOverAvailable || numQty <= 0}
              icon={Trash2}
            >
              Confirm Wastage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

