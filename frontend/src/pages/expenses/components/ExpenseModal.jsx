import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, Calendar, Tag, FileText, IndianRupee } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { EXPENSE_CATEGORIES, stallDataService } from '../../../services/stallDataService.js';
import { getKolkataDateOnlyString } from '../../../utils/dateUtils.js';

export function ExpenseModal({
  isOpen,
  onClose,
  expenseToEdit = null,
  currentStall,
  onExpenseSaved,
}) {
  const isEdit = Boolean(expenseToEdit);

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category || EXPENSE_CATEGORIES[0]);
      setDescription(expenseToEdit.description || '');
      setAmount(String(expenseToEdit.amount || ''));
      setDate(
        expenseToEdit.date
          ? getKolkataDateOnlyString(expenseToEdit.date)
          : getKolkataDateOnlyString(new Date())
      );
      setChangeReason('');
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      setAmount('');
      setDate(getKolkataDateOnlyString(new Date()));
      setChangeReason('');
    }
    setErrorMessage('');
    setIsSubmitting(false);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      setErrorMessage('Please select a valid expense category.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 2) {
      setErrorMessage('Description must be at least 2 characters long.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Expense amount must be a valid number greater than zero.');
      return;
    }

    if (!date) {
      setErrorMessage('Expense date is mandatory.');
      return;
    }

    if (isEdit && !changeReason.trim()) {
      setErrorMessage('Please provide a reason for editing this historical expense record.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const updated = stallDataService.updateExpense(
          currentStall.id,
          expenseToEdit.id,
          {
            category,
            description: trimmedDesc,
            amount: numAmount,
            date,
          },
          changeReason.trim()
        );
        onExpenseSaved(updated, true);
      } else {
        const created = stallDataService.createExpense(currentStall.id, {
          category,
          description: trimmedDesc,
          amount: numAmount,
          date,
        });
        onExpenseSaved(created, false);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save expense. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isEdit ? 'Edit Stall Expense' : 'Record New Expense'}
              </h3>
              <p className="text-xs text-slate-300">
                Stall: <span className="font-semibold text-brand-400">{currentStall?.name}</span> ({currentStall?.id})
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

          {/* Expense Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-500" />
              <span>Expense Category *</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount (₹) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-brand-500" />
                <span>Amount (₹) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 1450"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>Expense Date *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-500" />
              <span>Description / Purpose *</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Fresh vegetables, dairy butter, burger buns from wholesale market"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Edit Reason (Audit Trail requirement) */}
          {isEdit && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                Reason for Edit (Preserved in Audit Trail) *
              </label>
              <input
                type="text"
                placeholder="e.g. Corrected invoice tax calculation, updated supplier note"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
              />
              <p className="text-[11px] text-amber-700">
                FoodDesk preserves the original creation timestamp and full audit trail of changes.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEdit ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

