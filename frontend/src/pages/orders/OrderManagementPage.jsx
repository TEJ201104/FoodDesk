import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ReceiptText,
  Search,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  ShoppingBag,
  CreditCard,
  Banknote,
  RotateCcw,
  Printer,
  Receipt,
  Eye,
  Filter,
  Calendar,
  X,
  Ban,
  ShieldAlert,
  Flame,
  ChefHat
} from 'lucide-react';
import { useStall } from '../../context/StallContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { stallDataService } from '../../services/stallDataService.js';
import { formatCurrency } from '../../utils/currency.js';
import {
  formatDateTime,
  isTodayKolkata,
  isYesterdayKolkata,
  isWithinDaysKolkata,
  getKolkataDateOnlyString
} from '../../utils/dateUtils.js';
import { Link } from 'react-router-dom';
import { POSPaymentModal } from '../pos/components/POSPaymentModal';
import { DigitalThermalReceiptModal } from '../pos/components/DigitalThermalReceiptModal';
import { OrderDetailsDrawer } from './components/OrderDetailsDrawer';
import { OrderActionConfirmModal } from './components/OrderActionConfirmModal';

export function OrderManagementPage() {
  const { currentStall, stallChangeKey } = useStall();
  const { user, isSuperAdmin } = useAuth();
  const { showToast } = useNotification();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7days' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [kitchenStatusFilter, setKitchenStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  // Modal & Drawer States
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState('cancel'); // 'cancel' | 'refund'
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState({ order: null, payments: [] });
  const [receiptData, setReceiptData] = useState(null);

  // Listen for real-time events to auto-refresh table
  useEffect(() => {
    const handleRefresh = () => {
      setLocalRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('fooddesk:order-created', handleRefresh);
    window.addEventListener('fooddesk:order-status-updated', handleRefresh);
    window.addEventListener('fooddesk:payment-completed', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('fooddesk:order-created', handleRefresh);
      window.removeEventListener('fooddesk:order-status-updated', handleRefresh);
      window.removeEventListener('fooddesk:payment-completed', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  // Retrieve stall-isolated orders
  const orders = useMemo(() => {
    if (!currentStall?.id) return [];
    try {
      return stallDataService.getOrders(currentStall.id);
    } catch (err) {
      console.warn('Orders lookup failed:', err.message);
      return [];
    }
  }, [currentStall?.id, stallChangeKey, localRefreshKey]);

  // Combined Multi-Filter Engine
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Text Search: Order Number, Customer Mobile, Internal ID, or Item Name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = order.orderNumber && order.orderNumber.toLowerCase().includes(q);
        const mobileMatch = order.customerMobile && order.customerMobile.includes(q);
        const idMatch = order.id && order.id.toLowerCase().includes(q);
        const tokenMatch = order.pickupToken && String(order.pickupToken).includes(q.replace('#', ''));
        const itemMatch = (order.items || []).some(
          (it) => it.name && it.name.toLowerCase().includes(q)
        );
        if (!numMatch && !mobileMatch && !idMatch && !tokenMatch && !itemMatch) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (dateFilter === 'today') {
        if (!isTodayKolkata(order.createdAt)) return false;
      } else if (dateFilter === 'yesterday') {
        if (!isYesterdayKolkata(order.createdAt)) return false;
      } else if (dateFilter === 'last7days') {
        if (!isWithinDaysKolkata(order.createdAt, 7)) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (getKolkataDateOnlyString(order.createdAt) !== customDate) return false;
      }

      // 3. Kitchen / Order Status Filter (independent)
      if (kitchenStatusFilter !== 'all') {
        const currentKitchen = (order.orderStatus || 'received').toLowerCase();
        if (currentKitchen !== kitchenStatusFilter) return false;
      }

      // 4. Payment Status Filter (independent)
      if (paymentStatusFilter !== 'all') {
        const currentPay = (order.paymentStatus || 'pending').toLowerCase();
        if (paymentStatusFilter === 'paid') {
          if (currentPay !== 'paid' && currentPay !== 'successful') return false;
        } else if (paymentStatusFilter === 'pending') {
          if (currentPay !== 'pending') return false;
        } else if (paymentStatusFilter === 'failed') {
          if (currentPay !== 'failed') return false;
        } else if (paymentStatusFilter === 'partially_refunded') {
          if (currentPay !== 'partially_refunded') return false;
        } else if (paymentStatusFilter === 'refunded') {
          if (currentPay !== 'refunded') return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, dateFilter, customDate, kitchenStatusFilter, paymentStatusFilter]);

  // Statistics KPIs
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledOrRefundedCount = 0;

    orders.forEach((o) => {
      const isPaid = o.paymentStatus === 'paid' || o.paymentStatus === 'successful';
      const isRefund = o.paymentStatus === 'refunded';
      const isCancel = o.orderStatus === 'cancelled';
      const amount = Number(o.financials?.grandTotal ?? o.totalAmount ?? 0);

      if (isPaid) {
        totalRevenue += amount;
        paidCount++;
      } else {
        pendingCount++;
      }

      if (o.orderStatus === 'completed') {
        completedCount++;
      }
      if (isCancel || isRefund) {
        cancelledOrRefundedCount++;
      }
    });

    return {
      totalRevenue,
      paidCount,
      pendingCount,
      completedCount,
      cancelledOrRefundedCount,
    };
  }, [orders]);

  // Handlers for Drawer & Actions
  const handleOpenDrawer = useCallback(
    (order) => {
      setSelectedOrder(order);
      if (currentStall?.id && order?.id) {
        try {
          const details = stallDataService.getOrderDetails(currentStall.id, order.id);
          setSelectedOrderDetails(details);
        } catch (e) {
          setSelectedOrderDetails({ order, payments: [] });
        }
      }
      setIsDrawerOpen(true);
    },
    [currentStall?.id]
  );

  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (payment, order) => {
    showToast(`Payment confirmed for ${order.orderNumber}!`, 'success');
    setIsPaymentOpen(false);
    setLocalRefreshKey((k) => k + 1);
    try {
      const rData = stallDataService.getReceiptData(currentStall.id, order.id);
      setReceiptData(rData);
      setIsReceiptOpen(true);
    } catch (e) {
      console.warn('Failed to load receipt:', e);
    }
  };

  const handleOpenReceipt = (order) => {
    try {
      const rData = stallDataService.getReceiptData(currentStall.id, order.id);
      setReceiptData(rData);
      setIsReceiptOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to generate receipt.', 'error');
    }
  };

  const handleRequestCancel = (order) => {
    setSelectedOrder(order);
    setConfirmActionType('cancel');
    setIsConfirmOpen(true);
  };

  const handleRequestRefund = (order) => {
    setSelectedOrder(order);
    setConfirmActionType('refund');
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async (payload) => {
    if (!currentStall?.id || !selectedOrder?.id) return;
    setIsActionProcessing(true);
    try {
      if (confirmActionType === 'refund') {
        stallDataService.processRefund(currentStall.id, selectedOrder.id, {
          reason: payload.reason,
          notes: payload.notes,
          amount: payload.amount,
        });
        showToast(`Simulated refund processed for ${selectedOrder.orderNumber}!`, 'success');
      } else {
        stallDataService.cancelOrder(currentStall.id, selectedOrder.id, payload.reason);
        showToast(`Order ${selectedOrder.orderNumber} cancelled.`, 'info');
      }

      setIsConfirmOpen(false);
      setIsDrawerOpen(false);
      setLocalRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    dateFilter !== 'all' ||
    kitchenStatusFilter !== 'all' ||
    paymentStatusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCustomDate('');
    setKitchenStatusFilter('all');
    setPaymentStatusFilter('all');
  };

  // Super Admin view protection notice
  if (isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order Management Oversight</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Order Management is an operational counter tool for authorized stall staff. As a Super Admin, your role is global platform administration and stall compliance.
        </p>
        <div className="pt-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-600 text-[11px] font-bold border border-brand-500/30 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>{currentStall?.name || 'Stall'}</span>
              <span className="text-slate-500 font-mono">({currentStall?.id})</span>
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-slate-500 text-xs hidden sm:inline">Module 7 Order Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ReceiptText className="w-6 h-6 text-brand-500" />
            <span>Order Management Hub</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, inspect, and manage walk-in counter tickets strictly scoped to {currentStall?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/pos">
            <Button variant="primary" size="sm" icon={ShoppingBag}>
              New POS Order
            </Button>
          </Link>
          <Link to="/kds">
            <Button variant="secondary" size="sm" icon={ChefHat}>
              Kitchen KDS
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setLocalRefreshKey((k) => k + 1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh Order List"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Scoped Orders</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{orders.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Hash className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Paid Revenue</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Completed / Served</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats.completedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Cancelled / Refunded</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {stats.cancelledOrRefundedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Multi-Filter & Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, mobile #, item name, or token..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Last 7 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  dateFilter === d.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Specific Dropdowns & Custom Date Picker */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Custom Date Input if selected */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none"
                />
              </div>
            )}

            {/* Kitchen Status Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Kitchen:</span>
              <select
                value={kitchenStatusFilter}
                onChange={(e) => setKitchenStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Stages</option>
                <option value="received">Received</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready for Pickup</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Payment:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="partially_refunded">Partially Refunded</option>
                <option value="refunded">Fully Refunded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Reset Filters & Results Counter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredOrders.length}</span> of {orders.length}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Orders Table */}
      <Card>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ReceiptText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {hasActiveFilters ? 'No orders match the selected filters.' : 'No orders found for this stall.'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try clearing your search query or selecting a different date range or status.'
                : 'Open the POS counter workstation to record your first walk-in order.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <Link to="/pos" className="mt-3 inline-block">
                <Button variant="primary" size="sm">Create First Order</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Order #</th>
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">Placed At</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Kitchen Stage</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {filteredOrders.map((order) => {
                  const amount = order.financials?.grandTotal ?? order.totalAmount ?? 0;
                  const items = Array.isArray(order.items) ? order.items : [];
                  const isNewest = orders[0]?.id === order.id;
                  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'successful';
                  const isPartiallyRefunded = order.paymentStatus === 'partially_refunded';
                  const isRefunded = order.paymentStatus === 'refunded';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNewest ? 'bg-brand-50/20' : ''
                      }`}
                    >
                      {/* Order Number & UUID */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {isNewest && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                              LATEST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                          {order.id}
                        </div>
                      </td>

                      {/* Pickup Token */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-navy-900 text-brand-400 font-mono font-bold text-xs">
                          <Hash className="w-3 h-3 text-brand-500" />
                          <span>{order.pickupToken ?? '—'}</span>
                        </span>
                      </td>

                      {/* Placed At */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Items Snapshot Summary */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          {items.map((it, idx) => (
                            <div key={idx} className="text-[11px] truncate text-slate-800">
                              <span className="font-bold text-brand-600">{it.quantity}x</span> {it.name || it.menuItemId}
                            </div>
                          ))}
                          {order.customerMobile && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Tel: {order.customerMobile}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isPartiallyRefunded
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : isRefunded
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : order.paymentStatus === 'failed'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {order.paymentMethod?.includes('upi') ? (
                            <CreditCard className="w-3 h-3" />
                          ) : (
                            <Banknote className="w-3 h-3" />
                          )}
                          <span>
                            {isPaid
                              ? 'PAID'
                              : isPartiallyRefunded
                              ? 'PARTIAL REFUND'
                              : isRefunded
                              ? 'REFUNDED'
                              : order.paymentStatus === 'failed'
                              ? 'FAILED'
                              : 'PENDING'}
                          </span>
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                          {formatCurrency(amount)}
                        </span>
                        {order.financials?.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold font-mono">
                            -{formatCurrency(order.financials.discountAmount)} off
                          </div>
                        )}
                      </td>

                      {/* Kitchen Stage Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            order.orderStatus === 'completed'
                              ? 'success'
                              : order.orderStatus === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {order.orderStatus || 'received'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Full Details Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Inspect Order Details & History"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>

                          {/* Print Receipt (if paid) */}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(order)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                              title="Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-brand-400" />
                            </button>
                          )}

                          {/* Collect Payment (if unpaid) */}
                          {!isPaid && !isRefunded && order.orderStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                              title="Collect / Retry Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-Over Order Details Drawer */}
      <OrderDetailsDrawer
        isOpen={isDrawerOpen}
        order={selectedOrderDetails.order || selectedOrder}
        payments={selectedOrderDetails.payments}
        balances={selectedOrderDetails.balances}
        onClose={() => setIsDrawerOpen(false)}
        onOpenReceipt={handleOpenReceipt}
        onOpenPayment={handleOpenPayment}
        onRequestCancel={handleRequestCancel}
        onRequestRefund={handleRequestRefund}
      />

      {/* Confirmation Modal for Sensitive Actions (Cancel / Refund) */}
      <OrderActionConfirmModal
        isOpen={isConfirmOpen}
        actionType={confirmActionType}
        order={selectedOrder}
        balances={selectedOrderDetails.balances}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        isProcessing={isActionProcessing}
      />

      {/* Module 5 Payment Modal */}
      {isPaymentOpen && selectedOrder && (
        <POSPaymentModal
          isOpen={isPaymentOpen}
          order={selectedOrder}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Module 5 Thermal Receipt Modal */}
      {isReceiptOpen && receiptData && (
        <DigitalThermalReceiptModal
          isOpen={isReceiptOpen}
          receiptData={receiptData}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
}
