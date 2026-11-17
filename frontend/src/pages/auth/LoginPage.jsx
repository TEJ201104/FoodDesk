import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  UtensilsCrossed,
  Shield,
  Store,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginPage() {
  const { loginOwner, loginAdmin, loading } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'owner' (3-credential) | 'admin' (2-credential)
  const [activeTab, setActiveTab] = useState('owner');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stallId, setStallId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || (activeTab === 'admin' ? '/admin/dashboard' : '/dashboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      if (activeTab === 'owner') {
        const session = await loginOwner({ email, password, stallId });
        showToast(`Welcome, ${session.user.name}! Accessing ${session.activeStall.name}.`, 'success');
        navigate('/dashboard', { replace: true });
      } else {
        const session = await loginAdmin({ email, password });
        showToast(`Administrator authenticated. Welcome, ${session.user.name}.`, 'success');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed.');
      showToast(err.message || 'Authentication failed.', 'error');
    }
  };

  // 1-Click Demo Fill Helpers
  const fillDemoOwner1FastFood = () => {
    setActiveTab('owner');
    setEmail('owner1@gmail.com');
    setPassword('owner1');
    setStallId('stall-1');
    setErrorMessage('');
  };

  const fillDemoOwner1Beverages = () => {
    setActiveTab('owner');
    setEmail('owner1@gmail.com');
    setPassword('owner1');
    setStallId('stall-2');
    setErrorMessage('');
  };

  const fillDemoOwner2Desserts = () => {
    setActiveTab('owner');
    setEmail('owner2@gmail.com');
    setPassword('owner2');
    setStallId('stall-3');
    setErrorMessage('');
  };

  const fillDemoAdmin = () => {
    setActiveTab('admin');
    setEmail('admin@gmail.com');
    setPassword('admin');
    setStallId('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background glow ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30 mb-3">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Food<span className="text-brand-500">Desk</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          Manage Smart. Serve Fast.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <Card className="shadow-2xl border-slate-800 bg-navy-900 text-slate-100 p-6 sm:p-8">
          {/* Dual Login Mode Tabs */}
          <div className="flex rounded-xl bg-navy-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('owner');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'owner'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Stall Owner Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-navy-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin Portal</span>
            </button>
          </div>

          {/* Form Header Info */}
          <div className="mb-5 pb-3 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                {activeTab === 'owner' ? 'Stall Owner Verification Gate' : 'Platform Administrator Console'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'owner'
                  ? 'Requires Email, Password, and your authorized Stall ID.'
                  : 'Access global governance and platform management.'}
              </p>
            </div>
            <Badge variant={activeTab === 'owner' ? 'brand' : 'navy'}>
              {activeTab === 'owner' ? '3 Credentials' : 'Admin'}
            </Badge>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actual Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner1@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Stall ID Field (Only for Stall Owner Mode) */}
            {activeTab === 'owner' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Unique Stall ID
                  </label>
                  <span className="text-[10px] text-brand-400 font-mono">
                    stall-1 • stall-2 • stall-3
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={stallId}
                    onChange={(e) => setStallId(e.target.value)}
                    placeholder="e.g. stall-1"
                    className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 lowercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Must be an active stall profile authorized for your owner account.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-bold mt-2"
            >
              {activeTab === 'owner' ? 'Verify Credentials & Open POS' : 'Sign In as Super Admin'}
            </Button>
          </form>

          {/* 1-Click Demo Fill Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>1-Click Demonstration Credentials</span>
            </div>

            {activeTab === 'owner' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={fillDemoOwner1FastFood}
                  className="px-2.5 py-2 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-white">Owner 1: Fast Food</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">stall-1</div>
                </button>
                <button
                  type="button"
                  onClick={fillDemoOwner1Beverages}
                  className="px-2.5 py-2 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-white">Owner 1: Beverages</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">stall-2</div>
                </button>
                <button
                  type="button"
                  onClick={fillDemoOwner2Desserts}
                  className="px-2.5 py-2 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-white">Owner 2: Desserts</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">stall-3</div>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Super Admin (Global Platform)</div>
                  <div className="text-[10px] text-slate-400 font-mono">admin@gmail.com • password: admin</div>
                </div>
                <Badge variant="brand" size="sm">Auto-Fill</Badge>
              </button>
            )}
          </div>
        </Card>

        {/* Public Links Footer */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <a
              href="/menu/fast-food-stall"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-400 transition-colors underline"
            >
              Public Customer Menu
            </a>
            <span>•</span>
            <a
              href="/track/fast-food-stall/ORD-20261112-0001"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-400 transition-colors underline"
            >
              Customer Order Tracker
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            The Smarter Way to Manage Every Order.
          </p>
        </div>
      </div>
    </div>
  );
}
