import React from 'react';
import { Archive, RotateCcw, AlertTriangle, X, ShieldCheck } from 'lucide-react';

export function ArchiveConfirmModal({
  isOpen,
  onClose,
  item,
  onConfirmArchive,
  onConfirmRestore,
  mode = 'archive',
  isSubmitting = false,
}) {
  if (!isOpen || !item) return null;

  const isArchiveMode = mode === 'archive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-surface-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isArchiveMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isArchiveMode ? <Archive className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isArchiveMode ? 'Archive Menu Item' : 'Restore Menu Item'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{item.id}</p>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl border border-slate-200/70">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-slate-200"
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-900 text-sm truncate">{item.name}</h4>
              <p className="text-xs text-slate-500">Category: {item.category}</p>
              <p className="text-xs font-bold text-brand-600 mt-0.5">Price: ₹{item.sellingPrice}</p>
            </div>
          </div>

          {isArchiveMode ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to archive <strong>"{item.name}"</strong>? It will no longer appear in the active menu, POS workstation, or public digital catalog.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-snug">
                  <strong>Historical Order Protection:</strong> All previous orders, customer receipts, and financial COGS records containing this item will remain <strong>100% unchanged</strong>.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">
              Restore <strong>"{item.name}"</strong> back to the active menu? It will immediately become available in your POS workstation and public menu.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          {isArchiveMode ? (
            <button
              type="button"
              onClick={onConfirmArchive}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Archiving...' : 'Archive Item'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirmRestore}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Restoring...' : 'Restore to Active Menu'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

