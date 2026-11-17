/**
 * Storage Service
 * Centralized, resilient localStorage persistence engine for FoodDesk.
 * Auto-seeds factory data on first application load without overwriting runtime updates.
 */

import { initialUsers } from '../data/initialUsers.js';
import { initialStalls } from '../data/initialStalls.js';
import { initialMenu } from '../data/initialMenu.js';
import { initialOrders } from '../data/initialOrders.js';
import { initialExpenses } from '../data/initialExpenses.js';
import { initialInventory } from '../data/initialInventory.js';
import { initialTickets } from '../data/initialTickets.js';

const KEYS = {
  INITIALIZED: 'fooddesk_initialized',
  USERS: 'fooddesk_users',
  STALLS: 'fooddesk_stalls',
  MENU: 'fooddesk_menu',
  CATEGORIES: 'fooddesk_categories',
  ORDERS: 'fooddesk_orders',
  EXPENSES: 'fooddesk_expenses',
  INVENTORY: 'fooddesk_inventory',
  STOCK_MOVEMENTS: 'fooddesk_stock_movements',
  EXPENSE_AUDIT: 'fooddesk_expense_audit',
  TICKETS: 'fooddesk_tickets',
  PAYMENTS: 'fooddesk_payments',
  SESSION: 'fooddesk_session',
  ACTIVITY: 'fooddesk_activity',
};

class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized(forceReset = false) {
    if (typeof window === 'undefined') return;

