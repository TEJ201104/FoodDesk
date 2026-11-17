import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Tag,
  FileText,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';
import { stallDataService } from '../../../services/stallDataService.js';
import { formatCurrency } from '../../../utils/currency.js';

// Preset food image chips for convenient prototype testing
const PRESET_FOOD_IMAGES = [
  { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80' },
  { label: 'Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80' },
  { label: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80' },
  { label: 'Momos', url: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&auto=format&fit=crop&q=80' },
  { label: 'Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80' },
  { label: 'Chai', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cooler', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Pastry', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80' },
  { label: 'Ice Cream', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80' },
];

export function MenuItemModal({
  isOpen,
  onClose,
  stallId,
  itemToEdit = null,
  categories = [],
  onSuccess,
}) {
  const isEditMode = Boolean(itemToEdit);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setCategory(itemToEdit.category || (categories[0]?.name || 'General'));
      setIsCustomCategory(false);
      setCustomCategory('');
      setSellingPrice(String(itemToEdit.sellingPrice ?? ''));
      setCostPrice(String(itemToEdit.costPrice ?? '0'));
      setDescription(itemToEdit.description || '');
      setImageUrl(itemToEdit.imageUrl || '');
      setIsVeg(itemToEdit.isVeg !== false);
      setIsAvailable(itemToEdit.isAvailable !== false);
    } else {
      setName('');
      setCategory(categories[0]?.name || 'Burgers');
      setIsCustomCategory(false);
      setCustomCategory('');
      setSellingPrice('');
      setCostPrice('');
      setDescription('');
      setImageUrl(PRESET_FOOD_IMAGES[0].url);
      setIsVeg(true);
      setIsAvailable(true);
    }
    setErrorMessage('');
  }, [itemToEdit, isOpen, categories]);

  // Derived financials
  const numSelling = Number(sellingPrice) || 0;
  const numCost = Number(costPrice) || 0;
  const grossProfit = numSelling - numCost;
  const marginPercent = numSelling > 0 ? Math.round((grossProfit / numSelling) * 100) : 0;
  const isLoss = numSelling > 0 && numSelling < numCost;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Field Validations
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Item name must be at least 2 characters long.');
      return;
    }

    const finalCategory = (isCustomCategory ? customCategory : category).trim();
    if (!finalCategory) {
      setErrorMessage('Please select or specify a category for this item.');
      return;
    }

    if (isNaN(numSelling) || numSelling <= 0) {
      setErrorMessage('Selling price must be a valid number greater than zero.');
      return;
    }

    if (isNaN(numCost) || numCost < 0) {
      setErrorMessage('Cost price cannot be negative.');
      return;
    }

    if (numSelling < numCost) {
      setErrorMessage(
        `Selling price (₹${numSelling}) cannot be lower than cost price (₹${numCost}). Items cannot be sold below cost.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        category: finalCategory,
        sellingPrice: numSelling,
        costPrice: numCost,
        description: description.trim(),
        imageUrl: imageUrl.trim() || PRESET_FOOD_IMAGES[0].url,
        isVeg,
        isAvailable,
      };

      let resultItem;
      if (isEditMode) {
        resultItem = stallDataService.updateMenuItem(stallId, itemToEdit.id, payload);
      } else {
        resultItem = stallDataService.addMenuItem(stallId, payload);
      }

      if (onSuccess) {
        onSuccess(resultItem, isEditMode);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save menu item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-surface-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isEditMode ? `Edit Menu Item: ${itemToEdit.name}` : 'Add New Menu Item'}
              </h3>
              <p className="text-[11px] text-slate-500">Stall ID: {stallId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span className="flex-1 font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Item Name & Dietary Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. Deluxe Veggie Burger"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Dietary Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-50 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsVeg(true)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    isVeg ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <span>Veg</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVeg(false)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    !isVeg ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] text-brand-600 font-bold hover:underline"
              >
                {isCustomCategory ? 'Choose Existing' : '+ New Category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                placeholder="Type new category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                maxLength={40}
                className="w-full px-3 py-2 bg-white border border-brand-500 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500"
              >
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name} {c.itemCount ? `(${c.itemCount} items)` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pricing Row: Selling Price vs Cost Price & Margin Indicator */}
          <div className="p-3.5 bg-surface-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Customer Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 120"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Owner Cost Price (₹) <span className="text-slate-400 text-[10px]">(Internal COGS)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 60"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Profit Margin Metric */}
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                isLoss
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {isLoss ? (
                    <strong>Warning: Negative Margin (Selling below cost)</strong>
                  ) : (
                    <span>
                      Gross Margin: <strong>{marginPercent}%</strong>
                    </span>
                  )}
                </span>
              </div>
              <span className="font-extrabold font-mono">
                {isLoss ? `-₹${Math.abs(grossProfit)} loss` : `+₹${grossProfit} profit`}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Description <span className="text-slate-400 text-[10px]">(Optional ingredients / preparation)</span>
            </label>
            <textarea
              rows={2}
              maxLength={250}
              placeholder="Crispy seasoned patty with fresh lettuce, tomatoes, and chef's secret mayo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Image URL & Preset Image Pickers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Food Image URL
              </label>
              <span className="text-[10px] text-slate-400">Quick presets below</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  type="url"
                  placeholder="Paste direct image URL or choose preset below..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                />
              </div>

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                />
              )}
            </div>

            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_FOOD_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                    imageUrl === preset.url
                      ? 'bg-brand-50 text-brand-700 border-brand-300 font-bold'
                      : 'bg-surface-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Status Toggle */}
          <div className="p-3.5 bg-surface-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Initial Availability</span>
              <span className="text-[11px] text-slate-500 block">
                {isAvailable
                  ? 'Item will be immediately available in POS and public menu'
                  : 'Item will be marked as Sold Out (unpurchasable in POS)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAvailable
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{isAvailable ? 'In Stock / Available' : 'Sold Out'}</span>
            </button>
          </div>

          {/* Historical Protection Reminder */}
          <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Price changes and edits apply strictly to <strong>future orders</strong>. All historical order snapshots, customer receipts, and past COGS calculations remain untouched.
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoss}
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isSubmitting
                  ? 'Saving Item...'
                  : isEditMode
                  ? 'Save Item Changes'
                  : 'Create Menu Item'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

