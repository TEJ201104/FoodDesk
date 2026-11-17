import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Store,
  Send,
  X,
  User,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStall } from '../../context/StallContext';
import { useNotification } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService.js';

export function SupportPage() {
  const { user } = useAuth();
  const { currentStall, stallChangeKey } = useStall();
  const { showToast } = useNotification();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState(null);
  const [reopenComment, setReopenComment] = useState('');
  const [isReopenBoxOpen, setIsReopenBoxOpen] = useState(false);

  // New Ticket Form State
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    category: 'Website Bug',
    priority: 'Medium',
    description: '',
  });

  // Query tickets strictly for current stall and authenticated owner
  const tickets = useMemo(() => {
    if (!currentStall?.id) return [];
    return adminService.getTickets({
      stallId: currentStall.id,
      ownerId: user?.id,
      category: categoryFilter,
      priority: priorityFilter,
      status: statusFilter,
      search: searchQuery,
    });
  }, [currentStall?.id, user?.id, categoryFilter, priorityFilter, statusFilter, searchQuery, refreshKey, stallChangeKey]);

  const reloadData = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicketForm.title.trim()) {
      showToast('Issue title is required.', 'error');
      return;
    }
    if (!newTicketForm.description.trim()) {
      showToast('Detailed description is required.', 'error');
      return;
    }

    try {
      const created = adminService.createTicket(
        {
          stallId: currentStall.id,
          title: newTicketForm.title,
          category: newTicketForm.category,
          priority: newTicketForm.priority,
          description: newTicketForm.description,
        },
        { user, activeStall: currentStall }
      );

      showToast(`Support ticket #${created.id} submitted to Super Admin.`, 'success');
      setIsNewTicketModalOpen(false);
      setNewTicketForm({
        title: '',
        category: 'Website Bug',
        priority: 'Medium',
        description: '',
      });
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmReopen = () => {
    if (!reopenComment.trim()) {
      showToast('A follow-up comment explaining why the issue is being reopened is required.', 'error');
      return;
    }

    try {
      const updated = adminService.reopenTicket(
        selectedTicketForDetails.id,
        reopenComment,
        user
      );
      showToast(`Ticket #${updated.id} reopened with status 'Reopened'.`, 'info');
      setSelectedTicketForDetails(updated);
      setReopenComment('');
      setIsReopenBoxOpen(false);
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'Submitted':
        return <Badge variant="secondary" size="sm">Submitted</Badge>;
      case 'Under Review':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'In Progress':
        return <Badge variant="brand" size="sm">In Progress</Badge>;
      case 'Reopened':
        return <Badge variant="danger" size="sm">Reopened</Badge>;
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
              <LifeBuoy className="w-6 h-6 text-brand-500" />
              <span>Support & Help Desk</span>
            </h1>
            <Badge variant="navy" size="sm">Module 11 Verified</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Submit issues to Super Admin, track 5-stage lifecycle progress, view resolution notes, and reopen tickets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active Stall Scope Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
            <Store className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-semibold">{currentStall?.name || 'Active Workspace'}</span>
            <span className="text-slate-400 font-mono">({currentStall?.id})</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsNewTicketModalOpen(true)}
          >
            Report New Issue
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={reloadData}
            title="Refresh tickets list"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tickets by ID, title, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Categories</option>
                <option value="Website Bug">Website Bug</option>
                <option value="POS Error">POS Error</option>
                <option value="Billing / Payment Discrepancy">Billing / Payment Discrepancy</option>
                <option value="Hardware / Printer">Hardware / Printer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 bg-surface-50 rounded-lg border border-slate-200/60 text-xs">
              {['all', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    statusFilter === s
                      ? 'bg-brand-500 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <Card
        title={`Support Tickets for ${currentStall?.name || 'Active Stall'}`}
        subtitle={`Showing ${tickets.length} ticket(s) submitted under ${currentStall?.id}.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Ticket ID & Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No support tickets found for this stall with selected filters.
                  </td>
                </tr>
              ) : (
                tickets.map((tkt) => {
                  return (
                    <tr key={tkt.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ticket ID & Title */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="font-mono text-brand-600">{tkt.id}</span>
                          <span>—</span>
                          <span className="truncate max-w-xs">{tkt.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                          {tkt.description}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {tkt.category}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <Badge variant={getPriorityBadgeVariant(tkt.priority)} size="xs">
                          {tkt.priority}
                        </Badge>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {tkt.submittedAt ? new Date(tkt.submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : 'Seed Baseline'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(tkt.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketForDetails(tkt);
                            setIsReopenBoxOpen(false);
                            setReopenComment('');
                          }}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>View Thread</span>
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
      {/* MODAL 1: REPORT NEW ISSUE FORM                                            */}
      {/* ========================================================================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-brand-500" />
                  <span>Report an Issue to Super Admin</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filing under workspace: <span className="font-semibold text-slate-700">{currentStall?.name}</span> ({currentStall?.id})
                </p>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thermal printer text margin wrapping on 58mm paper"
                  value={newTicketForm.title}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Website Bug">Website Bug</option>
                    <option value="POS Error">POS Error</option>
                    <option value="Billing / Payment Discrepancy">Billing / Payment Discrepancy</option>
                    <option value="Hardware / Printer">Hardware / Printer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority *</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe the defect, steps to reproduce, or operational impact..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Read-Only Context Safeguard */}
              <div className="p-3 bg-surface-50 rounded-xl border border-slate-200/60 text-slate-600 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Reporting Owner:</span>
                  <span className="font-semibold text-slate-800">{user?.name} ({user?.email})</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Stall:</span>
                  <span className="font-semibold text-slate-800">{currentStall?.name} ({currentStall?.id})</span>
                </div>
                <div className="flex justify-between">
                  <span>Initial Status:</span>
                  <span className="font-bold text-brand-600">Submitted</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsNewTicketModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={Send}>
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TICKET CONVERSATION & DETAILS DRAWER                             */}
      {/* ========================================================================= */}
      {selectedTicketForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-600">{selectedTicketForDetails.id}</span>
                  <Badge variant={getPriorityBadgeVariant(selectedTicketForDetails.priority)} size="xs">
                    {selectedTicketForDetails.priority}
                  </Badge>
                  {getStatusBadge(selectedTicketForDetails.status)}
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {selectedTicketForDetails.title}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Category: {selectedTicketForDetails.category} • Submitted: {new Date(selectedTicketForDetails.submittedAt).toLocaleString('en-IN')}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Thread Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Conversation Thread & Resolution History</span>
              </div>

              {/* Messages list */}
              {selectedTicketForDetails.messages && selectedTicketForDetails.messages.map((msg) => {
                const isAdmin = msg.authorRole === 'super_admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                      {isAdmin ? (
                        <>
                          <span className="font-bold text-brand-600">Platform Administrator</span>
                          <Shield className="w-3 h-3 text-brand-500" />
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-slate-700">{msg.authorName} (Owner)</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md p-3 rounded-2xl leading-relaxed ${
                        msg.isResolutionNote
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-medium'
                          : isAdmin
                          ? 'bg-navy-900 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* Resolution Note Banner if Resolved */}
              {selectedTicketForDetails.status === 'Resolved' && selectedTicketForDetails.resolutionNote && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Official Resolution Confirmation:</span>
                  </div>
                  <p className="text-xs leading-relaxed">{selectedTicketForDetails.resolutionNote}</p>
                  {selectedTicketForDetails.resolvedAt && (
                    <div className="text-[10px] text-emerald-600 font-mono mt-1">
                      Resolved on: {new Date(selectedTicketForDetails.resolvedAt).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              )}

              {/* Status Transition History Log */}
              {selectedTicketForDetails.history && selectedTicketForDetails.history.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Status Transition Log</span>
                  </div>
                  <div className="space-y-1">
                    {selectedTicketForDetails.history.map((h, i) => (
                      <div key={i} className="text-[11px] text-slate-500 flex items-center justify-between bg-surface-50 p-1.5 rounded border border-slate-200/50">
                        <span className="font-semibold text-slate-700">
                          {h.status}: <span className="font-normal text-slate-500">{h.note}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Reopen Control */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              {selectedTicketForDetails.status === 'Resolved' ? (
                <div className="space-y-3">
                  {!isReopenBoxOpen ? (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Is this issue not resolved to your satisfaction?
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => setIsReopenBoxOpen(true)}
                      >
                        Reopen Issue
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-2.5">
                      <div className="font-bold text-xs text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Reopen Ticket: Mandatory Follow-Up Comment</span>
                      </div>
                      <textarea
                        rows="2"
                        placeholder="Explain why the issue persists or what further investigation is needed..."
                        value={reopenComment}
                        onChange={(e) => setReopenComment(e.target.value)}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        required
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            setIsReopenBoxOpen(false);
                            setReopenComment('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          disabled={!reopenComment.trim()}
                          onClick={handleConfirmReopen}
                        >
                          Submit & Reopen Ticket
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    <span>Ticket is currently <strong>{selectedTicketForDetails.status}</strong> by Super Admin.</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedTicketForDetails(null)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
