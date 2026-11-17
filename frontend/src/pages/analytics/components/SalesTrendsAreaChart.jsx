import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '../../../components/common/Card';
import { formatCurrency } from '../../../utils/currency.js';
import { TrendingUp, Calendar, Info } from 'lucide-react';

// Custom Tooltip component for Recharts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[180px] backdrop-blur-sm">
        <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-brand-400" />
          <span>{label}</span>
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold font-mono text-white">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function SalesTrendsAreaChart({ salesTrends = [], dateRangeLabel = '' }) {
  const hasData = salesTrends && salesTrends.length > 0 && salesTrends.some(
    (d) => (d.grossSales || 0) > 0 || (d.netRevenue || 0) > 0 || (d.expenses || 0) > 0
  );

  return (
    <Card
      title="Sales & Profitability Timeline"
      subtitle={`Continuous daily performance overview for ${dateRangeLabel || 'selected period'}`}
      action={
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
          <span>Multi-metric Area Chart</span>
        </div>
      }
    >
      {!hasData ? (
        <div className="h-72 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-surface-50">
          <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Sales or Expense Records Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Sales trends will automatically visualize once confirmed orders or business expenses are recorded within this date range.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={salesTrends}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                {/* Net Revenue Gradient */}
                <linearGradient id="colorNetRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                {/* Gross Profit Gradient */}
                <linearGradient id="colorGrossProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                {/* Net Profit Gradient */}
                <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                {/* Expenses Gradient */}
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `₹${val}`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />

              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Net Revenue"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNetRevenue)"
              />

              <Area
                type="monotone"
                dataKey="grossProfit"
                name="Gross Profit"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGrossProfit)"
              />

              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />

              <Area
                type="monotone"
                dataKey="netProfit"
                name="Net Profit"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorNetProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

