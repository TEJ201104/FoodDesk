import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Store,
  Flame,
  Bell,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { useStall } from '../../context/StallContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { stallDataService } from '../../services/stallDataService';
import { sound } from '../../utils/sound';
import { KDSColumn } from './components/KDSColumn';
import { Link } from 'react-router-dom';

/**
 * KitchenDisplayPage (KDS)
 * 4-Column Real-Time Kanban Display System for food preparation staff.
 * Features live order cards, prominent pickup tokens, real-time elapsed timer,
 * visual delay badges, one-click stage progression, and cross-tab synchronization.
 */
export function KitchenDisplayPage() {
  const { currentStall, stallChangeKey } = useStall();
  const { user, isSuperAdmin } = useAuth();
  const { showToast } = useNotification();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1-second live clock interval for dynamic elapsed time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch KDS orders scoped strictly to active stall
  const kdsStages = useMemo(() => {
    if (!currentStall?.id) {
      return { received: [], preparing: [], ready: [], completed: [] };
    }
    try {
      return stallDataService.getKDSOrders(currentStall.id);
    } catch (err) {
      console.warn('KDS orders fetch failed:', err.message);
      return { received: [], preparing: [], ready: [], completed: [] };
    }
  }, [currentStall?.id, stallChangeKey, refreshKey]);

  // Real-time synchronization across POS, status updates, and browser tabs
  useEffect(() => {
    const handleOrderCreated = (event) => {
      setRefreshKey((k) => k + 1);
      if (audioEnabled) {
        sound.playKitchenBell();
      }
      const newOrder = event?.detail;
      if (newOrder) {
        showToast(
          `🔔 New Order Received: Token #${newOrder.pickupToken || '—'} (${newOrder.orderNumber || ''})`,
          'info'
        );
      }
    };

    const handleStatusUpdated = () => {
      setRefreshKey((k) => k + 1);
    };

    const handlePaymentCompleted = () => {
      setRefreshKey((k) => k + 1);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'fooddesk_orders' || e.key === 'fooddesk_payments') {
        setRefreshKey((k) => k + 1);
      }
    };

    window.addEventListener('fooddesk:order-created', handleOrderCreated);
    window.addEventListener('fooddesk:order-status-updated', handleStatusUpdated);
    window.addEventListener('fooddesk:payment-completed', handlePaymentCompleted);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('fooddesk:order-created', handleOrderCreated);
      window.removeEventListener('fooddesk:order-status-updated', handleStatusUpdated);
      window.removeEventListener('fooddesk:payment-completed', handlePaymentCompleted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [audioEnabled, showToast]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen error:', err);
        });
      }
    }
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('KDS order queue refreshed.', 'info');
    }, 300);
  };

  // Stage transition handler with audio feedback and toast notification
  const handleTransition = useCallback(
    (orderId, nextStatus) => {
      if (!currentStall?.id) return;
      try {
        const updated = stallDataService.updateOrderStatus(currentStall.id, orderId, nextStatus);
        setRefreshKey((k) => k + 1);

        if (audioEnabled) {
          if (nextStatus === 'ready') {
            sound.playKitchenBell();
          } else if (nextStatus === 'completed') {
            sound.playSuccess();
          } else {
            sound.playItemAdd();
          }
        }

        const stageNames = {
          preparing: 'Preparing (In Kitchen)',
          ready: 'Ready for Pickup',
          completed: 'Completed & Served',
          received: 'Received (Reverted)',
        };

        showToast(
          `Order ${updated.orderNumber} (Token #${updated.pickupToken}) moved to ${stageNames[nextStatus] || nextStatus}.`,
          'success'
        );
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
    [currentStall?.id, audioEnabled, showToast]
  );

  // Apply search filtering across all 4 stages
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return kdsStages;
    const q = searchQuery.toLowerCase().trim();

    const matchesQuery = (order) => {
      const orderNumMatch = order.orderNumber && order.orderNumber.toLowerCase().includes(q);
      const tokenMatch = order.pickupToken && String(order.pickupToken).includes(q.replace('#', ''));
      const mobileMatch = order.customerMobile && order.customerMobile.includes(q);
      const itemMatch = (order.items || []).some(
        (it) => it.name && it.name.toLowerCase().includes(q)
      );
      return orderNumMatch || tokenMatch || mobileMatch || itemMatch;
    };

    return {
      received: (kdsStages.received || []).filter(matchesQuery),
      preparing: (kdsStages.preparing || []).filter(matchesQuery),
      ready: (kdsStages.ready || []).filter(matchesQuery),
      completed: (kdsStages.completed || []).filter(matchesQuery),
    };
  }, [kdsStages, searchQuery]);

  const activeCount =
    (kdsStages.received?.length || 0) +
    (kdsStages.preparing?.length || 0) +
    (kdsStages.ready?.length || 0);

  const totalCount = activeCount + (kdsStages.completed?.length || 0);

  // Super Admin view protection notice
  if (isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-navy-950 border border-slate-800 text-white shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Kitchen Display Station (KDS)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          The KDS is a station-level tool designed for stall kitchen staff to monitor and manage food preparation.
          As a Super Admin, your role is global platform administration and stall compliance.
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
    <div className="space-y-4 text-white">
      {/* Top KDS Control Bar */}
      <div className="bg-navy-950 rounded-2xl border border-slate-800 p-4 shadow-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Stall Info & Active Queue Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Kitchen Display System
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-200">{currentStall?.name || 'Active Stall'}</span>
              <span>•</span>
              <span className="text-slate-400">{currentStall?.category || 'Counter'}</span>
              <span>•</span>
              <span className="text-brand-400 font-mono font-bold">{activeCount} In Queue</span>
            </div>
          </div>
        </div>

        {/* Right: Search, Sound, Fullscreen & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token #, order, item..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-navy-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const nextState = !audioEnabled;
              setAudioEnabled(nextState);
              if (nextState) {
                sound.playItemAdd();
                showToast('Kitchen audio alerts enabled.', 'info');
              } else {
                showToast('Kitchen audio alerts muted.', 'info');
              }
            }}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              audioEnabled
                ? 'bg-navy-900 border-slate-700 text-brand-400 hover:bg-navy-800'
                : 'bg-navy-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={audioEnabled ? 'Mute Audio Alerts' : 'Enable Audio Alerts'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{audioEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Kitchen TV / Tablet)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Order Board"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          {/* POS Quick Link */}
          <Link
            to="/pos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">POS Counter</span>
          </Link>
        </div>
      </div>

      {/* Global Empty State (If stall has no orders at all today) */}
      {totalCount === 0 && (
        <div className="bg-navy-950/70 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <Sparkles className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Kitchen Ready & Station Clear</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            No orders are currently waiting in the kitchen. When walk-in customer orders are entered at the POS workstation, they will automatically appear here with audio alerts.
          </p>
          <div className="pt-2">
            <Link
              to="/pos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Enter Order in POS</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4-Column Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Column 1: Received (New) */}
        <KDSColumn
          stageKey="received"
          title="Received"
          subtitle="New counter tickets"
          orders={filteredStages.received}
          onTransition={handleTransition}
          now={now}
        />

        {/* Column 2: Preparing (In Kitchen) */}
        <KDSColumn
          stageKey="preparing"
          title="Preparing"
          subtitle="Cooking & assembling"
          orders={filteredStages.preparing}
          onTransition={handleTransition}
          now={now}
        />

        {/* Column 3: Ready for Pickup */}
        <KDSColumn
          stageKey="ready"
          title="Ready for Pickup"
          subtitle="Call customer token"
          orders={filteredStages.ready}
          onTransition={handleTransition}
          now={now}
        />

        {/* Column 4: Completed (Served) */}
        <KDSColumn
          stageKey="completed"
          title="Completed"
          subtitle="Handed over & served"
          orders={filteredStages.completed}
          onTransition={handleTransition}
          now={now}
        />
      </div>
    </div>
  );
}
