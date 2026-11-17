/**
 * Admin Service (adminService.js)
 * Core business logic and governance engine for FoodDesk Module 11:
 * - Super Admin Platform Dashboard Metrics
 * - Stall Management & 4-State Approval Pipeline (Active, Pending, Rejected, Suspended)
 * - Owner Registry & Multi-Stall Authorization Mapping
 * - Centralized Support Desk & 5-State Ticket Lifecycle Machine (Submitted -> Under Review -> In Progress -> Resolved -> Reopened)
 * - Platform Activity / System Audit Logger
 * - Safe Guarded Demo Reset
 */

import { storageService } from './storageService.js';

export const TICKET_CATEGORIES = [
  'Website Bug',
  'POS Error',
  'Billing / Payment Discrepancy',
  'Hardware / Printer',
  'Other',
];

export const TICKET_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

const CATEGORY_MAP = {
  'website bug': 'Website Bug',
  'website_bug': 'Website Bug',
  'pos error': 'POS Error',
  'pos_error': 'POS Error',
  'pos': 'POS Error',
  'billing / payment discrepancy': 'Billing / Payment Discrepancy',
  'billing_discrepancy': 'Billing / Payment Discrepancy',
  'payment_discrepancy': 'Billing / Payment Discrepancy',
  'billing': 'Billing / Payment Discrepancy',
  'payment': 'Billing / Payment Discrepancy',
  'hardware / printer': 'Hardware / Printer',
  'hardware_printer': 'Hardware / Printer',
  'printer': 'Hardware / Printer',
  'hardware': 'Hardware / Printer',
  'other': 'Other',
};

const PRIORITY_MAP = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
  'urgent': 'Critical',
};

export function normalizeCategory(cat) {
  if (!cat) return null;
  const clean = cat.trim();
  if (TICKET_CATEGORIES.includes(clean)) return clean;
  const lower = clean.toLowerCase();
  return CATEGORY_MAP[lower] || null;
}

export function normalizePriority(pri) {
  if (!pri) return null;
  const clean = pri.trim();
  if (TICKET_PRIORITIES.includes(clean)) return clean;
  const lower = clean.toLowerCase();
  return PRIORITY_MAP[lower] || null;
}

