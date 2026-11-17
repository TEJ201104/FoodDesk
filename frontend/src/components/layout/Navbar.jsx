import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, CheckCircle2, Volume2, Shield, UtensilsCrossed, ExternalLink, LogOut } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useStall } from '../../context/StallContext';
import { Link, useNavigate } from 'react-router-dom';

export function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { showToast } = useNotification();
  const { user, isSuperAdmin, isStallOwner, logout } = useAuth();
  const { currentStall, authorizedStalls, isMultiStall, switchStall } = useStall();
  const [currentTime, setCurrentTime] = useState('');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const navigate = useNavigate();

  // Live Kolkata Time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
      }).format(now);
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login', { replace: true });
  };

  const handleStallSwitch = async (stallId) => {
    try {
      const switched = await switchStall(stallId);
      setIsSwitcherOpen(false);
      showToast(`Switched active workspace to ${switched?.name || stallId}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-navy-900 border-b border-slate-800 text-white shadow-subtle flex-shrink-0">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 focus:outline-none lg:hidden"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to={isSuperAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">Food<span className="text-brand-500">Desk</span></span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  {isSuperAdmin ? 'ADMIN' : 'POS'}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 -mt-0.5 font-medium tracking-wide">
                Manage Smart. Serve Fast.
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Active Stall Preview / Switcher & Clock */}
        <div className="hidden md:flex items-center gap-3">
          {/* Stall Owner: Active Stall Badge or Switcher Dropdown */}
          {isStallOwner && currentStall && (
            <div className="relative">
              {isMultiStall ? (
                // Multi-Stall Switcher Dropdown (Owner 1)
                <div>
                  <button
                    onClick={() => setIsSwitcherOpen((prev) => !prev)}
                    className="flex items-center gap-2 bg-navy-950/80 hover:bg-navy-950 border border-slate-700/80 hover:border-brand-500/50 rounded-lg px-3 py-1.5 text-xs transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-white">{currentStall.name}</span>
                    <span className="text-[10px] text-brand-400 font-mono">({currentStall.id})</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSwitcherOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-navy-950 border border-slate-700 rounded-xl shadow-elevated py-1.5 z-50">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        Switch Active Stall
                      </div>
                      {authorizedStalls.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleStallSwitch(s.id)}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-navy-900 transition-colors ${
                            currentStall.id === s.id ? 'text-brand-400 font-bold bg-navy-900/50' : 'text-slate-300'
                          }`}
                        >
                          <div>
                            <div>{s.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{s.id} • {s.category}</div>
                          </div>
                          {currentStall.id === s.id && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single Stall Locked Indicator (Owner 2)
                <div className="flex items-center gap-2 bg-navy-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-white">{currentStall.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({currentStall.id})</span>
                </div>
              )}
            </div>
          )}

          {/* Super Admin Status Badge */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-1.5 text-xs text-brand-300">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-semibold">Super Admin Platform Mode</span>
            </div>
          )}

          {/* Live Kolkata Clock */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-navy-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span>{currentTime || 'IST (Asia/Kolkata)'}</span>
          </div>
        </div>

        {/* Right: Quick actions, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Sound Check */}
          <button
            onClick={() => showToast('Counter audio chime verified.', 'info')}
            title="Test Counter Audio Feedback"
            className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors hidden sm:flex items-center"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Customer Menu Link */}
          {isStallOwner && currentStall && (
            <a
              href={`/menu/${currentStall.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View Public Digital Menu"
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:text-brand-400 bg-navy-800/80 hover:bg-navy-800 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Menu</span>
            </a>
          )}

          {/* User profile pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'FD'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.name || 'Operator'}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                {isSuperAdmin ? 'Super Admin' : user?.email}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 bg-navy-800/60 hover:bg-navy-800 border border-slate-700/60 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
