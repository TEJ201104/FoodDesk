import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  Search,
  Filter,
  Eye,
  Store,
  ShieldCheck,
  X,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useNotification } from '../../context/NotificationContext';

export function OwnerManagementPage() {
  const { showToast } = useNotification();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stallFilter, setStallFilter] = useState('all');
  const [multiStallOnly, setMultiStallOnly] = useState(false);

  // Selected owner for details modal
  const [selectedOwner, setSelectedOwner] = useState(null);

  const owners = useMemo(() => {
    return adminService.getOwners({
      search: searchQuery,
      stallId: stallFilter,
      multiStallOnly,
    });
  }, [searchQuery, stallFilter, multiStallOnly, refreshKey]);

  const allStalls = useMemo(() => {
    return adminService.getStalls();
  }, [refreshKey]);

  const reloadData = () => {
    setRefreshKey((k) => k + 1);
    showToast('Owners list refreshed.', 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-brand-500" />
              <span>Stall Owner Management</span>
            </h1>
            <Badge variant="navy" size="sm">Registry</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global directory of registered stall owners, contact credentials, and verified multi-stall authorization mappings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={reloadData}
            title="Refresh owners registry"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Multi-Tenant Security Audit Card */}
      <div className="p-4 bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 rounded-xl border border-slate-800 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wide text-emerald-400">Strict Tenant Mapping Enforced</div>
            <div className="text-xs text-slate-300 mt-0.5">
              Owner 1 (<span className="text-white font-mono">owner1@gmail.com</span>) authorized for <span className="font-semibold text-white">stall-1</span> & <span className="font-semibold text-white">stall-2</span>. Owner 2 (<span className="text-white font-mono">owner2@gmail.com</span>) strictly locked to <span className="font-semibold text-white">stall-3</span>.
            </div>
          </div>
        </div>
        <Badge variant="success" size="sm" className="self-start sm:self-auto">
          Isolation Active
        </Badge>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by owner name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Stall */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Stall:</span>
              <select
                value={stallFilter}
                onChange={(e) => setStallFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Stalls</option>
                {allStalls.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Multi-Stall vs Single-Stall */}
            <button
              onClick={() => setMultiStallOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${multiStallOnly
                  ? 'bg-brand-500 text-white border-brand-600 shadow-xs'
                  : 'bg-surface-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
              Multi-Stall Owners Only (2+)
            </button>
          </div>
        </div>
      </div>

      {/* Owners Table */}
      <Card
        title="Registered Stall Owners"
        subtitle={`Showing ${owners.length} registered owner account(s).`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Owner Details</th>
                <th className="py-3 px-3">Email & Contact</th>
                <th className="py-3 px-3">Authorized Stall Mappings</th>
                <th className="py-3 px-3">Ownership Count</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Registered Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {owners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No owners found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                owners.map((owner) => {
                  return (
                    <tr key={owner.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Owner Details */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-brand-500" />
                          <span>{owner.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{owner.id}</div>
                      </td>

                      {/* Email & Contact */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{owner.email}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{owner.phone || '—'}</div>
                      </td>

                      {/* Authorized Stalls Mappings */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {owner.stalls && owner.stalls.length > 0 ? (
                            owner.stalls.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-50 text-navy-800 border border-navy-200 text-[11px] font-medium"
                              >
                                <Store className="w-3 h-3 text-brand-500" />
                                <span>{s.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({s.id})</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No stalls assigned</span>
                          )}
                        </div>
                      </td>

                      {/* Ownership Count */}
                      <td className="py-3 px-3">
                        {owner.stallsCount > 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[11px]">
                            {owner.stallsCount} Stalls (Multi-Stall)
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs font-medium">
                            {owner.stallsCount} Stall (Single)
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-3">
                        <Badge variant="success" size="sm">
                          Active & Verified
                        </Badge>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : 'Seed Baseline'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOwner(owner)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: OWNER PROFILE & STALL DETAILS                                      */}
      {/* ========================================================================= */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-500" />
                  <span>Owner Profile: {selectedOwner.name}</span>
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedOwner.id} • {selectedOwner.email}</div>
              </div>
              <button
                onClick={() => setSelectedOwner(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-3 bg-surface-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Account Role</span>
                  <div className="font-semibold text-slate-800 mt-1 capitalize">{selectedOwner.role.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Account Status</span>
                  <div className="mt-1"><Badge variant="success" size="sm">Active</Badge></div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Phone Contact</span>
                  <div className="font-semibold text-slate-800 mt-1">{selectedOwner.phone || '—'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Authorized Stalls</span>
                  <div className="font-bold text-brand-600 mt-1">{selectedOwner.stallsCount} Workspace(s)</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-brand-500" />
                  <span>Authorized Stall Workspaces</span>
                </h4>
                <div className="space-y-2">
                  {selectedOwner.stalls && selectedOwner.stalls.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Category: {s.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {s.id}</div>
                      </div>
                      <Badge variant="success" size="xs">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tenant Isolation Guarantee:</strong> This owner is permitted to switch and operate exclusively across the stall profiles listed above. Cross-stall access to other owners' businesses is actively blocked by the platform's StallGuard.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedOwner(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
