import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  MessageSquareWarning,
  Search,
  CheckCircle2,
  Clock,
  Store,
  Send,
  X,
  User,
  Shield,
  RefreshCw,
  Eye
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function AdminSupportPage() {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stallFilter, setStallFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected ticket for inspection drawer
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Admin reply input
  const [replyText, setReplyText] = useState('');

  // Status transition state
  const [targetStatus, setTargetStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  // Query tickets across all stalls
  const tickets = useMemo(() => {
    return adminService.getTickets({
      stallId: stallFilter,
      category: categoryFilter,
      priority: priorityFilter,
      status: statusFilter,
      search: searchQuery,
    });
  }, [stallFilter, categoryFilter, priorityFilter, statusFilter, searchQuery, refreshKey]);

  const allStalls = useMemo(() => {
    return adminService.getStalls();
  }, [refreshKey]);

  const reloadData = () => {
    setRefreshKey((k) => k + 1);
  };

  // Open ticket in drawer
  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setResolutionNote('');
    setTargetStatus('');
  };

  // Dispatch Admin Reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      showToast('Reply message cannot be empty.', 'error');
      return;
    }

    try {
      const updated = adminService.addTicketReply(
        selectedTicket.id,
        replyText,
        {
          id: user?.id || 'usr-admin-001',
          name: user?.name || 'Platform Administrator',
          role: 'super_admin',
        }
      );

      showToast(`Reply sent on ticket #${updated.id}.`, 'success');
      setSelectedTicket(updated);
      setReplyText('');
      reloadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Status Lifecycle Transition
  const handleApplyStatusChange = (newStatus) => {
    if (newStatus === 'Resolved' && !resolutionNote.trim()) {
      showToast('A detailed resolution note is strictly required to resolve a support ticket.', 'error');
      return;
    }

    try {
      const updated = adminService.updateTicketStatus(
        selectedTicket.id,
        newStatus,
        { note: resolutionNote },
        {
          id: user?.id || 'usr-admin-001',
          name: user?.name || 'Platform Administrator',
          role: 'super_admin',
        }
      );

      showToast(`Ticket #${updated.id} status updated to "${newStatus}".`, 'success');
      setSelectedTicket(updated);
      setResolutionNote('');
      setTargetStatus('');
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
              <MessageSquareWarning className="w-6 h-6 text-brand-500" />
              <span>Centralized Issue & Support Management</span>
            </h1>
            <Badge variant="navy" size="sm">Platform Desk</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global support inbox across all stalls. Review tickets, dispatch replies, transition 5-stage lifecycle, and resolve issues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              reloadData();
              showToast('Support inbox refreshed.', 'info');
            }}
            title="Refresh tickets"
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
              placeholder="Search by ticket ID, title, description, or stall..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Stall Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Stall:</span>
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

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
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

            {/* Status Filter Pills */}
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

      {/* Tickets Inbox Table */}
      <Card
        title="Centralized Support Inbox"
        subtitle={`Showing ${tickets.length} ticket(s) matching platform filters.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Ticket ID & Title</th>
                <th className="py-3 px-3">Reporting Stall & Owner</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No tickets match the selected criteria.
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

                      {/* Stall & Owner */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{tkt.stallName}</div>
                        <div className="text-[11px] text-slate-400">{tkt.ownerName} ({tkt.ownerEmail})</div>
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

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(tkt.status)}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {tkt.submittedAt ? new Date(tkt.submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Seed Baseline'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenTicket(tkt)}
                          className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
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
      {/* TICKET DETAILS & STATUS LIFECYCLE DRAWER                                  */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-navy-950 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-400">{selectedTicket.id}</span>
                  <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)} size="xs">
                    {selectedTicket.priority}
                  </Badge>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="font-bold text-white text-base mt-1">
                  {selectedTicket.title}
                </h3>
                <div className="text-xs text-slate-300 mt-0.5">
                  Reporting Stall: <span className="text-brand-400 font-semibold">{selectedTicket.stallName}</span> ({selectedTicket.stallId}) • Owner: {selectedTicket.ownerName}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content: Split into Conversation and Status Controls */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Lifecycle State Machine Controls */}
              <div className="p-4 bg-surface-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-500" />
                    <span>Lifecycle Transitions (5-State Machine)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Current: <strong>{selectedTicket.status}</strong></span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Transition to Under Review */}
                  {selectedTicket.status === 'Submitted' && (
                    <button
                      type="button"
                      onClick={() => handleApplyStatusChange('Under Review')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                    >
                      Move to Under Review
                    </button>
                  )}

                  {/* Transition to In Progress */}
                  {(selectedTicket.status === 'Submitted' || selectedTicket.status === 'Under Review' || selectedTicket.status === 'Reopened') && (
                    <button
                      type="button"
                      onClick={() => handleApplyStatusChange('In Progress')}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs"
                    >
                      Begin Work (In Progress)
                    </button>
                  )}

                  {/* Transition to Resolved */}
                  {(selectedTicket.status === 'Under Review' || selectedTicket.status === 'In Progress') && (
                    <button
                      type="button"
                      onClick={() => setTargetStatus('Resolved')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-colors ${
                        targetStatus === 'Resolved'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      Resolve Issue...
                    </button>
                  )}
                </div>

                {/* Resolution Note Input Box (Required when resolving) */}
                {targetStatus === 'Resolved' && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300 space-y-2 mt-2">
                    <label className="block font-bold text-emerald-900 text-xs">
                      Mandatory Resolution Note * <span className="text-[10px] text-emerald-700 font-normal">(Explain how the issue was fixed)</span>
                    </label>
                    <textarea
                      rows="2"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="e.g. Corrected printer CSS margins for 58mm compact rolls. Validated on test receipt."
                      className="w-full p-2 text-xs bg-white border border-emerald-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="xs" onClick={() => setTargetStatus('')}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        icon={CheckCircle2}
                        disabled={!resolutionNote.trim()}
                        onClick={() => handleApplyStatusChange('Resolved')}
                        className="bg-emerald-600 hover:bg-emerald-700 border-none"
                      >
                        Confirm Resolution & Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Conversation Thread */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Conversation History</span>
                  <span>{selectedTicket.messages?.length || 0} messages</span>
                </div>

                <div className="space-y-3.5 max-h-60 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-200/50">
                  {selectedTicket.messages && selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.authorRole === 'super_admin';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                          {isAdmin ? (
                            <>
                              <span className="font-bold text-brand-600">You (Super Admin)</span>
                              <Shield className="w-3 h-3 text-brand-500" />
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="font-bold text-slate-700">{msg.authorName} ({selectedTicket.stallName})</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                        </div>

                        <div
                          className={`max-w-md p-3 rounded-2xl leading-relaxed ${
                            msg.isResolutionNote
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-medium'
                              : isAdmin
                              ? 'bg-navy-900 text-white rounded-tr-none shadow-xs'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Transition History Log */}
              {selectedTicket.history && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Audit Transition Log
                  </div>
                  <div className="space-y-1">
                    {selectedTicket.history.map((h, idx) => (
                      <div key={idx} className="p-2 bg-surface-50 rounded border border-slate-200/60 text-[11px] text-slate-600 flex justify-between">
                        <span><strong>{h.status}:</strong> {h.note}</span>
                        <span className="text-slate-400 text-[10px] whitespace-nowrap ml-2">
                          {new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Reply Composer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write an administrative response to the stall owner..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Button variant="primary" size="sm" type="submit" icon={Send} disabled={!replyText.trim()}>
                  Reply
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
