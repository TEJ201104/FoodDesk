import React from 'react';
import { X, Printer, Download, Store, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { formatCurrency } from '../../../utils/currency.js';

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

export function PrintableFinancialReport({
  isOpen,
  onClose,
  analytics,
  stall,
  dateRangeMeta,
  onExportCSV,
}) {
  if (!isOpen || !analytics) return null;

  const handlePrint = () => {
    window.print();
  };

  const generatedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Modal Dialog Card */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header (Hidden during actual print) */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="font-bold text-base text-white">Printable Financial & P&L Statement</h3>
              <p className="text-xs text-slate-400">
                Official statement formatted for 80mm POS or A4 print/PDF export
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={onExportCSV}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Export CSV
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document Content */}
        <div
          id="printable-financial-statement"
          className="p-8 sm:p-10 space-y-6 overflow-y-auto bg-white text-slate-900 print:p-0 print:m-0"
        >
          {/* Statement Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs font-bold tracking-widest text-brand-600 uppercase">
                  FoodDesk • Manage Smart. Serve Fast.
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Financial & Profit/Loss Statement
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-600">
                  <Store className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-800">{stall?.name || 'Stall Workspace'}</span>
                  <span className="text-slate-400">({stall?.id})</span>
                  <span className="text-slate-400">• {stall?.category || 'Counter Services'}</span>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Period: </span>
                  <span className="font-medium text-slate-900">{dateRangeMeta?.label || 'Custom Period'}</span>
                </div>
                <div>
                  <span>
                    {formatDateLabel(dateRangeMeta?.startDate || dateRangeMeta?.start)}{' '}
                    –{' '}
                    {formatDateLabel(dateRangeMeta?.endDate || dateRangeMeta?.end)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Generated: </span>
                  <span>{generatedAt} (IST)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statement P&L Summary Table */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Profit & Loss Summary
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Accounting Line Item</th>
                    <th className="px-4 py-3">Calculation Basis</th>
                    <th className="px-4 py-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* Gross Sales */}
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">Gross Sales</td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-500">
                      Total sales before discounts and refunds ({analytics.totalOrders} eligible orders)
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(analytics.grossSales, true)}
                    </td>
                  </tr>

                  {/* Discounts */}
                  <tr>
                    <td className="px-4 py-2.5 font-sans text-slate-700 pl-8">Less: Promotional Discounts</td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-500">Deductions applied at checkout</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      -{formatCurrency(analytics.discounts, true)}
                    </td>
                  </tr>

                  {/* Refunds */}
                  <tr>
                    <td className="px-4 py-2.5 font-sans text-slate-700 pl-8">Less: Customer Refunds</td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-500">Authorized cash/UPI reversals</td>
                    <td className="px-4 py-2.5 text-right text-rose-600">
                      -{formatCurrency(analytics.refunds, true)}
                    </td>
                  </tr>

                  {/* Net Revenue */}
                  <tr className="bg-brand-50/40 font-bold border-y border-brand-100">
                    <td className="px-4 py-2.5 font-sans text-brand-900">Net Revenue</td>
                    <td className="px-4 py-2.5 font-sans text-xs text-brand-700">
                      Gross Sales - Discounts - Refunds
                    </td>
                    <td className="px-4 py-2.5 text-right text-brand-900">
                      {formatCurrency(analytics.netRevenue, true)}
                    </td>
                  </tr>

                  {/* Cost of Goods Sold */}
                  <tr>
                    <td className="px-4 py-2.5 font-sans text-slate-700 pl-8">
                      Less: Cost of Goods Sold (COGS)
                    </td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-500">
                      Historical cost price snapshots × quantities sold
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-700">
                      -{formatCurrency(analytics.cogs, true)}
                    </td>
                  </tr>

                  {/* Gross Profit */}
                  <tr className="bg-slate-50 font-bold border-y border-slate-200">
                    <td className="px-4 py-2.5 font-sans text-slate-900">
                      Gross Profit <span className="font-normal text-xs text-slate-500">({analytics.grossMargin}% margin)</span>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-500">
                      Net Revenue - COGS
                    </td>
                    <td className={`px-4 py-2.5 text-right ${analytics.grossProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      {formatCurrency(analytics.grossProfit, true)}
                    </td>
                  </tr>

                  {/* Operating Expenses */}
                  <tr>
                    <td className="px-4 py-2.5 font-sans text-slate-700 pl-8">
                      Less: Direct Operating Expenses
                    </td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-500">
                      Salaries, utilities, maintenance, raw materials, etc.
                    </td>
                    <td className="px-4 py-2.5 text-right text-purple-700">
                      -{formatCurrency(analytics.totalExpenses, true)}
                    </td>
                  </tr>

                  {/* Net Profit */}
                  <tr
                    className={`font-extrabold text-base border-t-2 border-slate-900 ${
                      analytics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                    }`}
                  >
                    <td className="px-4 py-3 font-sans">
                      NET PROFIT / (LOSS){' '}
                      <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-white border border-current ml-2">
                        {analytics.profitMargin}% Margin
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-xs">
                      Gross Profit - Total Expenses
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(analytics.netProfit, true)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Secondary Details: Tender & Top Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Tender Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Tender Distribution
              </h3>
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                {analytics.paymentMethods.map((m) => (
                  <div key={m.key} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-700">{m.name}:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(m.value, true)}{' '}
                      <span className="text-slate-400 font-normal">({m.percentage}%, {m.count} txns)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Items Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Top 5 Best-Selling Items
              </h3>
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                {analytics.topSellingItems.length === 0 ? (
                  <div className="text-slate-400 italic">No item sales recorded in period</div>
                ) : (
                  analytics.topSellingItems.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700 truncate max-w-[160px]">
                        {idx + 1}. {item.name}:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.quantity} sold ({formatCurrency(item.revenue)})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Statement Footer & Audit Stamp */}
          <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>FoodDesk Real-Time Financial Aggregation Engine — Module 10 Verified</span>
            </div>
            <p>
              This statement is generated dynamically from verified Point of Sale orders, frozen cost snapshots, and auditable expense entries. All calculations adhere to PRD Section 11 financial standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