export const adminService = {
  // =========================================================================
  // 1. PLATFORM-WIDE METRICS & DIAGNOSTICS
  // =========================================================================
  getPlatformMetrics() {
    const stalls = storageService.getStalls();
    const users = storageService.getUsers();
    const orders = storageService.getOrders();
    const tickets = storageService.getTickets();

    const activeStalls = stalls.filter((s) => s.status === 'active');
    const pendingStalls = stalls.filter((s) => s.status === 'pending_approval');
    const suspendedStalls = stalls.filter((s) => s.status === 'suspended');
    const rejectedStalls = stalls.filter((s) => s.status === 'rejected');

    const owners = users.filter((u) => u.role === 'stall_owner');

    // Platform GMV & Gross Sales (sum of subtotal / pre-discount for all realized orders across all stalls)
    let platformGrossSales = 0;
    let platformNetRevenue = 0;
    let completedOrdersCount = 0;

    orders.forEach((order) => {
      const pStatus = (order.paymentStatus || '').toLowerCase();
      const oStatus = (order.orderStatus || '').toLowerCase();

      // Only count realized/paid orders towards revenue
      if (pStatus === 'paid' || pStatus === 'successful' || pStatus === 'partially_refunded' || oStatus === 'completed') {
        completedOrdersCount++;
        const subtotal = Number(order.financials?.subtotal ?? order.totalAmount ?? 0);
        const discount = Number(order.financials?.discountAmount ?? order.discountAmount ?? 0);
        const refund = Number(order.totalRefundedAmount ?? order.refundAmount ?? 0);
        const grandTotal = Number(order.financials?.grandTotal ?? (subtotal - discount));

        platformGrossSales += subtotal;
        platformNetRevenue += Math.max(0, grandTotal - refund);
      }
    });

    const unresolvedTickets = tickets.filter((t) => t.status !== 'Resolved');
    const submittedTickets = tickets.filter((t) => t.status === 'Submitted');
    const underReviewTickets = tickets.filter((t) => t.status === 'Under Review');
    const inProgressTickets = tickets.filter((t) => t.status === 'In Progress');
    const resolvedTickets = tickets.filter((t) => t.status === 'Resolved');
    const reopenedTickets = tickets.filter((t) => t.status === 'Reopened');

    return {
      // Stalls
      totalStalls: stalls.length,
      activeStallsCount: activeStalls.length,
      pendingStallsCount: pendingStalls.length,
      suspendedStallsCount: suspendedStalls.length,
      rejectedStallsCount: rejectedStalls.length,

      // Owners
      totalOwnersCount: owners.length,

      // Orders & Financials
      totalOrdersCount: orders.length,
      completedOrdersCount,
      platformGrossSales,
      platformNetRevenue,

      // Support Tickets
      totalTicketsCount: tickets.length,
      unresolvedTicketsCount: unresolvedTickets.length,
      submittedTicketsCount: submittedTickets.length,
      underReviewTicketsCount: underReviewTickets.length,
      inProgressTicketsCount: inProgressTickets.length,
      resolvedTicketsCount: resolvedTickets.length,
      reopenedTicketsCount: reopenedTickets.length,
    };
  },

  // =========================================================================
  // 2. STALL MANAGEMENT & APPROVAL PIPELINE
  // =========================================================================
  getStalls({ search = '', ownerId = '', status = 'all' } = {}) {
    let stalls = storageService.getStalls();

    if (status && status !== 'all') {
      stalls = stalls.filter((s) => s.status === status);
    }

    if (ownerId && ownerId !== 'all') {
      stalls = stalls.filter((s) => s.ownerId === ownerId);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      stalls = stalls.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.id && s.id.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q))
      );
    }

    return stalls;
  },

  getStallById(stallId) {
    return storageService.getStallById(stallId);
  },

  approveStall(stallId, adminName = 'Platform Administrator') {
    const stalls = storageService.getStalls();
    const stallIndex = stalls.findIndex((s) => s.id === stallId);
    if (stallIndex === -1) {
      throw new Error(`Stall with ID "${stallId}" not found.`);
    }

    const stall = stalls[stallIndex];
    if (stall.status === 'active') {
      throw new Error(`Stall "${stall.name}" (${stallId}) is already approved and active.`);
    }

    const updatedStall = {
      ...stall,
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy: adminName,
    };

    stalls[stallIndex] = updatedStall;
    storageService.saveStalls(stalls);

    storageService.addActivity({
      type: 'stall_approval',
      description: `Stall "${stall.name}" (${stallId}) approved and activated.`,
      performedBy: adminName,
      role: 'super_admin',
    });

    return updatedStall;
  },

  rejectStall(stallId, reason, adminName = 'Platform Administrator') {
    if (!reason || !reason.trim()) {
      throw new Error('A detailed rejection reason is strictly required.');
    }

    const stalls = storageService.getStalls();
    const stallIndex = stalls.findIndex((s) => s.id === stallId);
    if (stallIndex === -1) {
      throw new Error(`Stall with ID "${stallId}" not found.`);
    }

    const stall = stalls[stallIndex];
    const updatedStall = {
      ...stall,
      status: 'rejected',
      rejectionReason: reason.trim(),
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminName,
    };

    stalls[stallIndex] = updatedStall;
    storageService.saveStalls(stalls);

    storageService.addActivity({
      type: 'stall_rejection',
      description: `Stall application "${stall.name}" (${stallId}) rejected: "${reason.trim()}".`,
      performedBy: adminName,
      role: 'super_admin',
    });

    return updatedStall;
  },

  suspendStall(stallId, reason, adminName = 'Platform Administrator') {
    if (!reason || !reason.trim()) {
      throw new Error('A valid suspension reason is strictly required.');
    }

    const stalls = storageService.getStalls();
    const stallIndex = stalls.findIndex((s) => s.id === stallId);
    if (stallIndex === -1) {
      throw new Error(`Stall with ID "${stallId}" not found.`);
    }

    const stall = stalls[stallIndex];
    if (stall.status === 'suspended') {
      throw new Error(`Stall "${stall.name}" (${stallId}) is already suspended.`);
    }

    const updatedStall = {
      ...stall,
      status: 'suspended',
      suspensionReason: reason.trim(),
      suspendedAt: new Date().toISOString(),
      suspendedBy: adminName,
    };

    stalls[stallIndex] = updatedStall;
    storageService.saveStalls(stalls);

    storageService.addActivity({
      type: 'stall_suspension',
      description: `Stall "${stall.name}" (${stallId}) suspended: "${reason.trim()}".`,
      performedBy: adminName,
      role: 'super_admin',
    });

    return updatedStall;
  },

  reactivateStall(stallId, adminName = 'Platform Administrator') {
    const stalls = storageService.getStalls();
    const stallIndex = stalls.findIndex((s) => s.id === stallId);
    if (stallIndex === -1) {
      throw new Error(`Stall with ID "${stallId}" not found.`);
    }

    const stall = stalls[stallIndex];
    const previousSuspension = stall.suspensionReason;

    const updatedStall = {
      ...stall,
      status: 'active',
      reactivatedAt: new Date().toISOString(),
      reactivatedBy: adminName,
      previousSuspensionReason: previousSuspension || null,
      suspensionReason: null,
    };

    stalls[stallIndex] = updatedStall;
    storageService.saveStalls(stalls);

    storageService.addActivity({
      type: 'stall_reactivation',
      description: `Stall "${stall.name}" (${stallId}) reactivated to active status.`,
      performedBy: adminName,
      role: 'super_admin',
    });

    return updatedStall;
  },

  createStallApplication(stallPayload, adminName = 'Platform Administrator') {
    if (!stallPayload.name || !stallPayload.ownerId) {
      throw new Error('Stall name and assigned Owner are required.');
    }

    const stalls = storageService.getStalls();
    const newId = stallPayload.id || `stall-${Date.now().toString().slice(-4)}`;

    const users = storageService.getUsers();
    const owner = users.find((u) => u.id === stallPayload.ownerId);

    const newStall = {
      id: newId,
      ownerId: stallPayload.ownerId,
      ownerName: owner ? owner.name : (stallPayload.ownerName || 'Stall Owner'),
      ownerEmail: owner ? owner.email : (stallPayload.ownerEmail || 'owner@fooddesk.com'),
      name: stallPayload.name.trim(),
      slug: stallPayload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: stallPayload.category || 'Food & Beverages',
      description: stallPayload.description || 'Newly registered food counter profile.',
      contactNumber: stallPayload.contactNumber || '+91 98765 00000',
      address: stallPayload.address || {
        street: 'Food Court Plaza',
        landmark: 'Main Hall',
        city: 'Indore',
        pincode: '452001',
      },
      operatingHours: stallPayload.operatingHours || {
        openingTime: '10:00 AM',
        closingTime: '10:00 PM',
        daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      paymentSettings: {
        upiId: `${newId}@upi`,
        payeeName: `${stallPayload.name} POS`,
        allowCash: true,
        allowStaticQr: true,
        allowDynamicGatewayQr: true,
      },
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    const updatedStalls = [newStall, ...stalls];
    storageService.saveStalls(updatedStalls);

    // Also link stall to owner's authorizedStalls if not already present
    if (owner && Array.isArray(owner.authorizedStalls) && !owner.authorizedStalls.includes(newId)) {
      owner.authorizedStalls.push(newId);
      const userIndex = users.findIndex((u) => u.id === owner.id);
      if (userIndex !== -1) {
        users[userIndex] = owner;
        storageService.set('fooddesk_users', users);
      }
    }

    storageService.addActivity({
      type: 'stall_application',
      description: `New stall application submitted: "${newStall.name}" (${newId}) under ${newStall.ownerName}.`,
      performedBy: adminName,
      role: 'super_admin',
    });

    return newStall;
  },

  // =========================================================================
  // 3. OWNER MANAGEMENT & MULTI-STALL REGISTRY
  // =========================================================================
  getOwners({ search = '', stallId = '', multiStallOnly = false } = {}) {
    const users = storageService.getUsers();
    let owners = users.filter((u) => u.role === 'stall_owner');

    // Enrich each owner with their full stall objects
    const enrichedOwners = owners.map((owner) => {
      const authorizedStallIds = Array.isArray(owner.authorizedStalls) ? owner.authorizedStalls : [];
      const stalls = authorizedStallIds
        .map((sId) => storageService.getStallById(sId))
        .filter(Boolean);

      return {
        ...owner,
        stalls,
        stallsCount: stalls.length,
        status: 'active',
      };
    });

    let filtered = enrichedOwners;

    if (multiStallOnly) {
      filtered = filtered.filter((o) => o.stallsCount > 1);
    }

    if (stallId && stallId !== 'all') {
      filtered = filtered.filter((o) =>
        o.authorizedStalls && o.authorizedStalls.includes(stallId)
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.name && o.name.toLowerCase().includes(q)) ||
          (o.email && o.email.toLowerCase().includes(q)) ||
          (o.phone && o.phone.toLowerCase().includes(q)) ||
          (o.id && o.id.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  getOwnerById(ownerId) {
    const owners = this.getOwners();
    return owners.find((o) => o.id === ownerId) || null;
  },

  // =========================================================================
  // 4. CENTRALIZED SUPPORT & TICKET LIFECYCLE ENGINE
  // =========================================================================
  getTickets({ stallId = 'all', ownerId = 'all', status = 'all', category = 'all', priority = 'all', search = '' } = {}) {
    let tickets = storageService.getTickets();

    if (stallId && stallId !== 'all') {
      tickets = tickets.filter((t) => t.stallId === stallId);
    }

    if (ownerId && ownerId !== 'all') {
      tickets = tickets.filter((t) => t.ownerId === ownerId);
    }

    if (status && status !== 'all') {
      tickets = tickets.filter((t) => t.status === status);
    }

    if (category && category !== 'all') {
      const normCat = normalizeCategory(category) || category;
      tickets = tickets.filter((t) => (normalizeCategory(t.category) || t.category) === normCat);
    }

    if (priority && priority !== 'all') {
      const normPri = normalizePriority(priority) || priority;
      tickets = tickets.filter((t) => (normalizePriority(t.priority) || t.priority) === normPri);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      tickets = tickets.filter(
        (t) =>
          (t.id && t.id.toLowerCase().includes(q)) ||
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.stallName && t.stallName.toLowerCase().includes(q)) ||
          (t.ownerName && t.ownerName.toLowerCase().includes(q))
      );
    }

    return tickets;
  },

  getTicketById(ticketId) {
    const tickets = storageService.getTickets();
    return tickets.find((t) => t.id === ticketId) || null;
  },

  createTicket(payload, userSession) {
    if (!payload.title || !payload.title.trim()) {
      throw new Error('Ticket title is required.');
    }
    if (!payload.category) {
      throw new Error('Category selection is required.');
    }
    const validatedCategory = normalizeCategory(payload.category);
    if (!validatedCategory) {
      throw new Error(`Invalid category "${payload.category}". Must be one of: ${TICKET_CATEGORIES.join(', ')}.`);
    }

    if (!payload.priority) {
      throw new Error('Priority level is required.');
    }
    const validatedPriority = normalizePriority(payload.priority);
    if (!validatedPriority) {
      throw new Error(`Invalid priority "${payload.priority}". Must be one of: ${TICKET_PRIORITIES.join(', ')}.`);
    }

    if (!payload.description || !payload.description.trim()) {
      throw new Error('Detailed description is required.');
    }

    let stallId;
    let ownerId;
    let ownerName;
    let ownerEmail;

    if (userSession?.user) {
      const user = userSession.user;
      if (user.role === 'super_admin') {
        stallId = payload.stallId || userSession.activeStall?.id;
        if (!stallId) {
          throw new Error('Stall ID is required to file a ticket.');
        }
        const targetStall = storageService.getStallById(stallId);
        if (!targetStall) {
          throw new Error(`Stall "${stallId}" not found.`);
        }
        ownerId = targetStall.ownerId || 'owner_1';
        ownerName = targetStall.ownerName || 'Stall Owner';
        ownerEmail = targetStall.ownerEmail || 'owner@fooddesk.com';
      } else {
        // Authenticated stall owner (or default user session)
        const activeStallId = userSession.activeStall?.id || payload.stallId;
        if (!activeStallId) {
          throw new Error('Active stall context is required to file a ticket.');
        }

        // Reject forged stall ID: owner must file strictly for active stall
        if (payload.stallId && userSession.activeStall?.id && payload.stallId !== userSession.activeStall.id) {
          throw new Error(
            `Data Isolation Violation: You are not authorized to create a ticket for stall "${payload.stallId}". Ticket must be filed under your active stall "${userSession.activeStall.id}".`
          );
        }

        // Reject forged owner ID: ownerId must strictly match authenticated user
        if (payload.ownerId && user.id && payload.ownerId !== user.id) {
          throw new Error(
            `Data Isolation Violation: Forged owner ID rejected. Authenticated owner ID is "${user.id}".`
          );
        }

        stallId = activeStallId;
        ownerId = user.id || 'owner_1';
        ownerName = user.name || 'Stall Owner';
        ownerEmail = user.email || 'owner@fooddesk.com';
      }
    } else {
      // Standalone or test call without session
      stallId = payload.stallId;
      if (!stallId) {
        throw new Error('Valid stall context is required to file a ticket.');
      }
      const targetStall = storageService.getStallById(stallId);
      if (!targetStall) {
        throw new Error(`Stall "${stallId}" not found.`);
      }
      if (payload.ownerId && payload.ownerId !== targetStall.ownerId) {
        throw new Error(
          `Data Isolation Violation: Owner ID "${payload.ownerId}" does not own stall "${stallId}". Expected "${targetStall.ownerId}".`
        );
      }
      ownerId = targetStall.ownerId || 'owner_1';
      ownerName = targetStall.ownerName || 'Stall Owner';
      ownerEmail = targetStall.ownerEmail || 'owner@fooddesk.com';
    }

    const stall = storageService.getStallById(stallId);
    if (!stall) {
      throw new Error(`Valid stall context "${stallId}" is required to file a ticket.`);
    }

    const newTicketId = `tkt-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const initialMessage = {
      id: `msg-${newTicketId}-0`,
      authorId: ownerId,
      authorName: ownerName,
      authorRole: 'stall_owner',
      text: payload.description.trim(),
      timestamp: nowIso,
    };

    const initialHistory = {
      status: 'Submitted',
      changedBy: ownerName,
      changedByRole: 'stall_owner',
      timestamp: nowIso,
      note: 'Initial support request submitted.',
    };

    const newTicket = {
      id: newTicketId,
      stallId: stall.id,
      stallName: stall.name,
      ownerId: ownerId,
      ownerName: ownerName,
      ownerEmail: ownerEmail,
      title: payload.title.trim(),
      category: validatedCategory,
      priority: validatedPriority,
      status: 'Submitted',
      description: payload.description.trim(),
      adminResponse: null,
      resolutionNote: null,
      submittedAt: nowIso,
      updatedAt: nowIso,
      resolvedAt: null,
      messages: [initialMessage],
      history: [initialHistory],
    };

    const currentTickets = storageService.getTickets();
    const updatedTickets = [newTicket, ...currentTickets];
    storageService.saveTickets(updatedTickets);

    storageService.addActivity({
      type: 'ticket_created',
      description: `Support ticket #${newTicketId} ("${newTicket.title}") filed for ${stall.name}.`,
      performedBy: newTicket.ownerName,
      role: 'stall_owner',
    });

    return newTicket;
  },

  addTicketReply(ticketId, messageText, author) {
    if (!messageText || !messageText.trim()) {
      throw new Error('Reply message cannot be empty.');
    }

    const tickets = storageService.getTickets();
    const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) {
      throw new Error(`Ticket "${ticketId}" not found.`);
    }

    const ticket = tickets[ticketIndex];
    const nowIso = new Date().toISOString();

    const newMessage = {
      id: `msg-${ticketId}-${Date.now().toString().slice(-4)}`,
      authorId: author.id || 'usr-admin',
      authorName: author.name || 'Platform Administrator',
      authorRole: author.role || 'super_admin',
      text: messageText.trim(),
      timestamp: nowIso,
    };

    const updatedMessages = [...(ticket.messages || []), newMessage];

    // If super admin replies to a Submitted ticket, automatically move it to Under Review if not yet touched
    let newStatus = ticket.status;
    let updatedHistory = [...(ticket.history || [])];

    if (author.role === 'super_admin' && ticket.status === 'Submitted') {
      newStatus = 'Under Review';
      updatedHistory.push({
        status: 'Under Review',
        changedBy: author.name,
        changedByRole: 'super_admin',
        timestamp: nowIso,
        note: 'Ticket under active review by Platform Administrator.',
      });
    }

    const updatedTicket = {
      ...ticket,
      status: newStatus,
      updatedAt: nowIso,
      messages: updatedMessages,
      history: updatedHistory,
      adminResponse: author.role === 'super_admin' ? messageText.trim() : ticket.adminResponse,
    };

    tickets[ticketIndex] = updatedTicket;
    storageService.saveTickets(tickets);

    storageService.addActivity({
      type: 'ticket_reply',
      description: `New message on ticket #${ticketId} by ${author.name} (${author.role}).`,
      performedBy: author.name,
      role: author.role,
    });

    return updatedTicket;
  },

  updateTicketStatus(ticketId, targetStatus, { note = '' } = {}, adminUser = { name: 'Platform Administrator', role: 'super_admin' }) {
    const validStatuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened'];
    if (!validStatuses.includes(targetStatus)) {
      throw new Error(`Invalid target status "${targetStatus}".`);
    }

    const tickets = storageService.getTickets();
    const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) {
      throw new Error(`Ticket "${ticketId}" not found.`);
    }

    const ticket = tickets[ticketIndex];

    // Status transition lifecycle validation
    // Submitted -> Under Review, In Progress
    // Under Review -> In Progress, Resolved
    // In Progress -> Resolved, Under Review
    // Reopened -> In Progress, Under Review
    // Resolved -> Can only be reopened by owner via reopenTicket()
    if (ticket.status === targetStatus) {
      return ticket;
    }

    const allowedTransitions = {
      'Submitted': ['Under Review', 'In Progress'],
      'Under Review': ['In Progress', 'Resolved'],
      'In Progress': ['Resolved', 'Under Review'],
      'Reopened': ['In Progress', 'Under Review'],
      'Resolved': [],
    };

    if (ticket.status === 'Resolved') {
      throw new Error(
        'Invalid status transition: A Resolved ticket cannot be transitioned directly by an administrator. It can only be reopened by a stall owner.'
      );
    }

    const allowed = allowedTransitions[ticket.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(
        `Invalid status transition: Cannot transition ticket from "${ticket.status}" to "${targetStatus}". Allowed target statuses: ${allowed.join(', ')}.`
      );
    }

    if (targetStatus === 'Resolved' && (!note || !note.trim())) {
      throw new Error('A detailed resolution note is strictly required to resolve a support ticket.');
    }

    const nowIso = new Date().toISOString();
    const historyEntry = {
      status: targetStatus,
      changedBy: adminUser.name || 'Platform Administrator',
      changedByRole: adminUser.role || 'super_admin',
      timestamp: nowIso,
      note: note.trim() || `Status updated from ${ticket.status} to ${targetStatus}.`,
    };

    const updatedHistory = [...(ticket.history || []), historyEntry];
    let updatedMessages = [...(ticket.messages || [])];

    // If a resolution note was provided, post it as an official resolution message in the conversation thread
    if (targetStatus === 'Resolved' && note.trim()) {
      updatedMessages.push({
        id: `msg-${ticketId}-res-${Date.now().toString().slice(-4)}`,
        authorId: adminUser.id || 'user_admin',
        authorName: adminUser.name || 'Platform Administrator',
        authorRole: 'super_admin',
        text: `[RESOLUTION NOTE]: ${note.trim()}`,
        timestamp: nowIso,
        isResolutionNote: true,
      });
    }

    const updatedTicket = {
      ...ticket,
      status: targetStatus,
      updatedAt: nowIso,
      resolvedAt: targetStatus === 'Resolved' ? nowIso : ticket.resolvedAt,
      resolutionNote: targetStatus === 'Resolved' ? note.trim() : ticket.resolutionNote,
      history: updatedHistory,
      messages: updatedMessages,
    };

    tickets[ticketIndex] = updatedTicket;
    storageService.saveTickets(tickets);

    storageService.addActivity({
      type: 'ticket_status_change',
      description: `Ticket #${ticketId} transitioned from "${ticket.status}" to "${targetStatus}".`,
      performedBy: adminUser.name,
      role: 'super_admin',
    });

    return updatedTicket;
  },

  reopenTicket(ticketId, comment, ownerUser) {
    if (!comment || !comment.trim()) {
      throw new Error('A follow-up comment explaining why the issue is being reopened is mandatory.');
    }

    const tickets = storageService.getTickets();
    const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) {
      throw new Error(`Ticket "${ticketId}" not found.`);
    }

    const ticket = tickets[ticketIndex];
    if (ticket.status !== 'Resolved') {
      throw new Error(`Invalid status transition: Only a "Resolved" ticket can be reopened. Current status is "${ticket.status}".`);
    }

    if (ownerUser && ownerUser.role === 'stall_owner' && ticket.ownerId && ticket.ownerId !== ownerUser.id) {
      throw new Error(`Data Isolation Violation: You are not authorized to reopen ticket "${ticketId}" belonging to another owner.`);
    }

    const nowIso = new Date().toISOString();

    const reopenMessage = {
      id: `msg-${ticketId}-reopen-${Date.now().toString().slice(-4)}`,
      authorId: ownerUser.id || 'owner_1',
      authorName: ownerUser.name || ticket.ownerName || 'Stall Owner',
      authorRole: 'stall_owner',
      text: `[ISSUE REOPENED]: ${comment.trim()}`,
      timestamp: nowIso,
    };

    const reopenHistory = {
      status: 'Reopened',
      changedBy: ownerUser.name || ticket.ownerName || 'Stall Owner',
      changedByRole: 'stall_owner',
      timestamp: nowIso,
      note: comment.trim(),
    };

    const updatedTicket = {
      ...ticket,
      status: 'Reopened',
      updatedAt: nowIso,
      messages: [...(ticket.messages || []), reopenMessage],
      history: [...(ticket.history || []), reopenHistory],
    };

    tickets[ticketIndex] = updatedTicket;
    storageService.saveTickets(tickets);

    storageService.addActivity({
      type: 'ticket_reopened',
      description: `Ticket #${ticketId} reopened by ${updatedTicket.ownerName}: "${comment.trim()}".`,
      performedBy: updatedTicket.ownerName,
      role: 'stall_owner',
    });

    return updatedTicket;
  },

  // =========================================================================
  // 5. PLATFORM ACTIVITY LOG
  // =========================================================================
  getActivityLog(limit = 20) {
    const activity = storageService.getActivity();
    return activity.slice(0, limit);
  },

  recordActivity({ type, description, performedBy, role = 'super_admin' }) {
    return storageService.addActivity({
      type,
      description,
      performedBy,
      role,
    });
  },

  // =========================================================================
  // 6. SAFE FACTORY RESET
  // =========================================================================
  resetPlatformDemoData() {
    storageService.resetAllData(true);
    storageService.addActivity({
      type: 'factory_reset',
      description: 'Super Admin executed full platform factory seed reset.',
      performedBy: 'Platform Administrator',
      role: 'super_admin',
    });
    return { success: true };
  },
};

