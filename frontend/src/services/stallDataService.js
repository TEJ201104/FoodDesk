/**
 * Stall Data Service (stallDataService.js)
 * Centralized, scoped data isolation engine for FoodDesk.
 * Guarantees that all queries and calculations are strictly bound to an authorized Stall ID.
 * Prevents accidental cross-stall data leakage across menu items, orders, expenses,
 * inventory ingredients, and support tickets.
 */

import { storageService } from './storageService.js';
import { getTodayKolkataDateString, isTodayKolkata, getKolkataDateOnlyString } from '../utils/dateUtils.js';

export const EXPENSE_CATEGORIES = [
  'Raw Materials',
  'Gas',
  'Electricity',
  'Salaries',
  'Packaging',
  'Transportation',
  'Maintenance',
  'Other',
];

export const EXPENSE_CATEGORY_MAP = {
  raw_materials: 'Raw Materials',
  gas: 'Gas',
  electricity: 'Electricity',
  salaries: 'Salaries',
  packaging: 'Packaging',
  transportation: 'Transportation',
  maintenance: 'Maintenance',
  other: 'Other',
};

export const INVENTORY_UNITS = [
  'kg',
  'g',
  'litres',
  'ml',
  'units',
  'packets',
  'pieces',
];

export const WASTAGE_REASONS = [
  'Expired',
  'Spoiled',
  'Damaged',
  'Preparation wastage',
  'Other',
];

export function normalizeExpenseCategory(cat) {
  if (!cat) return 'Other';
  const trimmed = String(cat).trim();
  const lower = trimmed.toLowerCase();
  if (EXPENSE_CATEGORY_MAP[lower]) return EXPENSE_CATEGORY_MAP[lower];
  const matched = EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === lower);
  return matched || trimmed || 'Other';
}

export function getInventoryStatus(currentStock, minThreshold) {
  const stock = Number(currentStock) || 0;
  const min = Number(minThreshold) || 0;
  if (stock <= 0) return 'out_of_stock';
  if (stock <= min) return 'low_stock';
  return 'in_stock';
}

