import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useStall } from '../../context/StallContext';
import { useNotification } from '../../context/NotificationContext';
import { analyticsService } from '../../services/analyticsService.js';
import { DateRangeFilterToolbar } from './components/DateRangeFilterToolbar';
import { FinancialKpiGrid } from './components/FinancialKpiGrid';
import { SalesTrendsAreaChart } from './components/SalesTrendsAreaChart';
import { PaymentMethodPieChart } from './components/PaymentMethodPieChart';
import { TopSellingItemsBarChart } from './components/TopSellingItemsBarChart';
import { PrintableFinancialReport } from './components/PrintableFinancialReport';
import {
  TrendingUp,
  Download,
  Printer,
  Store,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export function FinancialAnalyticsPage() {
  const { user } = useAuth();
  const { currentStall, stallChangeKey } = useStall();
  const { showToast } = useNotification();

  // Active date filter state (defaults to thisMonth to present active business data)
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [refreshTick, setRefreshTick] = useState(0);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Compute analytics dynamically with memoization
  const analytics = useMemo(() => {
    if (!currentStall?.id) return null;
    try {
      return analyticsService.getStallFinancialAnalytics(
        currentStall.id,
        activePreset,
        activePreset === 'custom' ? customRange : null
      );
    } catch (err) {
      console.error('FinancialAnalyticsPage calculation error:', err);
      return null;
    }
  }, [currentStall?.id, stallChangeKey, activePreset, customRange, refreshTick]);

  const handleRefresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
    showToast('Financial analytics updated with latest order and expense records.', 'info');
  }, [showToast]);

  const handleSelectPreset = useCallback((presetId) => {
    setActivePreset(presetId);
  }, []);

  const handleCustomRangeChange = useCallback((range) => {
    setCustomRange(range);
    setActivePreset('custom');
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!analytics || !currentStall) {
      showToast('No financial data available to export.', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      analyticsService.downloadCSVReport(analytics);
      showToast(`Exported ${currentStall.name} financial report successfully.`, 'success');
    } catch (err) {
      console.error('CSV Export failed:', err);
      showToast(`CSV export failed: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [analytics, currentStall, showToast]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-brand-500" />
              <span>Financial Analytics & Profit/Loss</span>
            </h1>
            <Badge variant="success" size="sm">Module 10 Verified</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic P&L calculations: Gross Sales, Net Revenue, COGS, Gross Profit, and Net Profit.
          </p>
        </div>

        {/* Stall Badge Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
            <Store className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-semibold">{currentStall?.name || 'Stall Workspace'}</span>
            <span className="text-slate-400">({currentStall?.id})</span>
          </div>
        </div>
      </div>

      {/* Date Range Filter Toolbar */}
      <DateRangeFilterToolbar
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        customRange={customRange}
        onCustomRangeChange={handleCustomRangeChange}
        dateRangeMeta={analytics?.dateRangeMeta}
        onExportCSV={handleExportCSV}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onRefresh={handleRefresh}
        isLoading={false}
      />

      {/* 6 Financial KPI Cards Grid */}
      <div id="financial-kpi-grid-section">
        <FinancialKpiGrid analytics={analytics} isLoading={!analytics} />
      </div>

      {/* Continuous Sales & Profitability Timeline Area Chart */}
      <div id="sales-trends-chart-section">
        <SalesTrendsAreaChart
          salesTrends={analytics?.salesTrends || []}
          dateRangeLabel={analytics?.dateRangeMeta?.label}
        />
      </div>

      {/* Visualizations Grid: Payment Methods Pie & Top 5 Best-Selling Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="payment-method-pie-chart-section">
          <PaymentMethodPieChart paymentMethods={analytics?.paymentMethods || []} />
        </div>
        <div id="top-selling-items-chart-section">
          <TopSellingItemsBarChart
            topSellingItems={analytics?.topSellingItems || []}
            leastSellingItems={analytics?.leastSellingItems || []}
          />
        </div>
      </div>

      {/* Multi-Stall Data Protection Audit Card */}
      <Card
        title="Automated Financial Calculation & Tenant Isolation Engine"
        subtitle="Adheres strictly to PRD Section 11 & Frontend Implementation Plan formulas."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-surface-50 rounded-lg border border-slate-200/60 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Immutable Snapshot COGS</span>
            </div>
            <p className="text-slate-500">
              COGS strictly uses frozen item cost prices recorded at checkout time. Future menu catalog updates never tamper with historical margins.
            </p>
          </div>

          <div className="p-3 bg-surface-50 rounded-lg border border-slate-200/60 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Realized Revenue Integrity</span>
            </div>
            <p className="text-slate-500">
              Pending, failed, and unpaid cancelled orders are strictly excluded from collected revenue. Reversals and discounts are deducted cleanly.
            </p>
          </div>

          <div className="p-3 bg-surface-50 rounded-lg border border-slate-200/60 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Cross-Stall Isolation</span>
            </div>
            <p className="text-slate-500">
              Reconciliation queries verify stall tenancy. Fast Food (stall-1), Beverages (stall-2), and Desserts (stall-3) datasets remain strictly segregated.
            </p>
          </div>
        </div>
      </Card>

      {/* Printable Report Modal */}
      <PrintableFinancialReport
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        analytics={analytics}
        stall={currentStall}
        dateRangeMeta={analytics?.dateRangeMeta}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
}