    const isInitialized = localStorage.getItem(KEYS.INITIALIZED);
    if (!isInitialized || forceReset) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(initialUsers));
      localStorage.setItem(KEYS.STALLS, JSON.stringify(initialStalls));
      localStorage.setItem(KEYS.MENU, JSON.stringify(initialMenu));
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(initialOrders));
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(initialExpenses));
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(initialInventory));
      localStorage.setItem(KEYS.TICKETS, JSON.stringify(initialTickets));

      // Seed initial categories derived per stall from initialMenu
      const stallCategoryMap = {};
      initialMenu.forEach((item) => {
        if (!stallCategoryMap[item.stallId]) {
          stallCategoryMap[item.stallId] = new Set();
        }
        if (item.category) {
          stallCategoryMap[item.stallId].add(item.category);
        }
      });
      const initialCategories = [];
      let catIdx = 1;
      Object.entries(stallCategoryMap).forEach(([sId, catSet]) => {
        catSet.forEach((catName) => {
          initialCategories.push({
            id: `cat-${sId}-${catIdx++}`,
            stallId: sId,
            name: catName,
            createdAt: '2026-11-12T00:00:00.000Z',
          });
        });
      });
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(initialCategories));

      // Seed initial payments mapped to seeded orders
      const initialPayments = initialOrders
        .filter((o) => o.paymentStatus === 'successful' || o.paymentStatus === 'paid')
        .map((o) => ({
          id: `pay-${o.id}`,
          orderId: o.id,
          orderNumber: o.orderNumber,
          stallId: o.stallId,
          amount: o.financials?.grandTotal ?? 0,
          paymentMethod: o.paymentMethod || 'cash',
          paymentStatus: 'paid',
          paymentDetails: o.paymentDetails || {},
          createdAt: o.createdAt,
          verifiedAt: o.paymentDetails?.verifiedAt || o.createdAt,
          collectedBy: 'Counter Staff',
          isDemoSimulation: true,
        }));
      localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(initialPayments));

      localStorage.setItem(KEYS.INITIALIZED, 'true');
      if (forceReset) {
        localStorage.removeItem(KEYS.SESSION);
      }
    }

    // Ensure categories collection exists even if initialized prior to Module 8
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      const currentMenu = this.get(KEYS.MENU, initialMenu);
      const stallCategoryMap = {};
      currentMenu.forEach((item) => {
        if (!stallCategoryMap[item.stallId]) {
          stallCategoryMap[item.stallId] = new Set();
        }
        if (item.category) {
          stallCategoryMap[item.stallId].add(item.category);
        }
      });
      const initialCategories = [];
      let catIdx = 1;
      Object.entries(stallCategoryMap).forEach(([sId, catSet]) => {
        catSet.forEach((catName) => {
          initialCategories.push({
            id: `cat-${sId}-${catIdx++}`,
            stallId: sId,
            name: catName,
            createdAt: '2026-11-12T00:00:00.000Z',
          });
        });
      });
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(initialCategories));
    }

    // Ensure stock movements collection exists even if initialized prior to Module 9
    if (!localStorage.getItem(KEYS.STOCK_MOVEMENTS) || forceReset) {
      const currentInv = this.get(KEYS.INVENTORY, initialInventory);
      const initialMovements = currentInv.map((item, idx) => ({
        id: `mov-init-${item.stallId}-${idx + 1}`,
        inventoryItemId: item.id,
        ingredientName: item.name,
        stallId: item.stallId,
        type: 'initial',
        quantityChanged: item.currentStock,
        previousQuantity: 0,
        newQuantity: item.currentStock,
        unit: item.unit,
        reason: 'Initial inventory baseline',
        timestamp: '2026-11-12T08:00:00.000Z',
        user: 'System Seed',
      }));
      localStorage.setItem(KEYS.STOCK_MOVEMENTS, JSON.stringify(initialMovements));
    }

    // Ensure expense audit log collection exists
    if (!localStorage.getItem(KEYS.EXPENSE_AUDIT) || forceReset) {
      localStorage.setItem(KEYS.EXPENSE_AUDIT, JSON.stringify([]));
    }

    // Ensure platform activity log collection exists
    if (!localStorage.getItem(KEYS.ACTIVITY) || forceReset) {
      const initialActivity = [
        {
          id: 'act-001',
          type: 'platform_init',
          description: 'FoodDesk platform initialized with 3 authorized demo stalls.',
          performedBy: 'System',
          role: 'system',
          timestamp: '2026-11-12T00:00:00.000Z',
        },
        {
          id: 'act-002',
          type: 'stall_approval',
          description: 'Fast Food Stall (stall-1) approved and set to active status.',
          performedBy: 'Platform Administrator',
          role: 'super_admin',
          timestamp: '2026-11-12T00:05:00.000Z',
        },
        {
          id: 'act-003',
          type: 'stall_approval',
          description: 'Beverages Stall (stall-2) approved and set to active status.',
          performedBy: 'Platform Administrator',
          role: 'super_admin',
          timestamp: '2026-11-12T00:10:00.000Z',
        },
        {
          id: 'act-004',
          type: 'stall_approval',
          description: 'Desserts & Sweets Stall (stall-3) approved and set to active status.',
          performedBy: 'Platform Administrator',
          role: 'super_admin',
          timestamp: '2026-11-12T00:15:00.000Z',
        },
      ];
      localStorage.setItem(KEYS.ACTIVITY, JSON.stringify(initialActivity));
    }
  }

  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
    }
  }

  // Domain Collections
  getUsers() {
    return this.get(KEYS.USERS, initialUsers);
  }

  getStalls() {
    return this.get(KEYS.STALLS, initialStalls);
  }

  getStallById(stallId) {
    const stalls = this.getStalls();
    return stalls.find((s) => s.id === stallId) || null;
  }

  saveStalls(stalls) {
    this.set(KEYS.STALLS, stalls);
  }

  getMenu(stallId = null) {
    const menu = this.get(KEYS.MENU, initialMenu);
    return stallId ? menu.filter((item) => item.stallId === stallId && !item.isArchived) : menu;
  }

  saveMenu(menu) {
    this.set(KEYS.MENU, menu);
  }

  getCategories(stallId = null) {
    const categories = this.get(KEYS.CATEGORIES, []);
    return stallId ? categories.filter((c) => c.stallId === stallId) : categories;
  }

  saveCategories(categories) {
    this.set(KEYS.CATEGORIES, categories);
  }

  getOrders(stallId = null) {
    const orders = this.get(KEYS.ORDERS, initialOrders);
    return stallId ? orders.filter((o) => o.stallId === stallId) : orders;
  }

  /**
   * Cross-tab concurrency coordinator for order sequence allocation and persistence.
   *
   * PREFERRED MECHANISM:
   * Uses the W3C Web Locks API (`navigator.locks`) when available in supported modern browsers
   * (Chrome 69+, Edge 79+, Safari 15.4+, Firefox 96+), guaranteeing origin-wide exclusive execution
   * across multiple open tabs.
   *
   * FALLBACK LIMITATION & FAIL-SAFE BEHAVIOR:
   * In environments where Web Locks API is unavailable (legacy browsers or Node.js test runners),
   * a cooperative localStorage timestamped spinlock is used as a best-effort coordination layer.
   * NOTE: A localStorage read/write spinlock CANNOT guarantee atomic compare-and-swap (CAS) behavior.
   * Universal or database-grade atomicity is NOT claimed.
   * If two tabs submit orders concurrently in an environment lacking Web Locks API and race the fallback,
   * `storageService.createOrder()` fails safely by detecting the duplicate (stallId, orderNumber) and
   * throwing a descriptive error, preventing silent data overwrites.
   */
  async withStallLock(stallId, action) {
    const lockName = `fooddesk_lock_${stallId}`;

    // 1. Preferred: Standard W3C Web Locks API in supported modern browsers
    if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
      return await navigator.locks.request(lockName, { mode: 'exclusive' }, async () => {
        return await action();
      });
    }

    // 2. Best-effort Fallback: Cooperative localStorage spinlock (non-atomic CAS)
    const tabId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const maxWaitMs = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const now = Date.now();
      const existingRaw = localStorage.getItem(lockName);
      let existingLock = null;
      try {
        existingLock = existingRaw ? JSON.parse(existingRaw) : null;
      } catch (e) {}

      // If lock does not exist or has expired (stale lock > 2500ms), attempt cooperative claim
      if (!existingLock || existingLock.expiresAt < now) {
        localStorage.setItem(lockName, JSON.stringify({ owner: tabId, expiresAt: now + 2500 }));
        try {
          return await action();
        } finally {
          const currentRaw = localStorage.getItem(lockName);
          try {
            const current = currentRaw ? JSON.parse(currentRaw) : null;
            if (current && current.owner === tabId) {
              localStorage.removeItem(lockName);
            }
          } catch (e) {}
        }
      }

      // Small jittered backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20));
    }

    // Fail-safe execution: Proceed to action where createOrder's duplicate check guards against overwrite
    return await action();
  }

  /**
   * Atomically generate next sequential order number for a stall on a specific business date.
   * Format: ORD-YYYYMMDD-XXXX (resets daily per stall).
   */
  getNextOrderSequence(stallId, dateStr) {
    if (!stallId || !dateStr) {
      throw new Error('storageService: stallId and dateStr are required for sequence generation.');
    }
    const orders = this.getOrders(stallId);
    const prefix = `ORD-${dateStr}-`;

    let maxSeq = 0;
    orders.forEach((o) => {
      if (o.orderNumber && o.orderNumber.startsWith(prefix)) {
        const parts = o.orderNumber.split('-');
        const seqNum = parseInt(parts[2], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });

    const atomicKey = `fooddesk_seq_${stallId}_${dateStr}`;
    const storedCounter = parseInt(localStorage.getItem(atomicKey) || '0', 10);
    const nextSeq = Math.max(maxSeq, storedCounter) + 1;

    localStorage.setItem(atomicKey, String(nextSeq));
    return nextSeq;
  }

  /**
   * Atomically generate next sequential pickup token for a stall on a specific business date.
   */
  getNextPickupToken(stallId, dateStr) {
    if (!stallId || !dateStr) {
      throw new Error('storageService: stallId and dateStr are required for token generation.');
    }
    const orders = this.getOrders(stallId);
    const prefix = `ORD-${dateStr}-`;

    let maxToken = 0;
    orders.forEach((o) => {
      if (o.orderNumber && o.orderNumber.startsWith(prefix) && typeof o.pickupToken === 'number') {
        if (o.pickupToken > maxToken) {
          maxToken = o.pickupToken;
        }
      }
    });

    const tokenKey = `fooddesk_token_${stallId}_${dateStr}`;
    const storedToken = parseInt(localStorage.getItem(tokenKey) || '0', 10);
    const nextToken = Math.max(maxToken, storedToken) + 1;

    localStorage.setItem(tokenKey, String(nextToken));
    return nextToken;
  }

  /**
   * Create and persist a new order record into the centralized store.
   * Enforces uniqueness on (stallId, orderNumber).
   */
  createOrder(order) {
    if (!order || !order.stallId || !order.orderNumber) {
      throw new Error('storageService: Invalid order payload.');
    }
    const orders = this.get(KEYS.ORDERS, initialOrders);

    // Prevent duplicate order numbers for the same stall
    const duplicate = orders.find(
      (o) => o.stallId === order.stallId && o.orderNumber === order.orderNumber
    );
    if (duplicate) {
      throw new Error(
        `Duplicate Order: Order number "${order.orderNumber}" already exists for stall "${order.stallId}". Submission rejected to prevent overwriting existing business records. Please retry.`
      );
    }

    const updated = [order, ...orders];
    this.set(KEYS.ORDERS, updated);
    return order;
  }

  getExpenses(stallId = null) {
    const expenses = this.get(KEYS.EXPENSES, initialExpenses);
    return stallId ? expenses.filter((e) => e.stallId === stallId && !e.isDeleted) : expenses;
  }

  saveExpenses(expenses) {
    this.set(KEYS.EXPENSES, expenses);
  }

  getInventory(stallId = null) {
    const inventory = this.get(KEYS.INVENTORY, initialInventory);
    return stallId ? inventory.filter((i) => i.stallId === stallId) : inventory;
  }

  saveInventory(inventory) {
    this.set(KEYS.INVENTORY, inventory);
  }

  getStockMovements(stallId = null) {
    const movements = this.get(KEYS.STOCK_MOVEMENTS, []);
    return stallId ? movements.filter((m) => m.stallId === stallId) : movements;
  }

  saveStockMovements(movements) {
    this.set(KEYS.STOCK_MOVEMENTS, movements);
  }

  addStockMovement(movement) {
    if (!movement || !movement.stallId) {
      throw new Error('storageService: Invalid stock movement payload.');
    }
    const movements = this.get(KEYS.STOCK_MOVEMENTS, []);
    const updated = [movement, ...movements];
    this.set(KEYS.STOCK_MOVEMENTS, updated);
    return movement;
  }

  getExpenseAuditLogs(stallId = null) {
    const logs = this.get(KEYS.EXPENSE_AUDIT, []);
    return stallId ? logs.filter((l) => l.stallId === stallId) : logs;
  }

  addExpenseAuditLog(log) {
    if (!log || !log.stallId) return;
    const logs = this.get(KEYS.EXPENSE_AUDIT, []);
    this.set(KEYS.EXPENSE_AUDIT, [log, ...logs]);
  }

  getTickets(stallId = null) {
    const rawTickets = this.get(KEYS.TICKETS, initialTickets);
    const enrichedTickets = rawTickets.map((t) => {
      let messages = Array.isArray(t.messages) ? [...t.messages] : [];
      if (messages.length === 0 && t.description) {
        messages.push({
          id: `msg-${t.id}-0`,
          authorId: t.ownerId || 'owner_1',
          authorName: t.ownerName || 'Stall Owner',
          authorRole: 'stall_owner',
          text: t.description,
          timestamp: t.submittedAt || t.createdAt || '2026-11-12T10:00:00.000Z',
        });
        if (t.adminResponse) {
          messages.push({
            id: `msg-${t.id}-admin`,
            authorId: 'user_admin',
            authorName: 'Platform Administrator',
            authorRole: 'super_admin',
            text: t.adminResponse,
            timestamp: t.resolvedAt || t.updatedAt || '2026-11-12T15:00:00.000Z',
          });
        }
      }
      let history = Array.isArray(t.history) ? [...t.history] : [];
      if (history.length === 0) {
        history.push({
          status: 'Submitted',
          changedBy: t.ownerName || 'Stall Owner',
          changedByRole: 'stall_owner',
          timestamp: t.submittedAt || t.createdAt || '2026-11-12T10:00:00.000Z',
          note: 'Initial ticket submission',
        });
        if (t.status && t.status !== 'Submitted') {
          history.push({
            status: t.status,
            changedBy: 'Platform Administrator',
            changedByRole: 'super_admin',
            timestamp: t.resolvedAt || t.updatedAt || '2026-11-12T15:00:00.000Z',
            note: t.resolutionNote || t.adminResponse || `Status transitioned to ${t.status}`,
          });
        }
      }
      // Safe migration: guarantee explicit ownerId on every ticket
      let ownerId = t.ownerId;
      if (!ownerId) {
        const stall = this.getStallById(t.stallId);
        ownerId = stall?.ownerId || (t.stallId === 'stall-3' ? 'owner_2' : 'owner_1');
      }

      return {
        ...t,
        ownerId,
        messages,
        history,
      };
    });
    return stallId ? enrichedTickets.filter((t) => t.stallId === stallId) : enrichedTickets;
  }

  saveTickets(tickets) {
    this.set(KEYS.TICKETS, tickets);
  }

  getActivity() {
    return this.get(KEYS.ACTIVITY, []);
  }

  saveActivity(activity) {
    this.set(KEYS.ACTIVITY, activity);
  }

  addActivity(entry) {
    if (!entry) return;
    const current = this.getActivity();
    const item = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.set(KEYS.ACTIVITY, [item, ...current]);
    return item;
  }

  // ==========================================
  // MODULE 5: PAYMENTS PERSISTENCE
  // ==========================================
  getPayments(stallId = null) {
    const payments = this.get(KEYS.PAYMENTS, []);
    return stallId ? payments.filter((p) => p.stallId === stallId) : payments;
  }

  getPaymentByOrderId(orderId) {
    if (!orderId) return null;
    const payments = this.get(KEYS.PAYMENTS, []);
    return payments.find((p) => p.orderId === orderId) || null;
  }

  /**
   * Persist a payment transaction record.
   * Updates the corresponding order's paymentStatus and paymentDetails in fooddesk_orders.
   * Enforces that an already paid order cannot receive a duplicate 'paid' record.
   */
  recordPayment(paymentRecord) {
    if (!paymentRecord || !paymentRecord.orderId || !paymentRecord.stallId) {
      throw new Error('storageService: Invalid payment payload.');
    }

    const payments = this.get(KEYS.PAYMENTS, []);

    // Prevent duplicate successful payment records for the same order
    if (paymentRecord.paymentStatus === 'paid' || paymentRecord.paymentStatus === 'successful') {
      const existingPaid = payments.find(
        (p) =>
          p.orderId === paymentRecord.orderId &&
          (p.paymentStatus === 'paid' || p.paymentStatus === 'successful')
      );
      if (existingPaid) {
        throw new Error(
          `Duplicate Payment: Order "${paymentRecord.orderId}" has already been confirmed as paid.`
        );
      }
    }

    const updatedPayments = [paymentRecord, ...payments];
    this.set(KEYS.PAYMENTS, updatedPayments);

    // Synchronize order record in fooddesk_orders
    const orders = this.get(KEYS.ORDERS, initialOrders);
    const orderIndex = orders.findIndex((o) => o.id === paymentRecord.orderId);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        paymentStatus: paymentRecord.paymentStatus,
        paymentMethod: paymentRecord.paymentMethod,
        paymentDetails: paymentRecord.paymentDetails || {},
      };
      this.set(KEYS.ORDERS, orders);
    }

    return paymentRecord;
  }

  /**
   * Update an existing order in the centralized store.
   */
  updateOrder(updatedOrder) {
    if (!updatedOrder || !updatedOrder.id) {
      throw new Error('storageService: Invalid order payload for update.');
    }
    const orders = this.get(KEYS.ORDERS, initialOrders);
    const index = orders.findIndex((o) => o.id === updatedOrder.id);
    if (index === -1) {
      throw new Error(`storageService: Order "${updatedOrder.id}" not found.`);
    }
    orders[index] = { ...orders[index], ...updatedOrder };
    this.set(KEYS.ORDERS, orders);
    return orders[index];
  }

  // Active User & Stall Session
  getSession() {
    return this.get(KEYS.SESSION, null);
  }

  setSession(session) {
    this.set(KEYS.SESSION, session);
  }

  clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  }

  // Factory Data Reset
  resetAllData(preserveAdminSession = true) {
    const currentSession = this.getSession();
    this.ensureInitialized(true);
    if (preserveAdminSession && currentSession?.user?.role === 'super_admin') {
      this.setSession(currentSession);
    }
  }
}

export const storageService = new StorageService();
