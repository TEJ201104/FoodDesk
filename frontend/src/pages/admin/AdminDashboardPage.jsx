import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Shield,
  Store,
  Users,
  TrendingUp,
  MessageSquareWarning,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';
import { formatCurrency } from '../../utils/currency.js';
import { useNotification } from '../../context/NotificationContext';

export function AdminDashboardPage() {
  const { showToast } = useNotification();
  const [refreshKey, setRefreshKey] = useState(0);

  // Compute live platform metrics
  const metrics = useMemo(() => {
    return adminService.getPlatformMetrics();
  }, [refreshKey]);

  // Load recent stalls, tickets, and activity
  const recentStalls = useMemo(() => {
    return adminService.getStalls().slice(0, 5);
  }, [refreshKey]);

  const unresolvedTickets = useMemo(() => {
    return adminService.getTickets().filter((t) => t.status !== 'Resolved').slice(0, 5);
  }, [refreshKey]);

  const recentActivity = useMemo(() => {
    return adminService.getActivityLog(6);
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    showToast('Platform metrics refreshed.', 'info');
  };

  const getPriorityBadgeVariant = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
      case 'Resolved':
        return 'success';
      case 'pending_approval':
      case 'Submitted':
      case 'Under Review':
        return 'warning';
      case 'In Progress':
        return 'brand';
      case 'Reopened':
      case 'suspended':
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-brand-500" />
              <span>Super Admin Platform Dashboard</span>
            </h1>
            <Badge variant="navy" size="sm">Module 11</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global oversight across all stalls, owner authorizations, gross merchandising volume (GMV), and central issue desk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            title="Refresh live metrics"
          >
            Refresh
          </Button>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform Online</span>
          </div>
        </div>
      </div>

      {/* Top 4 Primary Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Platform Gross Sales / GMV */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Gross Sales</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(metrics.platformGrossSales)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>All-time realized orders</span>
              <span className="font-semibold text-emerald-600">Net: {formatCurrency(metrics.platformNetRevenue)}</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Total Stalls Network */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stall Network</span>
            <span className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalStalls} Stalls
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-600 font-bold">{metrics.activeStallsCount} Active</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">{metrics.pendingStallsCount} Pending</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600 font-medium">{metrics.suspendedStallsCount} Suspended</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Registered Stall Owners */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Owners</span>
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.totalOwnersCount} Owners
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>1 Multi-stall, 1 Single-stall</span>
              <span className="font-semibold text-slate-700">{metrics.totalOrdersCount} Total Orders</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Support & Issue Desk */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Support Tickets</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <MessageSquareWarning className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{metrics.totalTicketsCount} Total</span>
              {metrics.unresolvedTicketsCount > 0 ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {metrics.unresolvedTicketsCount} Open
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  All Resolved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>{metrics.inProgressTicketsCount} in progress</span>
              <span className="text-slate-300">•</span>
              <span>{metrics.underReviewTicketsCount} reviewing</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-semibold">{metrics.resolvedTicketsCount} closed</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Governance Navigation Banner */}
      <div className="p-4 bg-navy-900 text-white rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-400">Governance Workstations</div>
          <p className="text-sm text-slate-300 mt-0.5">Quick access to stall approvals, owner directories, and support resolutions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/stalls">
            <Button variant="secondary" size="sm" icon={Store} className="bg-navy-800 hover:bg-navy-700 text-white border-slate-700">
              Stall Approvals ({metrics.totalStalls})
            </Button>
          </Link>
          <Link to="/admin/owners">
            <Button variant="secondary" size="sm" icon={Users} className="bg-navy-800 hover:bg-navy-700 text-white border-slate-700">
              Owner Registry ({metrics.totalOwnersCount})
            </Button>
          </Link>
          <Link to="/admin/tickets">
            <Button variant="primary" size="sm" icon={MessageSquareWarning}>
              Support Desk ({metrics.unresolvedTicketsCount} Open)
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button variant="secondary" size="sm" icon={SlidersHorizontal} className="bg-navy-800 hover:bg-navy-700 text-white border-slate-700">
              Platform Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Stall Approvals Status & Recent Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Stall Network Status & Review Pipeline */}
        <Card
          title="Stall Directory & Pipeline Status"
          subtitle="All platform stalls and their current tenant isolation state."
          action={
            <Link to="/admin/stalls" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>View All Stalls</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {recentStalls.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No stalls found in registry.</div>
            ) : (
              recentStalls.map((stall) => (
                <div
                  key={stall.id}
                  className="p-3 bg-surface-50 hover:bg-white rounded-lg border border-slate-200/80 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {stall.id.replace('stall-', 'S')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-xs truncate">{stall.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Owner: {stall.ownerName} • <span className="font-mono">{stall.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getStatusBadgeVariant(stall.status)} size="sm">
                      {stall.status === 'active' ? 'Active' : stall.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Support Ticket Queue */}
        <Card
          title="Unresolved Support Requests"
          subtitle="Recent issues submitted by stall owners requiring admin attention."
          action={
            <Link to="/admin/tickets" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>Support Inbox</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {unresolvedTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span>Zero unresolved tickets. All support requests are currently resolved!</span>
              </div>
            ) : (
              unresolvedTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="p-3 bg-surface-50 hover:bg-white rounded-lg border border-slate-200/80 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1.5">
                      <span className="font-mono text-brand-600 text-[10px]">{tkt.id}</span>
                      <span className="truncate">{tkt.title}</span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(tkt.status)} size="sm">
                      {tkt.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {tkt.stallName} • <span className="text-slate-400">{tkt.category}</span>
                    </span>
                    <Badge variant={getPriorityBadgeVariant(tkt.priority)} size="xs">
                      {tkt.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Section: Platform Activity & System Events */}
      <Card
        title="Platform Audit & System Activity Feed"
        subtitle="Chronological log of platform events, approval actions, and support resolutions recorded in mock storage."
      >
        <div className="divide-y divide-slate-100 text-xs">
          {recentActivity.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No activity recorded yet.</div>
          ) : (
            recentActivity.map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{act.description}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Performed by: <span className="font-semibold text-slate-600">{act.performedBy}</span> ({act.role})
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
