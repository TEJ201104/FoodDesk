import React from 'react';
import { X, History, Clock, User, ArrowDownCircle, ArrowUpCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { formatDateTime } from '../../../utils/dateUtils.js';

export function StockHistoryModal({
  isOpen,
  onClose,
  item = null,
  movements = [],
}) {
  if (!isOpen) return null;

  const filtered = item
    ? movements.filter((m) => m.inventoryItemId === item.id)
    : movements;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Stock Movement History</span>
                {item && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-navy-800 text-brand-400">
                    {item.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                {item
                  ? `Current Stock: ${item.currentStock} ${item.unit} • Threshold: ${item.minThreshold} ${item.unit}`
                  : 'All recorded inventory intakes, manual adjustments, and wastage incidents'}
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

        {/* Timeline List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No stock movements recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjustments and wastage records will appear chronologically here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => {
                const isAdd = m.type === 'add';
                const isReduce = m.type === 'reduce';
                const isWastage = m.type === 'wastage';
                const isInitial = m.type === 'initial';

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      isWastage
                        ? 'bg-rose-50/50 border-rose-200/80'
                        : isAdd || isInitial
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : 'bg-amber-50/50 border-amber-200/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isWastage
                            ? 'bg-rose-100 text-rose-600'
                            : isAdd || isInitial
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {isWastage ? (
                          <Trash2 className="w-4 h-4" />
                        ) : isAdd || isInitial ? (
                          <ArrowUpCircle className="w-4 h-4" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {m.ingredientName || item?.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              isWastage
                                ? 'bg-rose-100 text-rose-800'
                                : isAdd
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInitial
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isWastage ? 'Wastage' : isAdd ? 'Addition' : isInitial ? 'Initial Stock' : 'Reduction'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 mt-0.5">
                          <strong>Reason:</strong> {m.reason}
                          {m.notes && <span className="text-slate-500 italic"> ({m.notes})</span>}
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(m.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {m.user || 'Stall Staff'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Delta Counter */}
                    <div className="sm:text-right text-xs bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200/60 self-start sm:self-center">
                      <div className="font-mono text-xs">
                        <span className="text-slate-400">{m.previousQuantity}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <strong className="text-slate-900 font-extrabold">{m.newQuantity} {m.unit}</strong>
                      </div>
                      <div
                        className={`font-bold text-xs ${
                          m.quantityChanged > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged} {m.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

