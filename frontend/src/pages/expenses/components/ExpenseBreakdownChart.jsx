import React, { useState } from 'react';
import { PieChart, TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency.js';

const CATEGORY_COLORS = {
  'Raw Materials': { bg: 'bg-amber-500', bar: '#f59e0b', text: 'text-amber-700', border: 'border-amber-300' },
  'Gas': { bg: 'bg-orange-500', bar: '#f97316', text: 'text-orange-700', border: 'border-orange-300' },
  'Electricity': { bg: 'bg-yellow-500', bar: '#eab308', text: 'text-yellow-700', border: 'border-yellow-300' },
  'Salaries': { bg: 'bg-emerald-500', bar: '#10b981', text: 'text-emerald-700', border: 'border-emerald-300' },
  'Packaging': { bg: 'bg-sky-500', bar: '#0ea5e9', text: 'text-sky-700', border: 'border-sky-300' },
  'Transportation': { bg: 'bg-indigo-500', bar: '#6366f1', text: 'text-indigo-700', border: 'border-indigo-300' },
  'Maintenance': { bg: 'bg-rose-500', bar: '#f43f5e', text: 'text-rose-700', border: 'border-rose-300' },
  'Other': { bg: 'bg-slate-500', bar: '#64748b', text: 'text-slate-700', border: 'border-slate-300' },
};

export function ExpenseBreakdownChart({ categoryBreakdown = [], totalExpenses = 0, selectedCategory = 'all' }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Filter breakdown if a specific category is selected
  const displayItems = selectedCategory === 'all'
    ? categoryBreakdown.filter((item) => item.total > 0)
    : categoryBreakdown.filter((item) => item.category === selectedCategory && item.total > 0);

  if (displayItems.length === 0 || totalExpenses === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-600">No expense records found for this period</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Expense distribution and spending breakdown will render automatically once expenses are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Distribution Bar (Multi-segment progress meter) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Overall Spending Distribution</span>
          <span className="font-bold text-slate-900">{formatCurrency(totalExpenses)} Total</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {displayItems.map((item) => {
            const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'];
            const percent = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
            const isHovered = hoveredCategory === item.category;

            return (
              <div
                key={item.category}
                style={{ width: `${percent}%` }}
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`h-full transition-all duration-200 cursor-pointer relative group ${color.bg} ${
                  isHovered ? 'brightness-110 scale-y-110 z-10' : 'opacity-95'
                }`}
                title={`${item.category}: ${formatCurrency(item.total)} (${Math.round(percent)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Grid of Category Bars and Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {displayItems.map((item) => {
          const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'];
          const percent = totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0;
          const isHovered = hoveredCategory === item.category;

          return (
            <div
              key={item.category}
              onMouseEnter={() => setHoveredCategory(item.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                isHovered
                  ? 'bg-slate-50 border-brand-500 shadow-md ring-1 ring-brand-500/20'
                  : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                  <span className="truncate">{item.category}</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500 font-mono">
                  {percent}%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(item.total)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.count} {item.count === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {/* Progress Track */}
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color.bg}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

