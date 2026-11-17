import React, { useState } from 'react';
import { Calendar, Download, Printer, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

export function formatDateLabel(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function DateRangeFilterToolbar({
  activePreset = 'today',
  onSelectPreset,
  customRange = { startDate: '', endDate: '' },
  onCustomRangeChange,
  dateRangeMeta = null,
  onExportCSV,
  onOpenPrint,
  onRefresh,
  isLoading = false,
}) {
  const [localStart, setLocalStart] = useState(customRange.startDate || '');
  const [localEnd, setLocalEnd] = useState(customRange.endDate || '');
  const [validationError, setValidationError] = useState('');

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!localStart || !localEnd) {
      setValidationError('Please select both start and end dates.');
      return;
    }
    if (new Date(localStart) > new Date(localEnd)) {
      setValidationError('Start date cannot be after end date.');
      return;
    }
    setValidationError('');
    onCustomRangeChange({ startDate: localStart, endDate: localEnd });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
      {/* Top row: Presets & Primary Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Presets Button Group */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 bg-surface-50 rounded-lg border border-slate-200/60">
          {DATE_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setValidationError('');
                  onSelectPreset(preset.id);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Refresh, CSV, Print */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={onRefresh}
            loading={isLoading}
            title="Recalculate financial analytics"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={onExportCSV}
            title="Download CSV financial report"
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={onOpenPrint}
            title="Open printable P&L statement"
            className="border-slate-300"
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Custom Date Range Picker Accordion (Visible when custom preset is selected) */}
      {activePreset === 'custom' && (
        <form
          onSubmit={handleApplyCustom}
          className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 transition-all"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={localStart}
              onChange={(e) => {
                setLocalStart(e.target.value);
                setValidationError('');
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-full sm:w-auto"
              required
            />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={localEnd}
              onChange={(e) => {
                setLocalEnd(e.target.value);
                setValidationError('');
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-full sm:w-auto"
              required
            />
          </div>

          <Button type="submit" variant="primary" size="sm">
            Apply Range
          </Button>
        </form>
      )}

      {validationError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Date Range Meta Banner */}
      {dateRangeMeta && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">{dateRangeMeta.label}:</span>
            <span>
              {formatDateLabel(dateRangeMeta.startDate || dateRangeMeta.start)}{' '}
              –{' '}
              {formatDateLabel(dateRangeMeta.endDate || dateRangeMeta.end)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Strictly computed in Indian Standard Time (Asia/Kolkata)</span>
          </div>
        </div>
      )}
    </div>
  );
}

