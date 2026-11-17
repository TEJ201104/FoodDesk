import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '../../../components/common/Card';
import { formatCurrency } from '../../../utils/currency.js';
import { Award, UtensilsCrossed } from 'lucide-react';

const BAR_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

function CustomBarTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[160px]">
        <div className="font-bold text-slate-100 mb-1 border-b border-slate-700 pb-1 truncate">
          {data.name}
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Quantity Sold:</span>
          <span className="font-bold font-mono text-brand-400">{data.quantity} units</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Gross Revenue:</span>
          <span className="font-bold text-white">{formatCurrency(data.revenue)}</span>
        </div>
        {data.category && (
          <div className="text-[10px] text-slate-400 mt-1">
            Category: {data.category}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function TopSellingItemsBarChart({ topSellingItems = [], leastSellingItems = [] }) {
  const hasData = topSellingItems && topSellingItems.length > 0;

  return (
    <Card
      title="Top 5 Best-Selling Items"
      subtitle="Ranked by unit sales volume in selected period"
      action={
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Award className="w-3.5 h-3.5 text-brand-500" />
          <span>Product Performance</span>
        </div>
      }
    >
      {!hasData ? (
        <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-surface-50">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Item Sales Recorded</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Best-selling items will rank automatically as customers place orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSellingItems}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  width={110}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 13)}…` : val)}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                  {topSellingItems.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length] || '#f97316'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Selling Detailed Ranking List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {topSellingItems.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-surface-50 text-xs transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-500 text-[11px]">{item.quantity} sold</span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

