import React from 'react';
import { X, History, Clock, User, Calendar, Tag, IndianRupee, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { formatCurrency } from '../../../utils/currency.js';
import { formatDateTime } from '../../../utils/dateUtils.js';

export function ExpenseHistoryModal({ isOpen, onClose, expense }) {
  if (!isOpen || !expense) return null;

  const auditTrail = Array.isArray(expense.auditTrail) ? expense.auditTrail : [];

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
                <span>Expense Audit Trail</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-300">
                  {expense.id}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Category: <span className="font-semibold text-brand-400">{expense.category}</span> • Current Amount: <span className="font-bold text-white">{formatCurrency(expense.amount)}</span>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current State Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Current Record State
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Immutable Audit Verified
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Amount</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(expense.amount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-bold text-slate-800">{expense.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Expense Date</span>
                <span className="font-medium text-slate-800">{expense.date || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Stall ID</span>
                <span className="font-mono text-slate-700">{expense.stallId}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <span className="font-medium text-slate-500">Description: </span>
              {expense.description}
            </div>
          </div>

          {/* Chronological Audit Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Modification & Version History ({auditTrail.length} entries)</span>
            </h4>

            {auditTrail.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No audit entries recorded for this expense.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {auditTrail.map((entry, idx) => {
                  const isCreated = entry.action === 'created';
                  const isEdited = entry.action === 'edited';
                  const isDeleted = entry.action === 'deleted';

                  return (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isCreated
                            ? 'border-emerald-500 ring-2 ring-emerald-100'
                            : isDeleted
                            ? 'border-rose-500 ring-2 ring-rose-100'
                            : 'border-brand-500 ring-2 ring-brand-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCreated
                              ? 'bg-emerald-500'
                              : isDeleted
                              ? 'bg-rose-500'
                              : 'bg-brand-500'
                          }`}
                        />
                      </span>

                      {/* Timeline Card */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCreated
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isDeleted
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-brand-100 text-brand-800 border border-brand-200'
                            }`}
                          >
                            {isCreated ? 'Record Created' : isDeleted ? 'Record Deleted' : 'Record Edited'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>

                        {/* Responsible User */}
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Action by: <strong className="text-slate-800">{entry.user || 'Stall Owner'}</strong></span>
                        </div>

                        {/* Stated Reason */}
                        {entry.reason && (
                          <div className="text-xs bg-amber-50/80 p-2 rounded-lg border border-amber-200 text-amber-900">
                            <strong>Reason:</strong> {entry.reason}
                          </div>
                        )}

                        {/* Details for created */}
                        {entry.details && (
                          <div className="text-xs text-slate-600">
                            {entry.details}
                          </div>
                        )}

                        {/* Value Diffs for edited */}
                        {isEdited && entry.previous && entry.updated && (
                          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-slate-50 rounded border border-slate-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Previous Value
                              </span>
                              <div className="space-y-0.5">
                                <div><span className="text-slate-500">Amount:</span> <span className="font-semibold line-through text-slate-700">{formatCurrency(entry.previous.amount)}</span></div>
                                <div><span className="text-slate-500">Category:</span> {entry.previous.category}</div>
                                <div><span className="text-slate-500">Date:</span> {entry.previous.date}</div>
                              </div>
                            </div>
                            <div className="p-2 bg-brand-50/50 rounded border border-brand-200/60">
                              <span className="text-[10px] uppercase font-bold text-brand-600 block mb-1">
                                Updated Value
                              </span>
                              <div className="space-y-0.5">
                                <div><span className="text-slate-500">Amount:</span> <strong className="text-brand-700">{formatCurrency(entry.updated.amount)}</strong></div>
                                <div><span className="text-slate-500">Category:</span> <strong>{entry.updated.category}</strong></div>
                                <div><span className="text-slate-500">Date:</span> <strong>{entry.updated.date}</strong></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

