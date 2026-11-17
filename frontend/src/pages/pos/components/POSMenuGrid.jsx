import React, { useState } from 'react';
import { Plus, Check, AlertCircle, Utensils, SearchX } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { Badge } from '../../../components/common/Badge';

export function POSMenuGrid({
  items = [],
  cartQuantities = {},
  onAddToCart,
  searchQuery = '',
}) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  if (items.length === 0) {
    return (
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <SearchX className="w-12 h-12 text-slate-500 mb-3" />
        <h3 className="text-base font-bold text-slate-200">No Food Items Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          {searchQuery
            ? `No menu items matching "${searchQuery}". Try a different keyword or category.`
            : 'No menu items have been added to this stall yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const isSoldOut = item.isAvailable === false;
        const inCartCount = cartQuantities[item.id] || 0;
        const hasImageError = imageErrors[item.id] || !item.imageUrl;

        return (
          <div
            key={item.id}
            onClick={() => {
              if (!isSoldOut) onAddToCart(item);
            }}
            className={`group relative rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
              isSoldOut
                ? 'bg-navy-950/60 border-slate-800/60 opacity-60 cursor-not-allowed select-none'
                : inCartCount > 0
                ? 'bg-navy-900 border-brand-500/60 shadow-md shadow-brand-500/10 cursor-pointer hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/15'
                : 'bg-navy-900 border-slate-800 shadow-sm cursor-pointer hover:border-slate-700 hover:bg-navy-850 hover:shadow-md'
            }`}
          >
            {/* Image Header Area */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy-950">
              {hasImageError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-navy-950">
                  <Utensils className="w-8 h-8 mb-1 text-slate-600" />
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              ) : (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  onError={() => handleImageError(item.id)}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isSoldOut ? 'grayscale' : 'group-hover:scale-105'
                  }`}
                />
              )}

              {/* Price Pill */}
              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-navy-950/90 backdrop-blur-md border border-slate-700/80 text-white font-extrabold text-xs shadow-md">
                {formatCurrency(item.sellingPrice)}
              </div>

              {/* In-Cart Badge */}
              {inCartCount > 0 && !isSoldOut && (
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-brand-500 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{inCartCount} in cart</span>
                </div>
              )}

              {/* Sold Out Banner */}
              {isSoldOut && (
                <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-rose-500/90 text-white font-extrabold text-xs tracking-wider uppercase border border-rose-400 shadow-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Sold Out</span>
                  </span>
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {item.id}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Bottom Card Action */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  {formatCurrency(item.sellingPrice)}
                </span>
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSoldOut) onAddToCart(item);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                    isSoldOut
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : inCartCount > 0
                      ? 'bg-brand-500/20 text-brand-400 hover:bg-brand-500 hover:text-white border border-brand-500/40'
                      : 'bg-navy-800 text-slate-200 hover:bg-brand-500 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{inCartCount > 0 ? 'Add More' : 'Add Item'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

