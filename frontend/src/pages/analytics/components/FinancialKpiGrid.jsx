import React from 'react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { formatCurrency } from '../../../utils/currency.js';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  IndianRupee,
  Layers,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calculator,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export function FinancialKpiGrid({ analytics = null, isLoading = false }) {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
    );
  }

  const {
    grossSales = 0,
    discounts = 0,
    refunds = 0,
    netRevenue = 0,
    cogs = 0,
    grossProfit = 0,
    totalExpenses = 0,
    netProfit = 0,
    profitMargin = 0,
    grossMargin = 0,
    totalOrders = 0,
    averageOrderValue = 0,
  } = analytics;

  const isNetProfitPositive = netProfit >= 0;
  const isGrossProfitPositive = grossProfit >= 0;

  return (
    <div className="space-y-3.5">
      {/* 6 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Gross Sales */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gross Sales
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(grossSales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Before deductions</span>
              <span className="font-semibold text-slate-700">{totalOrders} orders</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>AOV:</span>
            <span className="font-semibold text-slate-700">{formatCurrency(averageOrderValue)}</span>
          </div>
        </div>

        {/* 2. Net Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Net Revenue
            </span>
            <span className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <IndianRupee className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(netRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>Actual collected receipts</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Discounts: -{formatCurrency(discounts)}</span>
            <span className="text-rose-600">Refunds: -{formatCurrency(refunds)}</span>
          </div>
        </div>

        {/* 3. Cost of Goods Sold (COGS) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              COGS (Cost of Goods)
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(cogs)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>Frozen order snapshot costs</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Catalog price changes protected</span>
            </span>
          </div>
        </div>

        {/* 4. Gross Profit */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gross Profit
            </span>
            <span
              className={`p-1.5 rounded-lg ${
                isGrossProfitPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isGrossProfitPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-xl font-extrabold tracking-tight ${
                isGrossProfitPositive ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(grossProfit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Net Revenue - COGS</span>
              <span
                className={`font-semibold ${
                  grossMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {grossMargin}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Gross Margin:</span>
            <span className="font-semibold text-slate-700">{grossMargin}% of revenue</span>
          </div>
        </div>

        {/* 5. Operating Expenses */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Operating Expenses
            </span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>Direct stall overheads</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Module 9 sync:</span>
            <span className="font-semibold text-slate-700">Audit verified</span>
          </div>
        </div>

        {/* 6. Net Profit */}
        <div
          className={`rounded-xl border shadow-sm p-4 relative overflow-hidden flex flex-col justify-between transition-colors ${
            isNetProfitPositive
              ? 'bg-gradient-to-br from-emerald-50/60 via-white to-white border-emerald-200/90'
              : 'bg-gradient-to-br from-rose-50/60 via-white to-white border-rose-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Net Profit
            </span>
            <span
              className={`p-1.5 rounded-lg ${
                isNetProfitPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isNetProfitPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-xl font-extrabold tracking-tight ${
                isNetProfitPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
              <span>Gross Profit - Expenses</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  isNetProfitPositive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {profitMargin}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Net Profit Margin:</span>
            <span className={isNetProfitPositive ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
              {profitMargin}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

