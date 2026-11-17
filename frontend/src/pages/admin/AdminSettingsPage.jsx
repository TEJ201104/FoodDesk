import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService.js';
import {
  SlidersHorizontal,
  RefreshCcw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

export function AdminSettingsPage() {
  const { showToast } = useNotification();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  const REQUIRED_PHRASE = 'RESET DEMO DATA';

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
    setTypedConfirmation('');
    setResetSuccessNotice(false);
  };

  const handleExecuteReset = async () => {
    if (typedConfirmation.trim() !== REQUIRED_PHRASE) {
      showToast(`You must type "${REQUIRED_PHRASE}" exactly to confirm.`, 'error');
      return;
    }

    setIsResetting(true);
    try {
      // Small simulated latency for UX feedback
      await new Promise((res) => setTimeout(res, 600));

      adminService.resetPlatformDemoData();

      setIsResetting(false);
      setIsResetModalOpen(false);
      setResetSuccessNotice(true);
      showToast('All factory demo datasets restored successfully. Super Admin session preserved.', 'success');
    } catch (err) {
      setIsResetting(false);
      showToast(`Demo reset failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <SlidersHorizontal className="w-6 h-6 text-brand-500" />
              <span>Platform Settings & Governance</span>
            </h1>
            <Badge variant="navy" size="sm">Super Admin</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global configuration, application diagnostic parameters, and high-risk demo environment data reset.
          </p>
        </div>
      </div>

      {resetSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Factory Demo Data Restored Successfully</div>
              <p className="text-xs text-emerald-700 mt-0.5">
                All 3 stalls, 30 menu items, initial orders, payments, expenses, inventory baselines, and support tickets have been reset to their pristine factory seed state. Your Super Admin session remains active.
              </p>
            </div>
          </div>
          <button
            onClick={() => setResetSuccessNotice(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two Column Grid: Diagnostics & Reset Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: System Diagnostics */}
        <Card title="System Diagnostics & Architecture" subtitle="Verified prototype parameters">
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Platform Environment:</span>
              <span className="text-brand-600 font-bold">Frontend Prototype (Modules 1–11)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Persistence Engine:</span>
              <span className="font-mono text-slate-500">localStorage (fooddesk_*)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Concurrency Coordinator:</span>
              <span className="font-mono text-emerald-600 font-semibold">Web Locks API (with fallback)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Timezone Anchor:</span>
              <span className="font-mono text-slate-500">Asia/Kolkata (IST)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Baseline Stalls:</span>
              <span className="font-bold text-slate-900">3 Stalls (Fast Food, Beverages, Desserts)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-semibold text-slate-700">Demo User Accounts:</span>
              <span className="font-semibold text-slate-800">1 Super Admin, 2 Stall Owners</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Demo Factory Reset (Guarded) */}
        <Card
          title="Demo Factory Reset"
          subtitle="Restores all collections back to factory seed baseline."
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">High-Risk Destructive Operation</strong>
                <span>
                  This operation resets demo records created during testing and restores factory datasets. Third-party browser data outside <code className="font-mono text-[10px]">fooddesk_*</code> is never touched.
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Exact Data Reset Scope:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
                <li>Stalls & Tenant Profiles (Restores 3 factory stalls)</li>
                <li>Demo Users & Authorization Mappings (Admin, Owner 1, Owner 2)</li>
                <li>Menu Categories & 30 Baseline Food Items</li>
                <li>Customer Orders & Daily Sequential Numbering</li>
                <li>Simulated UPI Gateway & Cash Receipts</li>
                <li>Direct Expenses & Audit Verification Records</li>
                <li>Inventory Baselines & Stock Movement Logs</li>
                <li>Support Tickets & Conversation Threads</li>
                <li>Platform Governance Activity Log</li>
              </ul>
            </div>

            <Button
              variant="danger"
              size="md"
              icon={RefreshCcw}
              onClick={handleOpenResetModal}
              className="w-full font-bold shadow-xs"
            >
              Reset Demo Data to Factory State...
            </Button>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GUARDED RESET DEMO DATA CONFIRMATION WITH TYPED PHRASE             */}
      {/* ========================================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Factory Demo Reset</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You are about to restore all FoodDesk application data to pristine seed defaults. Any customer orders, expenses, or support tickets filed during this session will be removed.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Super Admin Session Safe:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Your current Super Admin login session is automatically preserved so you do not need to log in again.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Type <span className="font-mono text-rose-600 font-extrabold">{REQUIRED_PHRASE}</span> to confirm:
              </label>
              <input
                type="text"
                placeholder={REQUIRED_PHRASE}
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setTypedConfirmation('');
                }}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={RefreshCcw}
                loading={isResetting}
                disabled={typedConfirmation.trim() !== REQUIRED_PHRASE || isResetting}
                onClick={handleExecuteReset}
              >
                {isResetting ? 'Resetting Data...' : 'Confirm Factory Reset'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
