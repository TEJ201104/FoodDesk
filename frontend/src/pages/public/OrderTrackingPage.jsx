import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Store,
  ChefHat,
  BellRing,
  RotateCcw,
  Receipt,
  ShieldAlert,
  ArrowRight,
  Radio
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { stallDataService } from '../../services/stallDataService.js';
import { formatCurrency } from '../../utils/currency.js';

export function OrderTrackingPage() {
  const { orderNumber: paramOrderNumber, stallSlug } = useParams();
  const navigate = useNavigate();

  const [inputOrderNumber, setInputOrderNumber] = useState(paramOrderNumber || '');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync input if URL param changes
  useEffect(() => {
    if (paramOrderNumber) {
      setInputOrderNumber(paramOrderNumber);
    }
  }, [paramOrderNumber]);

  // Real-time synchronization across staff POS, KDS updates, and cross-tab storage events
  useEffect(() => {
    const handleOrderSync = () => {
      setRefreshKey((k) => k + 1);
    };

    const handleStorageChange = (e) => {
      if (!e.key || e.key === 'fooddesk_orders' || e.key === 'fooddesk_payments') {
        setRefreshKey((k) => k + 1);
      }
    };

    window.addEventListener('fooddesk:order-status-updated', handleOrderSync);
    window.addEventListener('fooddesk:order-created', handleOrderSync);
    window.addEventListener('fooddesk:payment-completed', handleOrderSync);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('fooddesk:order-status-updated', handleOrderSync);
      window.removeEventListener('fooddesk:order-created', handleOrderSync);
      window.removeEventListener('fooddesk:payment-completed', handleOrderSync);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Active query order number
  const activeOrderQuery = (paramOrderNumber || inputOrderNumber || '').trim();

  // Service lookup strictly bound to URL stall parameter and order number
  const trackingData = useMemo(() => {
    if (!activeOrderQuery) {
      return { promptForNumber: true };
    }
    try {
      return stallDataService.getPublicOrderTracking(stallSlug || 'fast-food-stall', activeOrderQuery);
    } catch (err) {
      return { error: err.message };
    }
  }, [stallSlug, activeOrderQuery, refreshKey]);

  const stall = trackingData?.stall;
  const order = trackingData?.order;
  const error = trackingData?.error;
  const promptForNumber = trackingData?.promptForNumber;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputOrderNumber.trim()) {
      navigate(`/track/${stallSlug || 'fast-food-stall'}/${inputOrderNumber.trim().toUpperCase()}`);
    }
  };

  const formatOrderTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
      }).format(d);
    } catch (e) {
      return isoString || '—';
    }
  };

  // Timeline stages based on orderStatus: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  const getStageStep = (status) => {
    switch (status) {
      case 'received':
      case 'pending':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = getStageStep(order?.orderStatus);

  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stall Header Banner */}
        <div className="bg-navy-900 rounded-2xl p-6 text-white text-center shadow-card border border-slate-800 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold border border-brand-500/30">
              <Store className="w-3.5 h-3.5" />
              <span>{stall?.name || (stallSlug ? stallSlug.replace(/-/g, ' ').toUpperCase() : 'STALL TRACKER')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SYNC</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Live Order Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time preparation progress for counter walk-in orders.
          </p>

          {/* Quick Lookup Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-4 max-w-sm mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputOrderNumber}
                onChange={(e) => setInputOrderNumber(e.target.value)}
                placeholder="Enter Order # (e.g. ORD-20261112-0001)"
                className="w-full pl-3 pr-3 py-2 bg-navy-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
          </form>
        </div>

        {/* Initial Prompt State when visiting /track/:stallSlug without orderNumber */}
        {promptForNumber && (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Track Your FoodDesk Order</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Enter your Order Number (printed at the top of your receipt, e.g. <span className="font-mono font-bold text-slate-700">ORD-20261112-0001</span>) to follow your meal's live preparation status.
            </p>
            <div className="pt-2">
              <Link
                to={`/menu/${stallSlug || 'fast-food-stall'}`}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
              >
                Browse {stall?.name || 'Stall'} Digital Menu
              </Link>
            </div>
          </div>
        )}

        {/* Error / Cross-Stall Rejection Banner */}
        {error && (
          <div className="p-5 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Order Lookup Notice</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <div className="pt-2 flex items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-brand-600 hover:underline font-semibold"
              >
                Try Again
              </button>
              <span>•</span>
              <Link to={`/menu/${stallSlug || 'fast-food-stall'}`} className="text-slate-500 hover:underline">
                View Stall Menu
              </Link>
            </div>
          </div>
        )}

        {/* Successful Order Details */}
        {order && (
          <div className="space-y-5">
            {/* Pickup Token Card */}
            <Card className="text-center p-6 bg-white border-brand-500/20 shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your Counter Pickup Token
              </span>
              <div className="text-5xl font-black text-brand-500 tracking-tight my-2">
                #{order.pickupToken}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-100 rounded-full text-xs font-mono font-bold text-slate-700">
                <span>{order.orderNumber}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Placed at {formatOrderTime(order.createdAt)}</span>
              </div>
            </Card>

            {/* Preparation Progress Timeline */}
            <Card title="Preparation Progress" subtitle="Follow your food preparation stage">
              {currentStep === -1 ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 text-xs font-bold">
                  Order Cancelled
                </div>
              ) : (
                <div className="py-4 px-2">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {/* Stage 1 */}
                    <div className="space-y-2">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                          currentStep >= 1
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        1
                      </div>
                      <div className={`font-bold ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                        Confirmed
                      </div>
                      <div className="text-[10px] text-slate-400">Order Received</div>
                    </div>

                    {/* Stage 2 */}
                    <div className="space-y-2">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                          currentStep >= 2
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        2
                      </div>
                      <div className={`font-bold ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                        Preparing
                      </div>
                      <div className="text-[10px] text-slate-400">In Kitchen</div>
                    </div>

                    {/* Stage 3 */}
                    <div className="space-y-2">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                          currentStep >= 3
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        3
                      </div>
                      <div className={`font-bold ${currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                        Ready
                      </div>
                      <div className="text-[10px] text-slate-400">At Counter</div>
                    </div>

                    {/* Stage 4 */}
                    <div className="space-y-2">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                          currentStep >= 4
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        4
                      </div>
                      <div className={`font-bold ${currentStep >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>
                        Served
                      </div>
                      <div className="text-[10px] text-slate-400">Completed</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Order Items & Payment Card */}
            <Card title="Order Summary" subtitle={`Items ordered at ${stall?.name}`}>
              <div className="divide-y divide-slate-100 text-xs">
                {order.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-600 mr-2">{it.quantity}x</span>
                      <span className="font-semibold text-slate-800">{it.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(it.itemTotal || it.sellingPrice * it.quantity)}
                    </span>
                  </div>
                ))}

                <div className="pt-3 flex items-center justify-between font-extrabold text-sm text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-brand-600">{formatCurrency(order.financials?.grandTotal)}</span>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payment Status</span>
                  <Badge
                    variant={order.paymentStatus === 'paid' || order.paymentStatus === 'successful' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {order.paymentStatus === 'paid' || order.paymentStatus === 'successful'
                      ? 'PAID (Demo Simulation)'
                      : 'PENDING AT COUNTER'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <Link
            to={`/menu/${stallSlug || 'fast-food-stall'}`}
            className="text-brand-600 hover:text-brand-700 font-semibold underline flex items-center gap-1"
          >
            <span>View {stall?.name || 'Stall'} Menu</span>
          </Link>

          <Link to="/dashboard" className="text-slate-500 hover:text-slate-700">
            Staff Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
