import React from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, PackageX, CheckCircle2 } from 'lucide-react';

export function LowStockAlertBanner({
  lowStockItems = [],
  onFilterLowStock,
  onAdjustStock,
}) {
  if (lowStockItems.length === 0) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <strong className="font-bold text-emerald-900">All Stock Levels Optimal: </strong>
            <span>All inventory ingredients are comfortably above their minimum replenishment thresholds.</span>
          </div>
        </div>
      </div>
    );
  }

  const outOfStockItems = lowStockItems.filter((i) => i.currentStock <= 0);
  const runningLowItems = lowStockItems.filter((i) => i.currentStock > 0);

  return (
    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-subtle animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
              <span>Inventory Replenishment Alert</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'Item Needs Restock' : 'Items Need Restock'}
              </span>
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              {outOfStockItems.length > 0 && (
                <strong className="text-rose-700">{outOfStockItems.length} completely out of stock. </strong>
              )}
              {runningLowItems.length > 0 && (
                <span>{runningLowItems.length} items at or below minimum threshold.</span>
              )}
            </p>
          </div>
        </div>

        {onFilterLowStock && (
          <button
            type="button"
            onClick={onFilterLowStock}
            className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <span>View Low Stock Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pill Chips for Alerted Items */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/80 text-xs">
        {lowStockItems.map((item) => {
          const isZero = item.currentStock <= 0;
          return (
            <div
              key={item.id}
              onClick={() => onAdjustStock && onAdjustStock(item)}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] ${
                isZero
                  ? 'bg-rose-100/90 text-rose-900 border-rose-300 hover:bg-rose-200'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/70'
              }`}
              title="Click to quickly restock this ingredient"
            >
              <span className={`w-2 h-2 rounded-full ${isZero ? 'bg-rose-600' : 'bg-amber-500'}`} />
              <span className="font-bold">{item.name}:</span>
              <span className="font-mono">
                {item.currentStock} / min {item.minThreshold} {item.unit}
              </span>
              <span className="text-[10px] text-amber-700 font-bold uppercase underline ml-1">
                Restock
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

