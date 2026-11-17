import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function StallManagementPage() {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Modals state
  const [selectedStallForView, setSelectedStallForView] = useState(null);
  const [stallToReject, setStallToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stallToSuspend, setStallToSuspend] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [stallToReactivate, setStallToReactivate] = useState(null);
  const [isNewStallModalOpen, setIsNewStallModalOpen] = useState(false);

  // New stall form state
  const [newStallForm, setNewStallForm] = useState({
    name: '',
    category: 'Fast Food & Snacks',
    ownerId: 'owner_1',
    description: '',
    contactNumber: '+91 98765 33333',
    street: 'Kiosk #14, Food Street',
    landmark: 'North Gate Plaza',
    city: 'Indore',
    pincode: '452001',
  });

  // Query stalls
  const stalls = useMemo(() => {
    return adminService.getStalls({
      search: searchQuery,
      ownerId: ownerFilter,
      status: statusFilter,
    });
  }, [searchQuery, ownerFilter, statusFilter, refreshKey]);

  const owners = useMemo(() => {
    return adminService.getOwners();
  }, [refreshKey]);

  const reloadData = () => {
    setRefreshKey((k) => k + 1);
  };

  // Handle Approve
  const handleApprove = (stall) => {
    try {
      adminService.approveStall(stall.id, user?.name || 'Platform Administrator');
      showToast(`Stall "${stall.name}" (${stall.id}) approved successfully.`, 'success');
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Reject
  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast('A non-empty rejection reason is required.', 'error');
      return;
    }
    try {
      adminService.rejectStall(stallToReject.id, rejectionReason, user?.name || 'Platform Administrator');
      showToast(`Stall application "${stallToReject.name}" rejected.`, 'info');
      setStallToReject(null);
      setRejectionReason('');
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Suspend
  const handleConfirmSuspend = () => {
    if (!suspensionReason.trim()) {
      showToast('A non-empty suspension reason is required.', 'error');
      return;
    }
    try {
      adminService.suspendStall(stallToSuspend.id, suspensionReason, user?.name || 'Platform Administrator');
      showToast(`Stall "${stallToSuspend.name}" suspended.`, 'warning');
      setStallToSuspend(null);
      setSuspensionReason('');
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Reactivate
  const handleConfirmReactivate = () => {
    try {
      adminService.reactivateStall(stallToReactivate.id, user?.name || 'Platform Administrator');
      showToast(`Stall "${stallToReactivate.name}" reactivated to active status.`, 'success');
      setStallToReactivate(null);
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Create New Stall Application
  const handleCreateStallApplication = (e) => {
    e.preventDefault();
    if (!newStallForm.name.trim()) {
      showToast('Stall name is required.', 'error');
      return;
    }
    try {
      const created = adminService.createStallApplication(
        {
          name: newStallForm.name,
          category: newStallForm.category,
          ownerId: newStallForm.ownerId,
          description: newStallForm.description,
          contactNumber: newStallForm.contactNumber,
          address: {
            street: newStallForm.street,
            landmark: newStallForm.landmark,
            city: newStallForm.city,
            pincode: newStallForm.pincode,
          },
        },
        user?.name || 'Platform Administrator'
      );
      showToast(`New stall application "${created.name}" created under Pending Approval.`, 'success');
      setIsNewStallModalOpen(false);
      setNewStallForm({
        name: '',
        category: 'Fast Food & Snacks',
        ownerId: 'owner_1',
        description: '',
        contactNumber: '+91 98765 33333',
        street: 'Kiosk #14, Food Street',
        landmark: 'North Gate Plaza',
        city: 'Indore',
        pincode: '452001',
      });
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active / Approved</Badge>;
      case 'pending_approval':
        return <Badge variant="warning" size="sm">Pending Approval</Badge>;
      case 'suspended':
        return <Badge variant="danger" size="sm">Suspended</Badge>;
      case 'rejected':
        return <Badge variant="secondary" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Store className="w-6 h-6 text-brand-500" />
              <span>Stall Management & Approval Pipeline</span>
            </h1>
            <Badge variant="navy" size="sm">Governance</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review stall registrations, approve or reject applications, view profiles, and manage tenant operational status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsNewStallModalOpen(true)}
          >
            New Stall Application
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={reloadData}
            title="Refresh stalls list"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by stall name, ID, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Owner Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Owner:</span>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Owners</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 bg-surface-50 rounded-lg border border-slate-200/60 text-xs">
              {['all', 'active', 'pending_approval', 'suspended', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-all ${
                    statusFilter === s
                      ? 'bg-brand-500 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stalls Directory Table */}
      <Card
        title="Stall Profiles & Review Pipeline"
        subtitle={`Showing ${stalls.length} matching stall profile(s).`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Stall Profile</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Owner Contact</th>
                <th className="py-3 px-3">Registration Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Pipeline Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stalls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No stall profiles match the selected filters.
                  </td>
                </tr>
              ) : (
                stalls.map((stall) => {
                  const isBaselineDemo = ['stall-1', 'stall-2', 'stall-3'].includes(stall.id);

                  return (
                    <tr key={stall.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Stall Profile */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{stall.name}</span>
                          {isBaselineDemo && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200">
                              Demo Seed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{stall.id}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600">
                        {stall.category}
                      </td>

                      {/* Owner Contact */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{stall.ownerName}</div>
                        <div className="text-[11px] text-slate-400">{stall.ownerEmail}</div>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {stall.createdAt ? new Date(stall.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Seed Baseline'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(stall.status)}
                      </td>

                      {/* Pipeline Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedStallForView(stall)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1"
                            title="View full stall details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Profile</span>
                          </button>

                          {/* Action: Approve pending stall */}
                          {stall.status === 'pending_approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(stall)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1"
                                title="Approve stall"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setStallToReject(stall);
                                  setRejectionReason('');
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1"
                                title="Reject stall with reason"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Action: Suspend active stall */}
                          {stall.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                setStallToSuspend(stall);
                                setSuspensionReason('');
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-semibold shadow-xs"
                              title="Suspend stall operational access"
                            >
                              Suspend
                            </button>
                          )}

                          {/* Action: Reactivate suspended stall */}
                          {stall.status === 'suspended' && (
                            <button
                              type="button"
                              onClick={() => setStallToReactivate(stall)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1"
                              title="Reactivate suspended stall"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reactivate</span>
                            </button>
                          )}

                          {/* Action: View Rejection Reason */}
                          {stall.status === 'rejected' && stall.rejectionReason && (
                            <span className="text-[10px] text-rose-600 italic max-w-xs truncate" title={stall.rejectionReason}>
                              Reason: {stall.rejectionReason}
                            </span>
                          )}
                        </div>
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
      {/* MODAL 1: VIEW STALL PROFILE DETAILS                                       */}
      {/* ========================================================================= */}
      {selectedStallForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Store className="w-5 h-5 text-brand-500" />
                  <span>Stall Profile: {selectedStallForView.name}</span>
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedStallForView.id} • {selectedStallForView.slug}</div>
              </div>
              <button
                onClick={() => setSelectedStallForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-3 bg-surface-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedStallForView.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                  <div className="font-semibold text-slate-800 mt-1">{selectedStallForView.category}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Owner</span>
                  <div className="font-semibold text-slate-800 mt-1">{selectedStallForView.ownerName}</div>
                  <div className="text-[11px] text-slate-500">{selectedStallForView.ownerEmail}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contact Number</span>
                  <div className="font-semibold text-slate-800 mt-1">{selectedStallForView.contactNumber || '—'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">About & Description</h4>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  {selectedStallForView.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Address & Counter Location</h4>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-0.5 text-slate-700">
                  <div>{selectedStallForView.address?.street}</div>
                  <div>Landmark: {selectedStallForView.address?.landmark}</div>
                  <div>{selectedStallForView.address?.city} - {selectedStallForView.address?.pincode}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Operating Hours</h4>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-slate-700 flex justify-between">
                  <span>Hours: {selectedStallForView.operatingHours?.openingTime} – {selectedStallForView.operatingHours?.closingTime}</span>
                  <span className="text-emerald-700 font-medium">7 Days Open</span>
                </div>
              </div>

              {selectedStallForView.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Rejection Reason:</span>
                  </div>
                  <div className="mt-1">{selectedStallForView.rejectionReason}</div>
                </div>
              )}

              {selectedStallForView.suspensionReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Suspension Reason:</span>
                  </div>
                  <div className="mt-1">{selectedStallForView.suspensionReason}</div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedStallForView(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT STALL CONFIRMATION (REASON REQUIRED)                      */}
      {/* ========================================================================= */}
      {stallToReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reject Stall Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rejecting <span className="font-semibold text-slate-800">"{stallToReject.name}"</span> ({stallToReject.id}). A non-empty reason is strictly required.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete FSSAI license documentation or invalid food court stall allotment reference."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStallToReject(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                disabled={!rejectionReason.trim()}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SUSPEND STALL CONFIRMATION (REASON REQUIRED)                     */}
      {/* ========================================================================= */}
      {stallToSuspend && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Suspend Stall Access</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Suspending <span className="font-semibold text-slate-800">"{stallToSuspend.name}"</span> ({stallToSuspend.id}). The stall owner will be blocked from logging into this stall's POS.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Suspension Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Audit inquiry on pending payment reconciliations or temporary counter maintenance."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStallToSuspend(null);
                  setSuspensionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!suspensionReason.trim()}
                onClick={handleConfirmSuspend}
              >
                Confirm Suspension
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REACTIVATE STALL CONFIRMATION                                    */}
      {/* ========================================================================= */}
      {stallToReactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reactivate Stall Workspace</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to restore active status for <span className="font-semibold text-slate-800">"{stallToReactivate.name}"</span>? The stall owner will immediately regain counter access.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setStallToReactivate(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" icon={CheckCircle2} onClick={handleConfirmReactivate}>
                Confirm Reactivation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NEW STALL APPLICATION FORM (TEST PIPELINE)                       */}
      {/* ========================================================================= */}
      {isNewStallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-500" />
                  <span>Register New Stall Application</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Enters the pipeline in "Pending Approval" state.</p>
              </div>
              <button
                onClick={() => setIsNewStallModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStallApplication} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stall Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Test Taco & Nachos Kiosk"
                  value={newStallForm.name}
                  onChange={(e) => setNewStallForm({ ...newStallForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newStallForm.category}
                    onChange={(e) => setNewStallForm({ ...newStallForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Fast Food & Snacks">Fast Food & Snacks</option>
                    <option value="Shakes, Teas & Cold Beverages">Beverages & Shakes</option>
                    <option value="Bakery, Sweets & Ice Creams">Bakery & Sweets</option>
                    <option value="South Indian & Chaat">South Indian & Chaat</option>
                    <option value="Mexican & Wraps">Mexican & Wraps</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Owner *</label>
                  <select
                    value={newStallForm.ownerId}
                    onChange={(e) => setNewStallForm({ ...newStallForm, ownerId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Description of food specialties and counter profile..."
                  value={newStallForm.description}
                  onChange={(e) => setNewStallForm({ ...newStallForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street / Counter</label>
                  <input
                    type="text"
                    value={newStallForm.street}
                    onChange={(e) => setNewStallForm({ ...newStallForm, street: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={newStallForm.landmark}
                    onChange={(e) => setNewStallForm({ ...newStallForm, landmark: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This application will be created in <strong>Pending Approval</strong> state. You can immediately test the Approve and Reject pipeline without affecting existing baseline demo stalls.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsNewStallModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={Plus}>
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
