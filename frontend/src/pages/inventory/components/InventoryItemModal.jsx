import React, { useState, useEffect } from 'react';
import { X, Boxes, AlertCircle, Scale, Tag, FileText, IndianRupee, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { INVENTORY_UNITS, stallDataService } from '../../../services/stallDataService.js';

export function InventoryItemModal({
  isOpen,
  onClose,
  itemToEdit = null,
  currentStall,
  onItemSaved,
}) {
  const isEdit = Boolean(itemToEdit);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState(INVENTORY_UNITS[0]);
  const [initialStock, setInitialStock] = useState('0');
  const [minThreshold, setMinThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setUnit(itemToEdit.unit || INVENTORY_UNITS[0]);
      setInitialStock(String(itemToEdit.currentStock ?? 0));
      setMinThreshold(String(itemToEdit.minThreshold ?? 0));
      setCostPerUnit(itemToEdit.costPerUnit ? String(itemToEdit.costPerUnit) : '');
      setDescription(itemToEdit.description || '');
    } else {
      setName('');
      setUnit('kg');
      setInitialStock('0');
      setMinThreshold('5');
      setCostPerUnit('');
      setDescription('');
    }
    setErrorMessage('');
    setIsSubmitting(false);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Ingredient name is required (at least 2 characters).');
      return;
    }

    if (!unit || !INVENTORY_UNITS.includes(unit)) {
      setErrorMessage(`Please select a valid unit of measurement.`);
      return;
    }

    const numThreshold = Number(minThreshold);
    if (isNaN(numThreshold) || numThreshold < 0) {
      setErrorMessage('Minimum stock threshold must be a non-negative number.');
      return;
    }

    const numInitialStock = Number(initialStock);
    if (!isEdit && (isNaN(numInitialStock) || numInitialStock < 0)) {
      setErrorMessage('Initial stock quantity cannot be negative.');
      return;
    }

    const numCost = costPerUnit ? Number(costPerUnit) : 0;
    if (isNaN(numCost) || numCost < 0) {
      setErrorMessage('Cost per unit cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const updated = stallDataService.updateInventoryItem(currentStall.id, itemToEdit.id, {
          name: trimmedName,
          unit,
          minThreshold: numThreshold,
          costPerUnit: numCost,
          description: description.trim(),
        });
        onItemSaved(updated, true);
      } else {
        const created = stallDataService.createInventoryItem(currentStall.id, {
          name: trimmedName,
          unit,
          initialStock: numInitialStock,
          minThreshold: numThreshold,
          costPerUnit: numCost,
          description: description.trim(),
        });
        onItemSaved(created, false);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save inventory item.');
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
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isEdit ? 'Edit Ingredient' : 'Add New Ingredient'}
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

          {/* Ingredient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ingredient Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Burger Buns (Pack of 12), Fresh Whole Milk, Mozzarella"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Unit of Measurement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-brand-500" />
                <span>Unit of Measure *</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {INVENTORY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Stock Threshold */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Min Stock Alert Level *</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 10"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Triggers Low Stock warning when stock is at or below this level.
              </p>
            </div>
          </div>

          {/* Initial Stock (Only for Add mode) vs Current Stock Warning (Edit mode) */}
          {!isEdit ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Stock Quantity ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 25"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cost per Unit (₹)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 40"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Current On-Hand Stock:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {itemToEdit.currentStock} {itemToEdit.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                🔒 In accordance with FoodDesk inventory accounting rules, stock levels cannot be arbitrarily overwritten through basic item edits. Please use the dedicated <strong>Adjust Stock</strong> or <strong>Record Wastage</strong> workflows to maintain an auditable movement trail.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Description / Supplier Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Wholesale bakery supplier delivered every Tuesday, stored in dry pantry"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

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
              {isEdit ? 'Save Changes' : 'Add Ingredient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

