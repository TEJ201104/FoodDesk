import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '../../../components/common/Card';
import { formatCurrency } from '../../../utils/currency.js';
import { CreditCard, IndianRupee } from 'lucide-react';

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[150px]">
        <div className="flex items-center gap-1.5 font-bold mb-1 border-b border-slate-700 pb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span>{data.name}</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Amount:</span>
          <span className="font-bold text-white">{formatCurrency(data.value)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Share:</span>
          <span className="font-bold text-brand-400">{data.percentage}%</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Transactions:</span>
          <span className="text-white font-mono">{data.count}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function PaymentMethodPieChart({ paymentMethods = [] }) {
  const normalizedMethods = (paymentMethods || []).map((p) => ({
    ...p,
    value: p.value ?? p.amount ?? 0,
    amount: p.amount ?? p.value ?? 0,
  }));
  const hasData = normalizedMethods.length > 0 && normalizedMethods.some((p) => p.value > 0);
  const totalCollected = normalizedMethods.reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <Card
      title="Payment Method Distribution"
      subtitle="Breakdown of collected revenue by tender method"
      action={
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CreditCard className="w-3.5 h-3.5 text-brand-500" />
          <span>Tender Allocation</span>
        </div>
      }
    >
      {!hasData ? (
        <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-surface-50">
          <CreditCard className="w-10 h-10 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Payment Records</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Payment breakdown will render as cash and UPI orders are completed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalizedMethods}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {normalizedMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#f97316'} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Breakdown Table */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {normalizedMethods.map((method) => (
              <div
                key={method.key}
                className="p-2.5 rounded-lg bg-surface-50 border border-slate-200/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <span className="truncate">{method.name}</span>
                  </span>
                  <span className="text-[11px] font-bold text-brand-600 font-mono">
                    {method.percentage}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(method.value)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {method.count} {method.count === 1 ? 'txn' : 'txns'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

