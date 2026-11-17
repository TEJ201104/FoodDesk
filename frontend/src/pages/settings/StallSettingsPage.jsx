import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Settings, Store, Clock, QrCode, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useStall } from '../../context/StallContext';

export function StallSettingsPage() {
  const { currentStall } = useStall();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-500" />
            <span>Stall Profile & Workspace Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active workspace metadata scoped to <span className="font-semibold text-slate-700">{currentStall?.name || 'Current Stall'}</span> ({currentStall?.id || 'stall-1'}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>Module 3 Scoped Profile</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Identity & Location */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Stall Identity" subtitle="Primary business identity and public catalog details.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Stall Name</div>
                  <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <Store className="w-4 h-4 text-brand-500" />
                    <span>{currentStall?.name}</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Stall ID & Slug</div>
                  <div className="text-base font-mono font-bold text-brand-600 mt-1">
                    {currentStall?.id} <span className="text-xs text-slate-400 font-sans">({currentStall?.slug})</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase">Category & Specialty</div>
                <div className="text-sm font-semibold text-slate-800 mt-1">{currentStall?.category}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{currentStall?.description}</p>
              </div>

              <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Physical Counter Location</span>
                </div>
                <div className="text-xs text-slate-700 mt-1">
                  {currentStall?.address?.street}, {currentStall?.address?.landmark}, {currentStall?.address?.city} — {currentStall?.address?.pincode}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact: {currentStall?.contactNumber}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Operating Timings" subtitle="Daily counter service hours.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Service Hours</div>
                  <div className="text-sm font-bold text-slate-900">
                    {currentStall?.operatingHours?.openingTime} – {currentStall?.operatingHours?.closingTime}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Weekly Schedule</div>
                  <div className="text-xs font-semibold text-slate-800">
                    Open All 7 Days (Mon – Sun)
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Payment & Security Settings */}
        <div className="space-y-6">
          <Card title="Payment Gateway & UPI" subtitle="Payment methods configured for this stall.">
            <div className="space-y-3">
              <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-brand-500" />
                  <span>Stall UPI VPA</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                  {currentStall?.paymentSettings?.upiId}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Payee: {currentStall?.paymentSettings?.payeeName}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Accepted Methods</div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 text-xs">
                  <span className="font-medium text-slate-700">Cash Payments</span>
                  <Badge variant={currentStall?.paymentSettings?.allowCash ? 'success' : 'neutral'} size="sm">
                    {currentStall?.paymentSettings?.allowCash ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 text-xs">
                  <span className="font-medium text-slate-700">Static UPI QR (Counter)</span>
                  <Badge variant={currentStall?.paymentSettings?.allowStaticQr ? 'success' : 'neutral'} size="sm">
                    {currentStall?.paymentSettings?.allowStaticQr ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 text-xs">
                  <span className="font-medium text-slate-700">Dynamic Payment QR</span>
                  <Badge variant={currentStall?.paymentSettings?.allowDynamicGatewayQr ? 'success' : 'neutral'} size="sm">
                    {currentStall?.paymentSettings?.allowDynamicGatewayQr ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Workspace Guard" subtitle="Multi-tenant isolation status.">
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>StallGuard Runtime Active</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                This workstation is locked to <span className="font-bold text-slate-800">{currentStall?.id}</span>. Any attempts to tamper with stored tokens or session IDs trigger automated recovery.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

