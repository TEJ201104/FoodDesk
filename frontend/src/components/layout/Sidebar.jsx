import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ReceiptText,
  ChefHat,
  UtensilsCrossed,
  Wallet,
  TrendingUp,
  Boxes,
  LifeBuoy,
  Settings,
  Shield,
  Store,
  Users,
  MessageSquareWarning,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStall } from '../../context/StallContext';

// 1. Stall Owner Navigation (Strictly 10 Items)
const stallNavigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'POS / New Order', path: '/pos', icon: ShoppingBag, badge: 'HOT' },
  { name: 'Order History', path: '/orders', icon: ReceiptText },
  { name: 'Kitchen Display (KDS)', path: '/kds', icon: ChefHat },
  { name: 'Menu Management', path: '/menu', icon: UtensilsCrossed },
  { name: 'Expenses', path: '/expenses', icon: Wallet },
  { name: 'Financial Analytics', path: '/analytics', icon: TrendingUp },
  { name: 'Inventory', path: '/inventory', icon: Boxes },
  { name: 'Report an Issue', path: '/support', icon: LifeBuoy },
  { name: 'Stall Settings', path: '/settings', icon: Settings },
];

// 2. Super Admin Navigation (Strictly 5 Items)
const adminNavigation = [
  { name: 'Admin Dashboard', path: '/admin/dashboard', icon: Shield },
  { name: 'Stall Approvals', path: '/admin/stalls', icon: Store },
  { name: 'Owner Management', path: '/admin/owners', icon: Users },
  { name: 'Issue Management', path: '/admin/tickets', icon: MessageSquareWarning },
  { name: 'Platform Settings', path: '/admin/settings', icon: SlidersHorizontal },
];

export function Sidebar({ isOpen, onClose }) {
  const { isSuperAdmin, isStallOwner } = useAuth();
  const { currentStall, authorizedStalls, isMultiStall, switchStall } = useStall();
  const activeStall = currentStall;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-navy-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* STALL OWNER HEADER BANNER */}
          {isStallOwner && currentStall && (
            <div className="px-3 py-2.5 bg-navy-900/90 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Stall</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active & Online" />
              </div>
              <div className="font-bold text-sm text-white truncate">{currentStall?.name || 'Active Workspace'}</div>
              <div className="flex items-center justify-between text-[11px] text-brand-400 font-mono">
                <span>{currentStall?.id || ''}</span>
                <span className="text-slate-400 text-[10px]">{currentStall?.category || ''}</span>
              </div>

              {/* Quick Stall Switcher for Multi-stall Owners (Owner 1) */}
              {isMultiStall && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-medium mb-1">Switch Stall:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {authorizedStalls.map((s) => {
                      const isSelected = currentStall?.id === s?.id;
                      const label = s?.name ? s.name.replace(' Stall', '') : (s?.id || '');
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => switchStall(s.id)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-all text-center truncate ${isSelected
                              ? 'bg-brand-500 text-white font-bold'
                              : 'bg-navy-950 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUPER ADMIN HEADER BANNER */}
          {isSuperAdmin && (
            <div className="px-3 py-2.5 bg-gradient-to-r from-navy-900 to-navy-900/90 border border-brand-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">Global Admin Portal</span>
                <Shield className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="font-bold text-sm text-white">Platform Oversight</div>
              <div className="text-[11px] text-slate-400">All 3 Stalls Governed</div>
            </div>
          )}

          {/* STALL OWNER NAVIGATION (Strictly Separated) */}
          {isStallOwner && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Stall Operations</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">POS</span>
              </div>
              <nav className="space-y-1">
                {stallNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                          ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-navy-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'
                                }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isActive ? 'bg-white/20 text-white' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* SUPER ADMIN NAVIGATION (Strictly Separated) */}
          {isSuperAdmin && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Platform Governance</span>
                <Shield className="w-3 h-3 text-brand-400" />
              </div>
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                          ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-navy-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Customer Portal Shortcut (Public Walk-In Links - Stall Owner Workspace Only) */}
          {isStallOwner && activeStall && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Customer Portals (Public)
              </div>
              <nav className="space-y-1">
                <a
                  href={`/menu/${activeStall?.slug || 'fast-food-stall'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-navy-900 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400" />
                    <span>Digital Menu (Walk-in)</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                </a>
                <a
                  href={`/track/${activeStall?.slug || 'fast-food-stall'}/ORD-20261112-0001`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-navy-900 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400" />
                    <span>Order Tracker</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                </a>
              </nav>
            </div>
          )}
        </div>

        {/* Footer info & brand tagline */}
        <div className="p-3 bg-navy-950 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
          <div className="font-semibold text-slate-300">FoodDesk v1.0 (Module 2)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Manage Smart. Serve Fast.</div>
        </div>
      </aside>
    </>
  );
}