export const stallDataService = {
  /**
   * Validate stall ID parameter to prevent un-scoped or cross-tenant leakage.
   */
  validateStallId(stallId) {
    if (!stallId || typeof stallId !== 'string' || !stallId.trim()) {
      throw new Error('stallDataService: A valid stallId is required for this operation.');
    }
    return stallId.trim();
  },

  /**
   * Reusable authorization check for owner-facing operations.
   * Validates stallId parameter and verifies that the authenticated user
   * possesses rights to access data for this stall.
   * - Super Admin retains global administrative oversight across all stalls.
   * - Stall Owner may access authorized stalls only (e.g. Owner 1 -> stall-1, stall-2; Owner 2 -> stall-3).
   * - Unauthorized calls or unauthenticated requests are rejected.
   */
  validateStallAccess(stallId) {
    const validId = this.validateStallId(stallId);

    const session = storageService.getSession();
    if (!session || !session.user) {
      throw new Error(`Unauthorized Stall Access: Authentication required to access data for stall "${validId}".`);
    }

    const { role, authorizedStalls, name, email } = session.user;

    // Super Admin retains global read oversight
    if (role === 'super_admin') {
      return validId;
    }

    // Stall Owners must have the requested stall in their authorizedStalls array
    if (role === 'stall_owner') {
      if (Array.isArray(authorizedStalls) && authorizedStalls.includes(validId)) {
        return validId;
      }
      throw new Error(
        `Unauthorized Stall Access: Stall Owner "${name || email || 'Current Owner'}" is not authorized for stall "${validId}". Authorized stalls: [${(authorizedStalls || []).join(', ')}].`
      );
    }

    throw new Error(`Unauthorized Stall Access: User role "${role}" is not authorized for stall "${validId}".`);
  },

  /**
   * Retrieve stall profile details by ID.
   */
  getStallProfile(stallId) {
    const validId = this.validateStallAccess(stallId);
    return storageService.getStallById(validId);
  },

  /**
   * Retrieve active menu items scoped to the stall (excludes soft-deleted/archived items).
   */
  getMenu(stallId) {
    const validId = this.validateStallAccess(stallId);
    return storageService.getMenu(validId);
  },

  /**
   * Retrieve all menu items for the stall (including archived items for management view).
   */
  getAllMenuItems(stallId) {
    const validId = this.validateStallAccess(stallId);
    const all = storageService.get('fooddesk_menu', []);
    return all.filter((item) => item.stallId === validId);
  },

  /**
   * Retrieve a single menu item with strict stall ownership verification.
   */
  getMenuItemById(stallId, itemId) {
    const validId = this.validateStallAccess(stallId);
    const all = storageService.get('fooddesk_menu', []);
    const item = all.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`Menu item "${itemId}" not found for stall "${validId}".`);
    }
    if (item.stallId !== validId) {
      throw new Error(
        `Data Isolation Violation: Menu item "${itemId}" belongs to stall "${item.stallId}", not "${validId}".`
      );
    }
    return item;
  },

  /**
   * Retrieve all food categories for a stall, enriched with item counts.
   */
  getCategories(stallId) {
    const validId = this.validateStallAccess(stallId);
    let categories = storageService.getCategories(validId);

    // Fallback: auto-seed from stall menu items if empty
    if (!categories || categories.length === 0) {
      const stallItems = this.getAllMenuItems(validId);
      const catSet = new Set(stallItems.map((i) => i.category).filter(Boolean));
      let idx = 1;
      categories = Array.from(catSet).map((cName) => ({
        id: `cat-${validId}-${idx++}`,
        stallId: validId,
        name: cName,
        createdAt: '2026-11-12T00:00:00.000Z',
      }));
      const allCats = storageService.getCategories();
      storageService.saveCategories([...allCats, ...categories]);
    }

    // Enrich with item counts
    const allItems = this.getAllMenuItems(validId);
    return categories.map((cat) => {
      const activeCount = allItems.filter(
        (i) => !i.isArchived && i.category?.toLowerCase() === cat.name.toLowerCase()
      ).length;
      const archivedCount = allItems.filter(
        (i) => i.isArchived && i.category?.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return {
        ...cat,
        itemCount: activeCount,
        archivedCount,
      };
    });
  },

  /**
   * Add a new custom category for a stall with duplicate prevention.
   */
  addCategory(stallId, categoryName) {
    const validId = this.validateStallAccess(stallId);

    if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
      throw new Error('Category name is required.');
    }
    const trimmedName = categoryName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      throw new Error('Category name must be between 2 and 40 characters.');
    }

    const currentCats = storageService.getCategories(validId);
    if (currentCats.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`Category "${trimmedName}" already exists for this stall.`);
    }

    const newCategory = {
      id: `cat-${validId}-${Date.now()}`,
      stallId: validId,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    const allCats = storageService.getCategories();
    storageService.saveCategories([...allCats, newCategory]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:categories_updated', { detail: { stallId: validId } }));
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId } }));
    }

    return {
      ...newCategory,
      itemCount: 0,
      archivedCount: 0,
    };
  },

  /**
   * Edit/rename a category and cascade name updates to current menu items (preserving historical orders).
   */
  updateCategory(stallId, categoryId, newName) {
    const validId = this.validateStallAccess(stallId);

    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      throw new Error('Category name is required.');
    }
    const trimmedName = newName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      throw new Error('Category name must be between 2 and 40 characters.');
    }

    const allCats = storageService.getCategories();
    const catIndex = allCats.findIndex((c) => c.id === categoryId && c.stallId === validId);
    if (catIndex === -1) {
      throw new Error(`Category "${categoryId}" not found for stall "${validId}".`);
    }

    const oldName = allCats[catIndex].name;

    // Check duplicate name within stall
    const duplicate = allCats.find(
      (c) => c.stallId === validId && c.id !== categoryId && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Another category named "${trimmedName}" already exists for this stall.`);
    }

    // Update category
    allCats[catIndex] = {
      ...allCats[catIndex],
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    };
    storageService.saveCategories(allCats);

    // Cascade name update to stall's menu items (both active and archived)
    const allMenu = storageService.get('fooddesk_menu', []);
    let menuModified = false;
    const updatedMenu = allMenu.map((item) => {
      if (item.stallId === validId && item.category?.toLowerCase() === oldName.toLowerCase()) {
        menuModified = true;
        return {
          ...item,
          category: trimmedName,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    if (menuModified) {
      storageService.saveMenu(updatedMenu);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:categories_updated', { detail: { stallId: validId } }));
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId } }));
    }

    return allCats[catIndex];
  },

  /**
   * Delete a category, strictly preventing accidental deletion if menu items are currently assigned.
   */
  deleteCategory(stallId, categoryId) {
    const validId = this.validateStallAccess(stallId);
    const allCats = storageService.getCategories();
    const targetCat = allCats.find((c) => c.id === categoryId && c.stallId === validId);
    if (!targetCat) {
      throw new Error(`Category "${categoryId}" not found for stall "${validId}".`);
    }

    // Check if any menu items in this stall are assigned to this category
    const stallItems = this.getAllMenuItems(validId);
    const assignedItems = stallItems.filter(
      (i) => i.category?.toLowerCase() === targetCat.name.toLowerCase()
    );

    if (assignedItems.length > 0) {
      throw new Error(
        `Cannot delete category "${targetCat.name}" because it contains ${assignedItems.length} menu item(s). Please reassign or remove these items first.`
      );
    }

    const filteredCats = allCats.filter((c) => !(c.id === categoryId && c.stallId === validId));
    storageService.saveCategories(filteredCats);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:categories_updated', { detail: { stallId: validId } }));
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId } }));
    }

    return { success: true, deletedId: categoryId, name: targetCat.name };
  },

  /**
   * Add a new menu item to the stall's catalog with price validation, duplicate check, and category linkage.
   */
  addMenuItem(stallId, payload) {
    const validId = this.validateStallAccess(stallId);

    // Validation
    if (!payload || typeof payload !== 'object') {
      throw new Error('Menu item payload is required.');
    }
    const name = String(payload.name || '').trim();
    if (!name || name.length < 2) {
      throw new Error('Item name must be at least 2 characters.');
    }
    if (name.length > 80) {
      throw new Error('Item name cannot exceed 80 characters.');
    }

    // Duplicate check within stall (active items)
    const existingItems = this.getAllMenuItems(validId);
    const duplicate = existingItems.find(
      (i) => !i.isArchived && i.name.toLowerCase().trim() === name.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`A menu item named "${name}" already exists in this stall.`);
    }

    const category = String(payload.category || '').trim();
    if (!category) {
      throw new Error('Category is required.');
    }

    const sellingPrice = Number(payload.sellingPrice);
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      throw new Error('Selling price must be greater than zero.');
    }

    const costPrice = Number(payload.costPrice || 0);
    if (isNaN(costPrice) || costPrice < 0) {
      throw new Error('Cost price cannot be negative.');
    }

    // Relationship check: sellingPrice must be >= costPrice according to PRD
    if (sellingPrice < costPrice) {
      throw new Error(
        `Selling price (₹${sellingPrice}) cannot be lower than cost price (₹${costPrice}). Items cannot be sold below cost.`
      );
    }

    // Ensure category exists for this stall
    const stallCats = storageService.getCategories(validId);
    if (!stallCats.some((c) => c.name.toLowerCase() === category.toLowerCase())) {
      const newCat = {
        id: `cat-${validId}-${Date.now()}`,
        stallId: validId,
        name: category,
        createdAt: new Date().toISOString(),
      };
      const allCats = storageService.getCategories();
      storageService.saveCategories([...allCats, newCat]);
    }

    const newItem = {
      id: `item-${validId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stallId: validId,
      name,
      category,
      description: String(payload.description || '').trim(),
      sellingPrice,
      costPrice,
      isAvailable: payload.isAvailable !== false,
      isArchived: false,
      isVeg: payload.isVeg !== false,
      imageUrl:
        String(payload.imageUrl || '').trim() ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allMenu = storageService.get('fooddesk_menu', []);
    storageService.saveMenu([...allMenu, newItem]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId, item: newItem } }));
    }

    return newItem;
  },

  /**
   * Edit an existing menu item, validating prices and preserving historical order snapshots.
   */
  updateMenuItem(stallId, itemId, payload) {
    const validId = this.validateStallAccess(stallId);
    const allMenu = storageService.get('fooddesk_menu', []);
    const itemIndex = allMenu.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error(`Menu item "${itemId}" not found.`);
    }

    const currentItem = allMenu[itemIndex];
    if (currentItem.stallId !== validId) {
      throw new Error(
        `Data Isolation Violation: Menu item "${itemId}" belongs to stall "${currentItem.stallId}", not "${validId}".`
      );
    }

    // Validation
    const name = payload.name !== undefined ? String(payload.name).trim() : currentItem.name;
    if (!name || name.length < 2) {
      throw new Error('Item name must be at least 2 characters.');
    }

    // Duplicate check if name changed
    if (name.toLowerCase() !== currentItem.name.toLowerCase()) {
      const existingItems = this.getAllMenuItems(validId);
      const duplicate = existingItems.find(
        (i) => i.id !== itemId && !i.isArchived && i.name.toLowerCase().trim() === name.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Another menu item named "${name}" already exists in this stall.`);
      }
    }

    const category = payload.category !== undefined ? String(payload.category).trim() : currentItem.category;
    if (!category) {
      throw new Error('Category is required.');
    }

    const sellingPrice =
      payload.sellingPrice !== undefined ? Number(payload.sellingPrice) : currentItem.sellingPrice;
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      throw new Error('Selling price must be greater than zero.');
    }

    const costPrice =
      payload.costPrice !== undefined ? Number(payload.costPrice) : (currentItem.costPrice ?? 0);
    if (isNaN(costPrice) || costPrice < 0) {
      throw new Error('Cost price cannot be negative.');
    }

    // Relationship check
    if (sellingPrice < costPrice) {
      throw new Error(
        `Selling price (₹${sellingPrice}) cannot be lower than cost price (₹${costPrice}). Items cannot be sold below cost.`
      );
    }

    const updatedItem = {
      ...currentItem,
      name,
      category,
      description: payload.description !== undefined ? String(payload.description).trim() : currentItem.description,
      sellingPrice,
      costPrice,
      isAvailable: payload.isAvailable !== undefined ? Boolean(payload.isAvailable) : currentItem.isAvailable,
      isVeg: payload.isVeg !== undefined ? Boolean(payload.isVeg) : currentItem.isVeg,
      imageUrl: payload.imageUrl !== undefined ? String(payload.imageUrl).trim() : currentItem.imageUrl,
      updatedAt: new Date().toISOString(),
    };

    allMenu[itemIndex] = updatedItem;
    storageService.saveMenu(allMenu);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId, item: updatedItem } }));
    }

    return updatedItem;
  },

  /**
   * Immediate availability toggle for each menu item (Available <-> Sold Out).
   */
  toggleItemAvailability(stallId, itemId, isAvailable) {
    const validId = this.validateStallAccess(stallId);
    const allMenu = storageService.get('fooddesk_menu', []);
    const itemIndex = allMenu.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error(`Menu item "${itemId}" not found.`);
    }

    const currentItem = allMenu[itemIndex];
    if (currentItem.stallId !== validId) {
      throw new Error(
        `Data Isolation Violation: Menu item "${itemId}" belongs to stall "${currentItem.stallId}", not "${validId}".`
      );
    }

    const newAvailability = isAvailable !== undefined ? Boolean(isAvailable) : !currentItem.isAvailable;
    const updatedItem = {
      ...currentItem,
      isAvailable: newAvailability,
      updatedAt: new Date().toISOString(),
    };

    allMenu[itemIndex] = updatedItem;
    storageService.saveMenu(allMenu);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId, item: updatedItem } }));
    }

    return updatedItem;
  },

  /**
   * Soft-delete / archive menu item (preserving historical order records and snapshots).
   */
  archiveMenuItem(stallId, itemId) {
    const validId = this.validateStallAccess(stallId);
    const allMenu = storageService.get('fooddesk_menu', []);
    const itemIndex = allMenu.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error(`Menu item "${itemId}" not found.`);
    }

    const currentItem = allMenu[itemIndex];
    if (currentItem.stallId !== validId) {
      throw new Error(
        `Data Isolation Violation: Menu item "${itemId}" belongs to stall "${currentItem.stallId}", not "${validId}".`
      );
    }

    const updatedItem = {
      ...currentItem,
      isArchived: true,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allMenu[itemIndex] = updatedItem;
    storageService.saveMenu(allMenu);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId, item: updatedItem } }));
    }

    return updatedItem;
  },

  /**
   * Restore an archived menu item back to active menu.
   */
  restoreMenuItem(stallId, itemId) {
    const validId = this.validateStallAccess(stallId);
    const allMenu = storageService.get('fooddesk_menu', []);
    const itemIndex = allMenu.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error(`Menu item "${itemId}" not found.`);
    }

    const currentItem = allMenu[itemIndex];
    if (currentItem.stallId !== validId) {
      throw new Error(
        `Data Isolation Violation: Menu item "${itemId}" belongs to stall "${currentItem.stallId}", not "${validId}".`
      );
    }

    const updatedItem = {
      ...currentItem,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };
    delete updatedItem.archivedAt;

    allMenu[itemIndex] = updatedItem;
    storageService.saveMenu(allMenu);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId, item: updatedItem } }));
    }

    return updatedItem;
  },

  /**
   * Permanent deletion with historical order protection.
   * Rejects deletion if item is referenced in any historical order snapshot.
   */
  deleteMenuItemPermanently(stallId, itemId) {
    const validId = this.validateStallAccess(stallId);
    const allMenu = storageService.get('fooddesk_menu', []);
    const targetItem = allMenu.find((i) => i.id === itemId && i.stallId === validId);

    if (!targetItem) {
      throw new Error(`Menu item "${itemId}" not found for stall "${validId}".`);
    }

    // Check historical orders across stall
    const stallOrders = storageService.getOrders(validId);
    const isReferencedInOrders = stallOrders.some((order) =>
      (order.items || []).some((it) => it.menuItemId === itemId || it.id === itemId)
    );

    if (isReferencedInOrders) {
      throw new Error(
        `Cannot permanently delete menu item "${targetItem.name}" because it is referenced in historical order records. Please use Archive instead to preserve historical accounting and receipt records.`
      );
    }

    const filteredMenu = allMenu.filter((i) => !(i.id === itemId && i.stallId === validId));
    storageService.saveMenu(filteredMenu);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fooddesk:menu_updated', { detail: { stallId: validId } }));
    }

    return { success: true, deletedId: itemId, name: targetItem.name };
  },

  /**
   * Retrieve orders scoped strictly to the stall, sorted newest first.
   */
  getOrders(stallId) {
    const validId = this.validateStallAccess(stallId);
    const orders = storageService.getOrders(validId);
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Retrieve a single order with strict stall ownership verification.
   * Throws an error if the order exists but belongs to a different stall.
   */
  getOrderById(stallId, orderId) {
    const validId = this.validateStallAccess(stallId);
    const allOrders = storageService.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return null;
    if (order.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Order ${orderId} does not belong to stall ${validId}.`);
    }
    return order;
  },

  /**
   * ==========================================
   * MODULE 6: KITCHEN DISPLAY SYSTEM (KDS)
   * ==========================================
   */

  /**
   * Retrieve active KDS orders scoped strictly to the stall, grouped by preparation stage.
   * Excludes cancelled orders from the kitchen workflow board.
   * Sorting rules:
   *  - Received: FIFO (oldest first - earliest order gets prepared first)
   *  - Preparing: FIFO (oldest first - longest cooking gets priority)
   *  - Ready: FIFO (oldest first - longest waiting for pickup)
   *  - Completed: LIFO (newest completed first - most recently served at top)
   */
  getKDSOrders(stallId) {
    const validId = this.validateStallAccess(stallId);
    const orders = storageService.getOrders(validId);

    const stages = {
      received: [],
      preparing: [],
      ready: [],
      completed: [],
    };

    orders.forEach((order) => {
      const status = (order.orderStatus || 'received').toLowerCase();
      if (stages[status]) {
        stages[status].push(order);
      }
    });

    // FIFO sort for active queues (oldest first)
    stages.received.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    stages.preparing.sort((a, b) => {
      const timeA = new Date(a.preparingAt || a.createdAt);
      const timeB = new Date(b.preparingAt || b.createdAt);
      return timeA - timeB;
    });
    stages.ready.sort((a, b) => {
      const timeA = new Date(a.readyAt || a.createdAt);
      const timeB = new Date(b.readyAt || b.createdAt);
      return timeA - timeB;
    });

    // LIFO sort for completed queue (newest completed first)
    stages.completed.sort((a, b) => {
      const timeA = new Date(a.completedAt || a.updatedAt || a.createdAt);
      const timeB = new Date(b.completedAt || b.updatedAt || b.createdAt);
      return timeB - timeA;
    });

    return stages;
  },

  /**
   * Transition an order between kitchen preparation stages with strict state-machine validation.
   * Enforces that:
   *  - Caller is authorized for this stall.
   *  - Order belongs to this stall (cross-stall mutation rejected).
   *  - Target transition is legally permitted according to the kitchen state machine.
   *  - Financial settlement status (paymentStatus) is STRICTLY UNMODIFIED.
   *  - Historical item snapshots, order numbers, and pickup tokens are PRESERVED.
   */
  updateOrderStatus(stallId, orderId, nextStatus) {
    const validId = this.validateStallAccess(stallId);

    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Order Status Update: Valid orderId is required.');
    }
    if (!nextStatus || typeof nextStatus !== 'string') {
      throw new Error('Order Status Update: Valid nextStatus is required.');
    }

    const targetStatus = nextStatus.trim().toLowerCase();
    const VALID_STAGES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!VALID_STAGES.includes(targetStatus)) {
      throw new Error(
        `Invalid Order Status: "${nextStatus}" is not a recognized kitchen stage. Allowed stages: [${VALID_STAGES.join(', ')}].`
      );
    }

    // Retrieve order with strict ownership validation (throws on cross-stall access)
    const order = this.getOrderById(validId, orderId);
    if (!order) {
      throw new Error(`Order Status Update: Order "${orderId}" not found for stall "${validId}".`);
    }

    const currentStatus = (order.orderStatus || 'received').toLowerCase();

    // Idempotent check
    if (currentStatus === targetStatus) {
      return order;
    }

    // State transition matrix
    const VALID_TRANSITIONS = {
      received: ['preparing', 'cancelled'],
      preparing: ['ready', 'received', 'cancelled'],
      ready: ['completed', 'preparing', 'cancelled'],
      completed: ['ready'], // operational undo / revert
      cancelled: [], // terminal
    };

    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      throw new Error(
        `Invalid Order Status Transition: Cannot move order "${order.orderNumber}" from "${currentStatus}" to "${targetStatus}". Permitted transitions: [${allowedNext.join(', ') || 'None (Terminal state)'}].`
      );
    }

    const nowIso = new Date().toISOString();
    const updatedOrder = {
      ...order,
      orderStatus: targetStatus,
      updatedAt: nowIso,
      // Record stage-entry timestamps without overwriting if already set
      preparingAt: targetStatus === 'preparing' ? (order.preparingAt || nowIso) : order.preparingAt,
      readyAt: targetStatus === 'ready' ? (order.readyAt || nowIso) : order.readyAt,
      completedAt: targetStatus === 'completed' ? (order.completedAt || nowIso) : order.completedAt,
    };

    // Guarantee that paymentStatus and financials remain untouched
    updatedOrder.paymentStatus = order.paymentStatus;
    updatedOrder.paymentMethod = order.paymentMethod;
    updatedOrder.paymentDetails = order.paymentDetails;
    updatedOrder.orderNumber = order.orderNumber;
    updatedOrder.pickupToken = order.pickupToken;
    updatedOrder.items = order.items;
    updatedOrder.financials = order.financials;

    const saved = storageService.updateOrder(updatedOrder);

    // Dispatch custom event for real-time reactive UI across application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fooddesk:order-status-updated', {
          detail: {
            order: saved,
            previousStatus: currentStatus,
            nextStatus: targetStatus,
            stallId: validId,
          },
        })
      );
    }

    return saved;
  },

  /**
   * ==========================================
   * MODULE 7: ORDER MANAGEMENT HUB
   * ==========================================
   */

  /**
   * Retrieve full details of an order including item snapshot, financials, and payment history.
   * Strictly enforces stall authorization and ownership.
   */
  getOrderDetails(stallId, orderId) {
    const validId = this.validateStallAccess(stallId);
    const order = this.getOrderById(validId, orderId);
    if (!order) {
      throw new Error(`Order Lookup: Order "${orderId}" not found for stall "${validId}".`);
    }

    const allPayments = storageService.getPayments(validId);
    const payments = allPayments.filter((p) => p.orderId === orderId);

    // Calculate collected and refunded balances across payment audit records
    const collectedPayments = payments.filter((p) => p.paymentStatus === 'paid' || p.paymentStatus === 'successful');
    const totalCollected = collectedPayments.length > 0
      ? collectedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
      : (order.paymentStatus === 'paid' || order.paymentStatus === 'successful' || order.paymentStatus === 'partially_refunded' || order.paymentStatus === 'refunded'
          ? Number(order.financials?.grandTotal ?? order.totalAmount ?? 0)
          : 0);

    const refundPayments = payments.filter((p) => p.paymentStatus === 'refunded' || p.paymentStatus === 'partially_refunded');
    const totalRefunded = refundPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0) || Number(order.totalRefundedAmount || 0);
    const remainingRefundable = Math.max(0, totalCollected - totalRefunded);

    return {
      order,
      payments,
      balances: {
        totalCollected,
        totalRefunded,
        remainingRefundable,
      },
    };
  },

  /**
   * Cancel an order with strict stall authorization and lifecycle checks.
   * Completed orders cannot be cancelled (food was already served).
   */
  cancelOrder(stallId, orderId, reason = 'Staff initiated cancellation') {
    const validId = this.validateStallAccess(stallId);
    const order = this.getOrderById(validId, orderId);

    if (order.orderStatus === 'cancelled') {
      throw new Error(`Order Cancellation: Order "${order.orderNumber}" is already cancelled.`);
    }
    if (order.orderStatus === 'completed') {
      throw new Error(
        `Order Cancellation: Order "${order.orderNumber}" is already completed and served to the customer. It cannot be cancelled.`
      );
    }

    const nowIso = new Date().toISOString();
    const updatedOrder = {
      ...order,
      orderStatus: 'cancelled',
      cancelledAt: nowIso,
      cancellationReason: (reason || 'Staff initiated cancellation').trim(),
      updatedAt: nowIso,
    };

    const saved = storageService.updateOrder(updatedOrder);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fooddesk:order-status-updated', {
          detail: {
            order: saved,
            previousStatus: order.orderStatus,
            nextStatus: 'cancelled',
            stallId: validId,
          },
        })
      );
    }

    return saved;
  },

  /**
   * Process a simulated refund for a paid order.
   * Full and partial refunds supported according to PRD:
   *  - Validates refund eligibility (order must be 'paid' or 'partially_refunded').
   *  - Rejects refunds exceeding the remaining refundable balance.
   *  - Supports multiple partial refunds until remaining balance reaches zero.
   *  - Persists individual audit record for every refund in fooddesk_payments.
   *  - Updates order-level paymentStatus to 'partially_refunded' or 'refunded'.
   *  - STRICT REQUIREMENT: Does NOT automatically modify orderStatus (kitchen status remains completely independent).
   *  - Preserves completed and served order history and all historical snapshots.
   */
  processRefund(stallId, orderId, options = {}) {
    const validId = this.validateStallAccess(stallId);
    const order = this.getOrderById(validId, orderId);

    // Retrieve all payment records for this order to calculate current balances
    const allPayments = storageService.getPayments(validId);
    const orderPayments = allPayments.filter((p) => p.orderId === orderId);

    const collectedPayments = orderPayments.filter((p) => p.paymentStatus === 'paid' || p.paymentStatus === 'successful');
    const totalCollected = collectedPayments.length > 0
      ? collectedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
      : (order.paymentStatus === 'paid' || order.paymentStatus === 'successful' || order.paymentStatus === 'partially_refunded' || order.paymentStatus === 'refunded'
          ? Number(order.financials?.grandTotal ?? order.totalAmount ?? 0)
          : 0);

    const existingRefundPayments = orderPayments.filter((p) => p.paymentStatus === 'refunded' || p.paymentStatus === 'partially_refunded');
    const totalRefundedSoFar = existingRefundPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0) || Number(order.totalRefundedAmount || 0);
    const remainingRefundable = Math.max(0, totalCollected - totalRefundedSoFar);

    // Check payment eligibility
    if (order.paymentStatus === 'refunded') {
      throw new Error(
        `Refund Rejected: Order "${order.orderNumber}" has already been fully refunded. Remaining refundable balance is ₹0.`
      );
    }

    const isEligible = order.paymentStatus === 'paid' || order.paymentStatus === 'successful' || order.paymentStatus === 'partially_refunded';
    if (!isEligible || totalCollected <= 0) {
      throw new Error(
        `Refund Rejected: Order "${order.orderNumber}" is unpaid (status: "${order.paymentStatus}"). Only confirmed paid orders are eligible for refund.`
      );
    }

    if (remainingRefundable <= 0) {
      throw new Error(
        `Refund Rejected: Order "${order.orderNumber}" has already been fully refunded. Remaining refundable balance is ₹0.`
      );
    }

    const requestedAmount = options.amount !== undefined ? Number(options.amount) : remainingRefundable;

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      throw new Error(`Refund Rejected: Invalid refund amount: ${requestedAmount}.`);
    }
    if (requestedAmount > remainingRefundable) {
      throw new Error(
        `Refund Rejected: Refund amount (₹${requestedAmount}) exceeds remaining refundable balance (₹${remainingRefundable}). Total collected: ₹${totalCollected}, already refunded: ₹${totalRefundedSoFar}.`
      );
    }

    const newCumulativeRefunded = totalRefundedSoFar + requestedAmount;
    const newRemainingBalance = Math.max(0, totalCollected - newCumulativeRefunded);
    const nextPaymentStatus = newRemainingBalance <= 0 ? 'refunded' : 'partially_refunded';

    const refundReason = (options.reason || 'Customer requested refund').trim();
    const nowIso = new Date().toISOString();
    const session = storageService.getSession();

    // 1. Record individual refund transaction in fooddesk_payments
    const refundRecord = {
      id: `ref-${validId.replace('stall-', 's')}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      stallId: validId,
      amount: requestedAmount,
      paymentStatus: nextPaymentStatus,
      paymentMethod: order.paymentMethod || 'cash',
      paymentDetails: {
        refundReason,
        originalTransactionRef: order.paymentDetails?.transactionRef || '',
        notes: options.notes || '',
        refundedAt: nowIso,
        refundedBy: session?.user?.name || 'Counter Staff',
        cumulativeRefunded: newCumulativeRefunded,
        remainingRefundable: newRemainingBalance,
        isPartial: newRemainingBalance > 0,
        isSimulation: true,
      },
      createdAt: nowIso,
    };
    storageService.recordPayment(refundRecord);

    // 2. Update order-level payment fields WITHOUT touching orderStatus
    const updatedOrder = {
      ...order,
      paymentStatus: nextPaymentStatus,
      refundedAt: nowIso,
      refundReason,
      refundAmount: requestedAmount,
      totalRefundedAmount: newCumulativeRefunded,
      remainingRefundableAmount: newRemainingBalance,
      // CRITICAL: orderStatus is strictly preserved and never automatically modified
      orderStatus: order.orderStatus,
      updatedAt: nowIso,
    };

    const saved = storageService.updateOrder(updatedOrder);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fooddesk:payment-completed', {
          detail: {
            order: saved,
            paymentStatus: nextPaymentStatus,
            stallId: validId,
            refundRecord,
          },
        })
      );
    }

    return {
      order: saved,
      refundRecord,
      balances: {
        totalCollected,
        totalRefunded: newCumulativeRefunded,
        remainingRefundable: newRemainingBalance,
      },
    };
  },

  /**
   * Preview the upcoming sequential order number and pickup token for the stall.
   */
  previewNextOrder(stallId) {
    const validId = this.validateStallAccess(stallId);
    const dateStr = getTodayKolkataDateString();
    const orders = storageService.getOrders(validId);
    const prefix = `ORD-${dateStr}-`;

    let maxSeq = 0;
    let maxToken = 0;
    orders.forEach((o) => {
      if (o.orderNumber && o.orderNumber.startsWith(prefix)) {
        const parts = o.orderNumber.split('-');
        const seqNum = parseInt(parts[2], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
        if (typeof o.pickupToken === 'number' && o.pickupToken > maxToken) maxToken = o.pickupToken;
      }
    });

    const atomicKey = `fooddesk_seq_${validId}_${dateStr}`;
    const tokenKey = `fooddesk_token_${validId}_${dateStr}`;
    const storedCounter = parseInt(localStorage.getItem(atomicKey) || '0', 10);
    const storedToken = parseInt(localStorage.getItem(tokenKey) || '0', 10);

    const nextSeq = Math.max(maxSeq, storedCounter) + 1;
    const nextToken = Math.max(maxToken, storedToken) + 1;

    return {
      dateStr,
      nextOrderNumber: `ORD-${dateStr}-${String(nextSeq).padStart(4, '0')}`,
      nextPickupToken: nextToken,
    };
  },

  /**
   * Create and record a walk-in counter order with strict stall authorization,
   * atomic sequential numbering, cross-tab mutual exclusion, and deep item snapshots.
   */
  async createOrder(stallId, orderPayload) {
    const validId = this.validateStallAccess(stallId);

    if (!orderPayload || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      throw new Error('Order creation rejected: Cart must contain at least one item.');
    }

    // Verify all items belong to this stall and are available (Pre-lock validation prevents sequence waste)
    const stallMenu = this.getMenu(validId);
    const menuMap = new Map(stallMenu.map((m) => [m.id, m]));

    let calculatedSubtotal = 0;
    let calculatedCOGS = 0;

    const snapshottedItems = orderPayload.items.map((cartItem) => {
      const menuItem = menuMap.get(cartItem.id || cartItem.menuItemId);
      if (!menuItem) {
        throw new Error(
          `Data Isolation Violation: Menu item "${cartItem.name || cartItem.id}" does not belong to stall "${validId}".`
        );
      }
      if (menuItem.isAvailable === false) {
        throw new Error(`Cannot order sold-out item: "${menuItem.name}".`);
      }

      const qty = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
      const sellingPrice = Number(menuItem.sellingPrice);
      const costPrice = Number(menuItem.costPrice || 0);
      const itemTotal = sellingPrice * qty;

      calculatedSubtotal += itemTotal;
      calculatedCOGS += costPrice * qty;

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        sellingPrice,
        costPrice,
        quantity: qty,
        itemTotal,
        imageUrl: menuItem.imageUrl || '',
      };
    });

    // Discount calculations
    const discountType = orderPayload.discountType || 'none'; // 'none' | 'percentage' | 'fixed'
    let discountAmount = 0;
    const discountValue = Math.max(0, Number(orderPayload.discountValue) || 0);

    if (discountType === 'percentage') {
      discountAmount = Math.round((calculatedSubtotal * Math.min(100, discountValue)) / 100);
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(calculatedSubtotal, discountValue);
    }

    const grandTotal = Math.max(0, calculatedSubtotal - discountAmount);

    // Cross-tab safe sequence allocation and order persistence
    return await storageService.withStallLock(validId, async () => {
      // Date-aware atomic sequential numbering (evaluated inside the lock)
      const dateStr = getTodayKolkataDateString();
      const nextSeq = storageService.getNextOrderSequence(validId, dateStr);
      const nextToken = storageService.getNextPickupToken(validId, dateStr);
      const orderNumber = `ORD-${dateStr}-${String(nextSeq).padStart(4, '0')}`;

      const session = storageService.getSession();
      const uuidEntropy = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 9);
      const orderId = `ord-${validId.replace('stall-', 's')}-${Date.now()}-${uuidEntropy}`;

      const newOrder = {
        id: orderId,
        stallId: validId,
        orderNumber,
        pickupToken: nextToken,
        customerMobile: (orderPayload.customerMobile || '').trim(),
        customerNotes: (orderPayload.customerNotes || '').trim(),
        orderType: 'walk_in',
        items: snapshottedItems,
        financials: {
          subtotal: calculatedSubtotal,
          discountType,
          discountValue,
          discountAmount,
          grandTotal,
          totalCostOfGoodsSold: calculatedCOGS,
        },
        orderStatus: 'received',
        paymentStatus: 'pending', // Payment processing belongs to Module 5
        paymentMethod: orderPayload.paymentMethod || 'cash',
        createdAt: new Date().toISOString(),
        createdBy: session?.user?.name || session?.user?.email || 'Counter Staff',
      };

      const savedOrder = storageService.createOrder(newOrder);

      // Notify listeners for reactive dashboard/analytics updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fooddesk:order-created', { detail: savedOrder }));
      }

      return savedOrder;
    });
  },

  // ==========================================
  // MODULE 9A: EXPENSE MANAGEMENT
  // ==========================================
  /**
   * Retrieve operational expenses scoped strictly to the stall.
   * Enriches category names and ensures audit trail arrays are present.
   */
  getExpenses(stallId) {
    const validId = this.validateStallAccess(stallId);
    const raw = storageService.getExpenses(validId);
    return raw
      .filter((e) => !e.isDeleted)
      .map((e) => ({
        ...e,
        category: normalizeExpenseCategory(e.category),
        auditTrail: Array.isArray(e.auditTrail) && e.auditTrail.length > 0
          ? e.auditTrail
          : [
              {
                action: 'created',
                timestamp: e.date || e.createdAt || new Date().toISOString(),
                user: e.recordedBy || 'Stall Owner',
                details: 'Initial expense entry',
              },
            ],
      }))
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  },

  getExpenseById(stallId, expenseId) {
    const validId = this.validateStallAccess(stallId);
    const expenses = this.getExpenses(validId);
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) {
      throw new Error(`Expense "${expenseId}" not found for stall "${validId}".`);
    }
    if (expense.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Expense "${expenseId}" belongs to stall "${expense.stallId}", not "${validId}".`);
    }
    return expense;
  },

  createExpense(stallId, expenseData) {
    const validId = this.validateStallAccess(stallId);

    if (!expenseData) {
      throw new Error('stallDataService: Invalid expense payload.');
    }

    const category = normalizeExpenseCategory(expenseData.category);
    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      throw new Error(`Invalid expense category "${expenseData.category}". Must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`);
    }

    const description = (expenseData.description || '').trim();
    if (!description || description.length < 2) {
      throw new Error('Expense description is required (at least 2 characters).');
    }

    const amount = Number(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be a valid number greater than zero.');
    }

    const date = expenseData.date ? String(expenseData.date).trim() : getKolkataDateOnlyString(new Date());
    if (!date) {
      throw new Error('Expense date is required.');
    }

    const session = storageService.getSession();
    const userName = session?.user?.name || 'Stall Owner';

    const newExpense = {
      id: `exp-${validId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stallId: validId,
      category,
      description,
      amount,
      date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userName,
      updatedBy: userName,
      auditTrail: [
        {
          action: 'created',
          timestamp: new Date().toISOString(),
          user: userName,
          details: `Initial expense recorded: ₹${amount} under ${category}`,
        },
      ],
    };

    const allExpenses = storageService.get('fooddesk_expenses', []);
    storageService.saveExpenses([newExpense, ...allExpenses]);
    return newExpense;
  },

  updateExpense(stallId, expenseId, updatedData, changeReason = '') {
    const validId = this.validateStallAccess(stallId);
    const allExpenses = storageService.get('fooddesk_expenses', []);
    const index = allExpenses.findIndex((e) => e.id === expenseId);

    if (index === -1) {
      throw new Error(`Expense "${expenseId}" not found.`);
    }

    const existing = allExpenses[index];
    if (existing.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Expense "${expenseId}" belongs to stall "${existing.stallId}", not "${validId}".`);
    }

    const category = normalizeExpenseCategory(updatedData.category || existing.category);
    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      throw new Error(`Invalid expense category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`);
    }

    const description = (updatedData.description ?? existing.description).trim();
    if (!description || description.length < 2) {
      throw new Error('Expense description is required (at least 2 characters).');
    }

    const amount = Number(updatedData.amount ?? existing.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be a valid number greater than zero.');
    }

    const date = updatedData.date ? String(updatedData.date).trim() : existing.date;
    if (!date) {
      throw new Error('Expense date is required.');
    }

    const session = storageService.getSession();
    const userName = session?.user?.name || 'Stall Owner';

    const previousSnapshot = {
      category: normalizeExpenseCategory(existing.category),
      description: existing.description,
      amount: existing.amount,
      date: existing.date,
    };

    const updatedSnapshot = {
      category,
      description,
      amount,
      date,
    };

    const auditEntry = {
      action: 'edited',
      timestamp: new Date().toISOString(),
      user: userName,
      reason: (changeReason || 'Expense details updated').trim(),
      previous: previousSnapshot,
      updated: updatedSnapshot,
    };

    const updatedExpense = {
      ...existing,
      category,
      description,
      amount,
      date,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
      auditTrail: [...(existing.auditTrail || []), auditEntry],
    };

    allExpenses[index] = updatedExpense;
    storageService.saveExpenses(allExpenses);
    return updatedExpense;
  },

  deleteExpense(stallId, expenseId, reason = '') {
    const validId = this.validateStallAccess(stallId);
    const allExpenses = storageService.get('fooddesk_expenses', []);
    const index = allExpenses.findIndex((e) => e.id === expenseId);

    if (index === -1) {
      throw new Error(`Expense "${expenseId}" not found.`);
    }

    const existing = allExpenses[index];
    if (existing.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Expense "${expenseId}" belongs to stall "${existing.stallId}", not "${validId}".`);
    }

    const session = storageService.getSession();
    const userName = session?.user?.name || 'Stall Owner';

    // Soft delete to preserve full historical audit trail
    allExpenses[index] = {
      ...existing,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userName,
      deleteReason: (reason || 'Deleted by stall owner').trim(),
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          action: 'deleted',
          timestamp: new Date().toISOString(),
          user: userName,
          reason: (reason || 'Deleted by stall owner').trim(),
        },
      ],
    };

    storageService.saveExpenses(allExpenses);
    storageService.addExpenseAuditLog({
      id: `audit-${Date.now()}`,
      stallId: validId,
      expenseId,
      action: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: userName,
      reason: (reason || 'Deleted by stall owner').trim(),
    });

    return true;
  },

  getExpenseSummary(stallId) {
    const validId = this.validateStallAccess(stallId);
    const expenses = this.getExpenses(validId);

    // Business date boundary: Asia/Kolkata
    const todayStr = getKolkataDateOnlyString(new Date());
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    let todayTotal = 0;
    let monthTotal = 0;
    let totalExpenses = 0;

    const categorySums = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      categorySums[cat] = { total: 0, count: 0 };
    });

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      const expenseDateStr = getKolkataDateOnlyString(e.date || e.createdAt);

      totalExpenses += amt;

      if (expenseDateStr === todayStr) {
        todayTotal += amt;
      }

      if (expenseDateStr && expenseDateStr.startsWith(currentMonthPrefix)) {
        monthTotal += amt;
      }

      const cat = normalizeExpenseCategory(e.category);
      if (!categorySums[cat]) {
        categorySums[cat] = { total: 0, count: 0 };
      }
      categorySums[cat].total += amt;
      categorySums[cat].count += 1;
    });

    let topCategory = { name: 'None', amount: 0 };
    Object.entries(categorySums).forEach(([cat, data]) => {
      if (data.total > topCategory.amount) {
        topCategory = { name: cat, amount: data.total };
      }
    });

    const categoryBreakdown = Object.entries(categorySums)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      stallId: validId,
      todayTotal,
      monthTotal,
      topCategory,
      totalExpenses,
      categoryBreakdown,
      expenseCount: expenses.length,
    };
  },

  // ==========================================
  // MODULE 9B: INVENTORY & STOCK MANAGEMENT
  // ==========================================
  getInventory(stallId) {
    const validId = this.validateStallAccess(stallId);
    const raw = storageService.getInventory(validId);
    return raw.map((item) => ({
      ...item,
      currentStock: Number(item.currentStock) || 0,
      minThreshold: Number(item.minThreshold) || 0,
      status: getInventoryStatus(item.currentStock, item.minThreshold),
    }));
  },

  getInventoryItemById(stallId, itemId) {
    const validId = this.validateStallAccess(stallId);
    const items = this.getInventory(validId);
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`Inventory item "${itemId}" not found for stall "${validId}".`);
    }
    if (item.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Inventory item "${itemId}" belongs to stall "${item.stallId}", not "${validId}".`);
    }
    return item;
  },

  createInventoryItem(stallId, itemData) {
    const validId = this.validateStallAccess(stallId);

    if (!itemData) {
      throw new Error('stallDataService: Invalid inventory item payload.');
    }

    const name = (itemData.name || '').trim();
    if (!name || name.length < 2) {
      throw new Error('Ingredient name is required (at least 2 characters).');
    }

    // Duplicate check within stall (case-insensitive)
    const existingItems = this.getInventory(validId);
    const duplicate = existingItems.find(
      (i) => i.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Duplicate Ingredient: An ingredient named "${name}" already exists for stall "${validId}".`);
    }

    const unit = (itemData.unit || '').trim().toLowerCase();
    if (!INVENTORY_UNITS.includes(unit)) {
      throw new Error(`Invalid unit "${itemData.unit}". Must be one of: ${INVENTORY_UNITS.join(', ')}.`);
    }

    const currentStock = Number(itemData.initialStock ?? itemData.currentStock ?? 0);
    if (isNaN(currentStock) || currentStock < 0) {
      throw new Error('Initial stock quantity cannot be negative.');
    }

    const minThreshold = Number(itemData.minThreshold ?? 0);
    if (isNaN(minThreshold) || minThreshold < 0) {
      throw new Error('Minimum stock threshold cannot be negative.');
    }

    const session = storageService.getSession();
    const userName = session?.user?.name || 'Stall Owner';

    const newItem = {
      id: `inv-${validId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stallId: validId,
      name,
      description: (itemData.description || '').trim(),
      unit,
      currentStock,
      minThreshold,
      costPerUnit: Number(itemData.costPerUnit) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allInventory = storageService.get('fooddesk_inventory', []);
    storageService.saveInventory([newItem, ...allInventory]);

    // Record initial stock movement
    if (currentStock > 0) {
      storageService.addStockMovement({
        id: `mov-${validId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        inventoryItemId: newItem.id,
        ingredientName: newItem.name,
        stallId: validId,
        type: 'initial',
        quantityChanged: currentStock,
        previousQuantity: 0,
        newQuantity: currentStock,
        unit,
        reason: 'Initial stock intake upon item creation',
        notes: (itemData.notes || '').trim(),
        timestamp: new Date().toISOString(),
        user: userName,
      });
    }

    return {
      ...newItem,
      status: getInventoryStatus(newItem.currentStock, newItem.minThreshold),
    };
  },

  updateInventoryItem(stallId, itemId, updatedData) {
    const validId = this.validateStallAccess(stallId);
    const allInventory = storageService.get('fooddesk_inventory', []);
    const index = allInventory.findIndex((i) => i.id === itemId);

    if (index === -1) {
      throw new Error(`Inventory item "${itemId}" not found.`);
    }

    const existing = allInventory[index];
    if (existing.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Inventory item "${itemId}" belongs to stall "${existing.stallId}", not "${validId}".`);
    }

    const name = (updatedData.name ?? existing.name).trim();
    if (!name || name.length < 2) {
      throw new Error('Ingredient name is required (at least 2 characters).');
    }

    // Check duplicate name within stall if name changed
    if (name.toLowerCase() !== existing.name.trim().toLowerCase()) {
      const duplicate = allInventory.find(
        (i) => i.stallId === validId && i.id !== itemId && i.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Duplicate Ingredient: An ingredient named "${name}" already exists for stall "${validId}".`);
      }
    }

    const unit = (updatedData.unit ?? existing.unit).trim().toLowerCase();
    if (!INVENTORY_UNITS.includes(unit)) {
      throw new Error(`Invalid unit "${updatedData.unit}". Must be one of: ${INVENTORY_UNITS.join(', ')}.`);
    }

    const minThreshold = Number(updatedData.minThreshold ?? existing.minThreshold);
    if (isNaN(minThreshold) || minThreshold < 0) {
      throw new Error('Minimum stock threshold cannot be negative.');
    }

    // CRITICAL: Preserve currentStock - stock changes must use adjustStock workflow!
    const updatedItem = {
      ...existing,
      name,
      description: (updatedData.description ?? existing.description ?? '').trim(),
      unit,
      minThreshold,
      costPerUnit: updatedData.costPerUnit !== undefined ? Number(updatedData.costPerUnit) : (existing.costPerUnit ?? 0),
      currentStock: existing.currentStock, // strictly preserved
      updatedAt: new Date().toISOString(),
    };

    allInventory[index] = updatedItem;
    storageService.saveInventory(allInventory);

    return {
      ...updatedItem,
      status: getInventoryStatus(updatedItem.currentStock, updatedItem.minThreshold),
    };
  },

  adjustStock(stallId, itemId, { type, quantity, reason, notes = '' }) {
    const validId = this.validateStallAccess(stallId);
    const allInventory = storageService.get('fooddesk_inventory', []);
    const index = allInventory.findIndex((i) => i.id === itemId);

    if (index === -1) {
      throw new Error(`Inventory item "${itemId}" not found.`);
    }

    const existing = allInventory[index];
    if (existing.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Inventory item "${itemId}" belongs to stall "${existing.stallId}", not "${validId}".`);
    }

    if (type !== 'add' && type !== 'reduce') {
      throw new Error('Adjustment type must be either "add" or "reduce".');
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      throw new Error('Adjustment quantity must be a valid number greater than zero.');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Adjustment reason is mandatory.');
    }

    const prevStock = Number(existing.currentStock) || 0;
    const newStock = type === 'add' ? prevStock + numQty : prevStock - numQty;

    if (newStock < 0) {
      throw new Error(
        `Insufficient stock: Cannot reduce ${numQty} ${existing.unit}. Current stock is ${prevStock} ${existing.unit}. Stock cannot become negative.`
      );
    }

    const session = storageService.getSession();
    const userName = session?.user?.name || 'Stall Owner';

    const movement = {
      id: `mov-${validId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      inventoryItemId: existing.id,
      ingredientName: existing.name,
      stallId: validId,
      type,
      quantityChanged: type === 'add' ? numQty : -numQty,
      previousQuantity: prevStock,
      newQuantity: newStock,
      unit: existing.unit,
      reason: reason.trim(),
      notes: (notes || '').trim(),
      timestamp: new Date().toISOString(),
      user: userName,
    };

    const updatedItem = {
      ...existing,
      currentStock: newStock,
      updatedAt: new Date().toISOString(),
    };

    allInventory[index] = updatedItem;
    storageService.saveInventory(allInventory);
    storageService.addStockMovement(movement);

    return {
      item: {
        ...updatedItem,
        status: getInventoryStatus(updatedItem.currentStock, updatedItem.minThreshold),
      },
      movement,
    };
  },

  recordWastage(stallId, itemId, { quantity, wastageReason, notes = '', date }) {
    const validId = this.validateStallAccess(stallId);
    const allInventory = storageService.get('fooddesk_inventory', []);
    const index = allInventory.findIndex((i) => i.id === itemId);

    if (index === -1) {
      throw new Error(`Inventory item "${itemId}" not found.`);
    }

    const existing = allInventory[index];
    if (existing.stallId !== validId) {
      throw new Error(`Data Isolation Violation: Inventory item "${itemId}" belongs to stall "${existing.stallId}", not "${validId}".`);
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      throw new Error('Wastage quantity must be a valid number greater than zero.');
    }

    if (!wastageReason || !wastageReason.trim()) {
      throw new Error('Wastage reason is mandatory.');
    }

    const prevStock = Number(existing.currentStock) || 0;
    if (numQty > prevStock) {
      throw new Error(
        `Wastage quantity (${numQty} ${existing.unit}) cannot exceed available stock (${prevStock} ${existing.unit}).`
      );
    }

    const newStock = prevStock - numQty;
    const session = storageService.getSession();
    const userName = session?.user?.name || 'Stall Owner';

    const movement = {
      id: `wst-${validId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      inventoryItemId: existing.id,
      ingredientName: existing.name,
      stallId: validId,
      type: 'wastage',
      wastageReason: wastageReason.trim(),
      quantityChanged: -numQty,
      previousQuantity: prevStock,
      newQuantity: newStock,
      unit: existing.unit,
      reason: `Wastage: ${wastageReason.trim()}${notes ? ` - ${notes.trim()}` : ''}`,
      notes: (notes || '').trim(),
      timestamp: date || new Date().toISOString(),
      user: userName,
    };

    const updatedItem = {
      ...existing,
      currentStock: newStock,
      updatedAt: new Date().toISOString(),
    };

    allInventory[index] = updatedItem;
    storageService.saveInventory(allInventory);
    storageService.addStockMovement(movement);

    return {
      item: {
        ...updatedItem,
        status: getInventoryStatus(updatedItem.currentStock, updatedItem.minThreshold),
      },
      movement,
    };
  },

  getStockMovements(stallId, itemId = null) {
    const validId = this.validateStallAccess(stallId);
    const movements = storageService.getStockMovements(validId);
    const filtered = itemId ? movements.filter((m) => m.inventoryItemId === itemId) : movements;
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getWastageHistory(stallId) {
    const validId = this.validateStallAccess(stallId);
    const movements = storageService.getStockMovements(validId);
    return movements
      .filter((m) => m.type === 'wastage')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getLowStockIngredients(stallId) {
    const validId = this.validateStallAccess(stallId);
    const inventory = this.getInventory(validId);
    return inventory
      .filter((item) => item.currentStock <= item.minThreshold)
      .sort((a, b) => {
        // Out of stock (0) first, then lowest stock relative to threshold
        if (a.currentStock === 0 && b.currentStock > 0) return -1;
        if (b.currentStock === 0 && a.currentStock > 0) return 1;
        return a.currentStock - b.currentStock;
      });
  },

  /**
   * Retrieve support tickets submitted for the stall.
   */
  getTickets(stallId) {
    const validId = this.validateStallAccess(stallId);
    return storageService.getTickets(validId);
  },

  /**
   * Dynamically calculate aggregate business and financial metrics scoped strictly to this stall.
   */
  getStallSummary(stallId) {
    const validId = this.validateStallAccess(stallId);
    const menu = this.getMenu(validId);
    const orders = this.getOrders(validId);
    const expenses = this.getExpenses(validId);
    const inventory = this.getInventory(validId);
    const lowStockItems = this.getLowStockIngredients(validId);

    // Filter completed or active orders
    const validOrders = orders.filter((o) => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return status !== 'cancelled';
    });

    const grossSales = validOrders.reduce((acc, o) => {
      const amount = o.financials?.grandTotal ?? o.totalAmount ?? o.financials?.subtotal ?? 0;
      return acc + (Number(amount) || 0);
    }, 0);

    const totalDiscounts = validOrders.reduce((acc, o) => {
      const discount = o.financials?.discountAmount ?? o.discountAmount ?? 0;
      return acc + (Number(discount) || 0);
    }, 0);

    const netRevenue = grossSales;

    // Calculate COGS from ordered items snapshots or order.financials.totalCostOfGoodsSold
    let estimatedCOGS = 0;
    validOrders.forEach((order) => {
      if (order.financials?.totalCostOfGoodsSold) {
        estimatedCOGS += Number(order.financials.totalCostOfGoodsSold) || 0;
      } else if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const cost = Number(item.costPrice) || 0;
          const qty = Number(item.quantity) || 1;
          estimatedCOGS += cost * qty;
        });
      }
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const grossProfit = netRevenue - estimatedCOGS;
    const netProfit = grossProfit - totalExpenses;

    const activeOrdersCount = orders.filter((o) => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return ['received', 'preparing', 'ready'].includes(status);
    }).length;

    const completedOrdersCount = orders.filter((o) => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return status === 'completed';
    }).length;

    const upiOrders = validOrders.filter((o) => (o.paymentMethod || '').toLowerCase().includes('upi')).length;
    const cashOrders = validOrders.filter((o) => (o.paymentMethod || '').toLowerCase().includes('cash')).length;

    const successfulPayments = validOrders.filter((o) => {
      const payStatus = (o.paymentStatus || '').toLowerCase();
      return ['successful', 'completed', 'paid'].includes(payStatus);
    }).length;

    const paymentVerificationRate = validOrders.length > 0
      ? Math.round((successfulPayments / validOrders.length) * 100)
      : 100;

    return {
      stallId: validId,
      menuCount: menu.length,
      totalOrdersCount: orders.length,
      activeOrdersCount,
      completedOrdersCount,
      grossSales,
      netRevenue,
      totalExpenses,
      estimatedCOGS,
      grossProfit,
      netProfit,
      lowStockCount: lowStockItems.length,
      upiOrdersCount: upiOrders,
      cashOrdersCount: cashOrders,
      paymentVerificationRate: validOrders.length > 0
        ? Math.round((successfulPayments / validOrders.length) * 100)
        : 100,
    };
  },

  // ==========================================
  // MODULE 5: PAYMENT PROCESSING & RECEIPTS
  // ==========================================

  /**
   * Retrieve payment transaction records strictly scoped to this stall.
   */
  getPayments(stallId) {
    const validId = this.validateStallAccess(stallId);
    return storageService.getPayments(validId);
  },

  /**
   * Retrieve a payment record by orderId with stall ownership verification.
   */
  getPaymentByOrderId(stallId, orderId) {
    const validId = this.validateStallAccess(stallId);
    const order = storageService.getOrders(validId).find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order "${orderId}" not found for stall "${validId}".`);
    }
    return storageService.getPaymentByOrderId(orderId);
  },

  /**
   * Record a simulated payment transaction for an existing POS order.
   *
   * Business Rules & Safeguards:
   * 1. Requires authenticated access to stallId.
   * 2. Order must exist and belong to stallId.
   * 3. Prevents duplicate payments on already paid orders.
   * 4. Enforces tender validation (cash tendered >= total, 12-digit UTR, split balance).
   * 5. Clear status machine: 'pending', 'processing', 'paid', 'failed'.
   * 6. Marks all records with `isDemoSimulation: true`.
   */
  async recordPayment(stallId, paymentPayload) {
    const validId = this.validateStallAccess(stallId);

    if (!paymentPayload || !paymentPayload.orderId) {
      throw new Error('recordPayment: orderId is required.');
    }

    const order = storageService.getOrders(validId).find((o) => o.id === paymentPayload.orderId);
    if (!order) {
      throw new Error(
        `Data Isolation Violation: Order "${paymentPayload.orderId}" does not exist for stall "${validId}".`
      );
    }

    const grandTotal = Number(order.financials?.grandTotal ?? order.totalAmount ?? 0);

    // Guard: Prevent duplicate payments on already paid orders
    const isAlreadyPaid =
      order.paymentStatus === 'paid' ||
      order.paymentStatus === 'successful' ||
      order.paymentStatus === 'completed';

    if (isAlreadyPaid && paymentPayload.status !== 'failed') {
      throw new Error(
        `Duplicate Payment: Order "${order.orderNumber}" is already paid in full. Duplicate payment rejected.`
      );
    }

    const method = paymentPayload.method || 'cash'; // 'cash' | 'upi_gateway' | 'upi_static_qr' | 'split_cash_upi'
    const status = paymentPayload.status === 'failed' ? 'failed' : 'paid';

    let paymentDetails = {};

    // Validate Tender Details if status is 'paid'
    if (status === 'paid') {
      if (method === 'cash') {
        const cashTendered = Number(paymentPayload.cashTendered) || 0;
        if (cashTendered < grandTotal) {
          throw new Error(
            `Insufficient Cash Tendered: Received ₹${cashTendered}, but order total is ₹${grandTotal}.`
          );
        }
        const changeReturned = Math.max(0, cashTendered - grandTotal);
        paymentDetails = {
          transactionRef: `CASH-${Date.now().toString().slice(-6)}`,
          cashTendered,
          changeReturned,
          tenderType: 'Cash Tender',
          verifiedAt: new Date().toISOString(),
        };
      } else if (method === 'upi_gateway') {
        // Dynamic UPI QR simulation
        paymentDetails = {
          transactionRef: paymentPayload.transactionRef || `UPI-GATEWAY-${Date.now().toString().slice(-6)}`,
          upiId: paymentPayload.upiId || 'fastfood@okhdfcbank',
          tenderType: 'Dynamic UPI QR',
          verifiedAt: new Date().toISOString(),
        };
      } else if (method === 'upi_static_qr') {
        // Static UPI QR simulation with 12-digit UTR audit
        const utr = (paymentPayload.utrNumber || '').trim();
        if (!/^\d{12}$/.test(utr)) {
          throw new Error('Invalid UTR: Bank reference number must be exactly 12 numeric digits.');
        }
        paymentDetails = {
          transactionRef: `UTR-${utr}`,
          utrNumber: utr,
          tenderType: 'Static UPI QR (Audited)',
          verifiedAt: new Date().toISOString(),
        };
      } else if (method === 'split_cash_upi') {
        // Split Tender: Cash + UPI
        const cashAmount = Number(paymentPayload.cashAmount) || 0;
        const upiAmount = Number(paymentPayload.upiAmount) || 0;
        const cashTendered = Number(paymentPayload.cashTendered) || cashAmount;

        if (Math.round(cashAmount + upiAmount) !== Math.round(grandTotal)) {
          throw new Error(
            `Split Tender Mismatch: Cash (₹${cashAmount}) + UPI (₹${upiAmount}) must equal Grand Total (₹${grandTotal}).`
          );
        }
        if (cashTendered < cashAmount) {
          throw new Error(`Insufficient Cash for split portion: Received ₹${cashTendered}, needed ₹${cashAmount}.`);
        }

        paymentDetails = {
          transactionRef: `SPLIT-${Date.now().toString().slice(-6)}`,
          tenderType: 'Split Tender (Cash + UPI)',
          cashAmount,
          upiAmount,
          cashTendered,
          changeReturned: Math.max(0, cashTendered - cashAmount),
          utrNumber: paymentPayload.utrNumber || '123456789012',
          verifiedAt: new Date().toISOString(),
        };
      }
    } else {
      // Payment Failed Scenario
      paymentDetails = {
        failureReason: paymentPayload.failureReason || 'Simulated Customer UPI Payment Failed / Timed Out',
        attemptedAt: new Date().toISOString(),
        tenderType: method,
      };
    }

    return await storageService.withStallLock(validId, async () => {
      const session = storageService.getSession();
      const uuidEntropy = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 9);
      const paymentId = `pay-${validId.replace('stall-', 's')}-${Date.now()}-${uuidEntropy}`;

      const paymentRecord = {
        id: paymentId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        stallId: validId,
        amount: grandTotal,
        paymentMethod: method,
        paymentStatus: status,
        paymentDetails,
        createdAt: new Date().toISOString(),
        verifiedAt: status === 'paid' ? new Date().toISOString() : null,
        collectedBy: session?.user?.name || session?.user?.email || 'Counter Staff',
        isDemoSimulation: true,
      };

      const savedPayment = storageService.recordPayment(paymentRecord);

      // Dispatch global payment event for reactive table / UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fooddesk:payment-completed', { detail: savedPayment })
        );
      }

      return savedPayment;
    });
  },

  /**
   * Retrieve structured data for 80mm Digital Thermal Receipt rendering.
   */
  getReceiptData(stallId, orderId) {
    const validId = this.validateStallAccess(stallId);
    const order = storageService.getOrders(validId).find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Receipt generation failed: Order "${orderId}" not found for stall "${validId}".`);
    }

    const stall = storageService.getStallById(validId) || {
      name: 'FoodDesk Stall',
      contactNumber: '+91 98765 00000',
      address: { street: 'Food Court Plaza', city: 'Indore', pincode: '452001' },
    };

    const payment = storageService.getPaymentByOrderId(orderId);

    return {
      stall: {
        id: stall.id,
        name: stall.name,
        category: stall.category,
        contactNumber: stall.contactNumber || '+91 98765 00000',
        address: stall.address || { street: 'Food Court Plaza', city: 'Indore', pincode: '452001' },
        upiId: stall.paymentSettings?.upiId || 'fooddesk@okhdfcbank',
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        pickupToken: order.pickupToken,
        createdAt: order.createdAt,
        customerMobile: order.customerMobile || '',
        customerNotes: order.customerNotes || '',
        items: order.items || [],
        financials: order.financials || {
          subtotal: order.totalAmount || 0,
          discountAmount: 0,
          grandTotal: order.totalAmount || 0,
        },
      },
      payment: {
        status: order.paymentStatus || 'pending',
        method: order.paymentMethod || 'cash',
        details: order.paymentDetails || payment?.paymentDetails || {},
        isDemoSimulation: true,
      },
    };
  },

  /**
   * =========================================================================
   * PUBLIC CUSTOMER PORTAL DATA METHODS (Unauthenticated, Stall-Scoped)
   * =========================================================================
   * Resolves stall strictly by URL identifier (slug or stallId).
   * Does NOT rely on owner localStorage session.
   * Enforces service-layer Stall ID validation and cross-stall prevention.
   */

  /**
   * Resolve and validate a public stall by slug or ID.
   * Throws an error if stall is not found or inactive.
   */
  resolvePublicStall(stallSlugOrId) {
    if (!stallSlugOrId || typeof stallSlugOrId !== 'string' || !stallSlugOrId.trim()) {
      throw new Error('Public Stall Access: A valid stall slug or ID is required.');
    }

    const cleanInput = stallSlugOrId.trim().toLowerCase();
    const allStalls = storageService.getStalls();

    const stall = allStalls.find(
      (s) =>
        (s.slug && s.slug.toLowerCase() === cleanInput) ||
        (s.id && s.id.toLowerCase() === cleanInput)
    );

    if (!stall) {
      throw new Error(`Public Stall Access: Stall "${stallSlugOrId}" not found in FoodDesk registry.`);
    }

    if (stall.status !== 'active') {
      throw new Error(`Public Stall Access: Stall "${stall.name}" is currently ${stall.status || 'inactive'}.`);
    }

    return {
      id: stall.id,
      name: stall.name,
      slug: stall.slug,
      category: stall.category,
      description: stall.description || '',
      contactNumber: stall.contactNumber || '',
      address: stall.address || {},
      operatingHours: stall.operatingHours || {},
      paymentSettings: {
        upiId: stall.paymentSettings?.upiId || '',
        payeeName: stall.paymentSettings?.payeeName || stall.name,
        staticQrImageUrl: stall.paymentSettings?.staticQrImageUrl || '',
      },
    };
  },

  /**
   * Retrieve active public menu for a stall.
   * Strips internal cost prices / margins to protect owner business intelligence.
   * Reflects live availability (Available vs Sold Out) while excluding archived items.
   */
  getPublicMenu(stallSlugOrId) {
    const stall = this.resolvePublicStall(stallSlugOrId);
    const allMenuItems = storageService.getMenu(stall.id);

    // Strictly filter items for this stall ID (excludes soft-deleted/archived items)
    const activeItems = allMenuItems.filter(
      (item) => item.stallId === stall.id && !item.isArchived
    );

    // Sanitize: do not expose internal costPrice to public walk-in customers
    const sanitizedMenu = activeItems.map((item) => ({
      id: item.id,
      stallId: item.stallId,
      name: item.name,
      category: item.category,
      sellingPrice: item.sellingPrice,
      isVeg: item.isVeg,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    }));

    return {
      stall,
      menu: sanitizedMenu,
    };
  },

  /**
   * Retrieve order tracking status for public customers.
   * Guarantees that an order is returned ONLY if it strictly belongs to the resolved stall ID.
   * Detects and blocks cross-stall order sniffing / URL manipulation.
   */
  getPublicOrderTracking(stallSlugOrId, orderNumber) {
    const stall = this.resolvePublicStall(stallSlugOrId);

    if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.trim()) {
      throw new Error('Public Order Tracker: A valid order number is required.');
    }

    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    const allOrders = storageService.getOrders();

    // 1. Check if the order exists specifically for THIS stall
    const matchedOrder = allOrders.find(
      (o) =>
        o.stallId === stall.id &&
        ((o.orderNumber && o.orderNumber.toUpperCase() === cleanOrderNumber) ||
          (o.id && o.id.toUpperCase() === cleanOrderNumber))
    );

    if (matchedOrder) {
      return {
        stall,
        order: {
          id: matchedOrder.id,
          orderNumber: matchedOrder.orderNumber,
          pickupToken: matchedOrder.pickupToken,
          createdAt: matchedOrder.createdAt,
          orderStatus: matchedOrder.orderStatus || 'received',
          paymentStatus: matchedOrder.paymentStatus || 'pending',
          paymentMethod: matchedOrder.paymentMethod || 'cash',
          items: (matchedOrder.items || []).map((it) => ({
            name: it.name || it.menuItemId,
            category: it.category || '',
            quantity: it.quantity,
            sellingPrice: it.sellingPrice,
            itemTotal: it.itemTotal,
          })),
          financials: {
            subtotal: matchedOrder.financials?.subtotal ?? matchedOrder.financials?.grandTotal ?? 0,
            discountAmount: matchedOrder.financials?.discountAmount ?? 0,
            grandTotal: matchedOrder.financials?.grandTotal ?? matchedOrder.totalAmount ?? 0,
          },
        },
      };
    }

    // Generic uniform error for non-existent orders and orders belonging to other stalls.
    // Strictly avoids cross-stall information disclosure (no existence or foreign stall leakage).
    throw new Error(
      `Order "${orderNumber}" was not found for stall "${stall.name}". Please verify the order number on your receipt or contact the counter staff.`
    );
  },
};
