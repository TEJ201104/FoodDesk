import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  X,
  History,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  Scale,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { useStall } from '../../context/StallContext';
import { useNotification } from '../../context/NotificationContext';
import {
  stallDataService,
  INVENTORY_UNITS,
  getInventoryStatus,
} from '../../services/stallDataService.js';
import { formatDate, formatDateTime } from '../../utils/dateUtils.js';
import { InventoryItemModal } from './components/InventoryItemModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { RecordWastageModal } from './components/RecordWastageModal';
import { StockHistoryModal } from './components/StockHistoryModal';
import { LowStockAlertBanner } from './components/LowStockAlertBanner';

export function InventoryPage() {
  const { currentStall, stallChangeKey } = useStall();
  const { showToast } = useNotification();

  // Data State
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [wastageHistory, setWastageHistory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: 'inventory' | 'wastage' | 'movements'
  const [activeTab, setActiveTab] = useState('inventory');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [unitFilter, setUnitFilter] = useState('all');

  // Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [wastageItem, setWastageItem] = useState(null);
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);

  // Load Inventory Data
  const loadInventory = useCallback(() => {
    if (!currentStall?.id) return;
    setIsLoading(true);
    try {
      const items = stallDataService.getInventory(currentStall.id);
      const movs = stallDataService.getStockMovements(currentStall.id);
      const wastes = stallDataService.getWastageHistory(currentStall.id);
      const alerts = stallDataService.getLowStockIngredients(currentStall.id);

      setInventory(items);
      setMovements(movs);
      setWastageHistory(wastes);
      setLowStockItems(alerts);
    } catch (err) {
      console.error('Failed to load inventory for stall:', err);
      showToast(err.message || 'Failed to load inventory items.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentStall?.id, showToast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory, stallChangeKey]);

  // Handle Item Saved
  const handleItemSaved = (savedItem, isEdit) => {
    showToast(
      isEdit
        ? `Ingredient "${savedItem.name}" updated successfully.`
        : `Ingredient "${savedItem.name}" created with ${savedItem.currentStock} ${savedItem.unit} initial stock.`,
      'success'
    );
    loadInventory();
  };

  // Handle Adjustment Complete
  const handleAdjustmentComplete = (updatedItem, movement) => {
    showToast(
      `Stock for "${updatedItem.name}" adjusted: ${movement.previousQuantity} → ${updatedItem.currentStock} ${updatedItem.unit}.`,
      'success'
    );
    loadInventory();
  };

  // Handle Wastage Recorded
  const handleWastageRecorded = (updatedItem, movement) => {
    showToast(
      `Wastage of ${Math.abs(movement.quantityChanged)} ${updatedItem.unit} logged for "${updatedItem.name}".`,
      'warning'
    );
    loadInventory();
  };

  // Filter Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesId = (item.id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesId) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }

      // 3. Unit Filter
      if (unitFilter !== 'all') {
        if (item.unit !== unitFilter) return false;
      }

      return true;
    });
  }, [inventory, searchQuery, statusFilter, unitFilter]);

  // Derived KPI Counts
  const kpiCounts = useMemo(() => {
    const total = inventory.length;
    const inStock = inventory.filter((i) => i.status === 'in_stock').length;
    const lowStock = inventory.filter((i) => i.status === 'low_stock').length;
    const outOfStock = inventory.filter((i) => i.status === 'out_of_stock').length;
    return { total, inStock, lowStock, outOfStock };
  }, [inventory]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || unitFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setUnitFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-brand-500" />
            <span>Inventory & Ingredients</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Raw materials stock levels, minimum stock thresholds, wastage logs, and low-stock alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={History}
            onClick={() => {
              setHistoryItem(null);
              setIsGlobalHistoryOpen(true);
            }}
          >
            Movement Log
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Trash2}
            className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
            onClick={() => {
              setWastageItem(null);
              setIsWastageModalOpen(true);
            }}
          >
            Record Wastage
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
          >
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Dynamic Low-Stock & Out-of-Stock Alert Banner */}
      <LowStockAlertBanner
        lowStockItems={lowStockItems}
        onFilterLowStock={() => {
          setActiveTab('inventory');
          setStatusFilter('low_stock');
        }}
        onAdjustStock={(item) => {
          setAdjustItem(item);
        }}
      />

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ingredients */}
        <Card className="border-l-4 border-l-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Items
            </span>
            <span className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiCounts.total}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tracked for this stall</p>
          </div>
        </Card>

        {/* Card 2: In Stock */}
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Optimal Stock
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {kpiCounts.inStock}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Above minimum levels</p>
          </div>
        </Card>

        {/* Card 3: Low Stock */}
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {kpiCounts.lowStock}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">At or below threshold</p>
          </div>
        </Card>

        {/* Card 4: Out of Stock */}
        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Out of Stock
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {kpiCounts.outOfStock}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Replenish urgently</p>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Active Ingredients ({inventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wastage')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'wastage'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Wastage Log ({wastageHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>All Stock Movements ({movements.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: INVENTORY ITEMS */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter & Search Toolbar */}
          <Card bodyClassName="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ingredient name, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  >
                    <option value="all">All Stock Statuses</option>
                    <option value="in_stock">In Stock (Optimal)</option>
                    <option value="low_stock">Low Stock (≤ Threshold)</option>
                    <option value="out_of_stock">Out of Stock (Zero)</option>
                  </select>
                </div>

                {/* Unit Filter */}
                <div>
                  <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  >
                    <option value="all">All Units of Measure</option>
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset & Count */}
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                <span className="text-slate-500">
                  Showing <strong className="text-slate-900">{filteredInventory.length}</strong> of{' '}
                  {inventory.length}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card bodyClassName="p-0 overflow-hidden">
            {filteredInventory.length === 0 ? (
              <div className="p-12 text-center">
                <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-base">
                  {hasActiveFilters ? 'No ingredients match the selected filters' : 'No ingredients added yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {hasActiveFilters
                    ? 'Try clearing your search query or adjusting the status/unit filters.'
                    : 'Click "Add Ingredient" above to create your first stock item.'}
                </p>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleResetFilters}
                  >
                    Clear All Filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    icon={Plus}
                    onClick={() => {
                      setItemToEdit(null);
                      setIsItemModalOpen(true);
                    }}
                  >
                    Add First Ingredient
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Ingredient Name</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Min Threshold</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredInventory.map((item) => {
                      const isZero = item.currentStock <= 0;
                      const isLow = item.currentStock > 0 && item.currentStock <= item.minThreshold;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/60 transition-colors group ${
                            isZero ? 'bg-rose-50/20' : isLow ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Name & Desc */}
                          <td className="py-3.5 px-4 text-slate-800">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                {item.description}
                              </p>
                            )}
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {item.id}
                            </span>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-baseline gap-1">
                              <span
                                className={`text-base font-extrabold font-mono ${
                                  isZero
                                    ? 'text-rose-600'
                                    : isLow
                                    ? 'text-amber-600'
                                    : 'text-slate-900'
                                }`}
                              >
                                {item.currentStock}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {item.unit}
                              </span>
                            </div>
                          </td>

                          {/* Threshold */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            <span className="font-mono font-medium">
                              {item.minThreshold} {item.unit}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isZero ? (
                              <Badge variant="danger" dot size="sm">
                                Out of Stock
                              </Badge>
                            ) : isLow ? (
                              <Badge variant="warning" dot size="sm">
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success" dot size="sm">
                                In Stock
                              </Badge>
                            )}
                          </td>

                          {/* Last Updated */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                            {item.updatedAt ? formatDateTime(item.updatedAt) : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Stock Adjustment Button */}
                              <button
                                type="button"
                                title="Adjust Stock (Add/Reduce)"
                                onClick={() => setAdjustItem(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-500 hover:text-white text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Adjust</span>
                              </button>

                              {/* Record Wastage Button */}
                              <button
                                type="button"
                                title="Record Wastage"
                                onClick={() => {
                                  setWastageItem(item);
                                  setIsWastageModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* Movement History */}
                              <button
                                type="button"
                                title="View Movement History"
                                onClick={() => {
                                  setHistoryItem(item);
                                  setIsGlobalHistoryOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <History className="w-4 h-4" />
                              </button>

                              {/* Edit Ingredient */}
                              <button
                                type="button"
                                title="Edit Ingredient"
                                onClick={() => {
                                  setItemToEdit(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: WASTAGE LOG */}
      {activeTab === 'wastage' && (
        <Card
          title="Ingredient Wastage Incidents"
          subtitle="Dedicated audit log of spoiled, expired, damaged, or prep-loss ingredients"
          action={
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              className="text-rose-700 hover:bg-rose-50"
              onClick={() => {
                setWastageItem(null);
                setIsWastageModalOpen(true);
              }}
            >
              Record Wastage
            </Button>
          }
          bodyClassName="p-0 overflow-hidden"
        >
          {wastageHistory.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Zero Wastage Recorded</h4>
              <p className="text-xs text-slate-400 mt-1">
                No ingredient spoilage, expiry, or prep losses logged for this stall.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Ingredient</th>
                    <th className="py-3 px-4">Wasted Quantity</th>
                    <th className="py-3 px-4">Reason Category</th>
                    <th className="py-3 px-4">Incident Notes</th>
                    <th className="py-3 px-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wastageHistory.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                        {formatDateTime(w.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {w.ingredientName}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-rose-600 whitespace-nowrap">
                        {Math.abs(w.quantityChanged)} {w.unit}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="danger" size="sm">
                          {w.wastageReason || 'Wastage'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {w.notes || w.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {w.user || 'Stall Owner'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: COMPLETE MOVEMENT LOG */}
      {activeTab === 'movements' && (
        <Card
          title="All Stock Movement Records"
          subtitle="Chronological transaction log: initial intakes, additions, reductions, and wastage"
          bodyClassName="p-0 overflow-hidden"
        >
          {movements.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Ingredient</th>
                    <th className="py-3 px-4">Operation Type</th>
                    <th className="py-3 px-4">Stock Change</th>
                    <th className="py-3 px-4">Before → After</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Responsible User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    const isAdd = m.type === 'add';
                    const isWastage = m.type === 'wastage';
                    const isInitial = m.type === 'initial';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                          {formatDateTime(m.timestamp)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {m.ingredientName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isWastage
                                ? 'bg-rose-100 text-rose-800'
                                : isAdd
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInitial
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isWastage ? 'Wastage' : isAdd ? 'Addition' : isInitial ? 'Initial Stock' : 'Reduction'}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 font-extrabold whitespace-nowrap ${
                            m.quantityChanged > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged} {m.unit}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                          {m.previousQuantity} → <strong className="text-slate-900">{m.newQuantity} {m.unit}</strong>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {m.reason} {m.notes ? `(${m.notes})` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {m.user || 'Stall Owner'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Ingredient Modal */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={itemToEdit}
        currentStall={currentStall}
        onItemSaved={handleItemSaved}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        currentStall={currentStall}
        onAdjustmentComplete={handleAdjustmentComplete}
      />

      {/* Record Wastage Modal */}
      <RecordWastageModal
        isOpen={isWastageModalOpen}
        onClose={() => {
          setIsWastageModalOpen(false);
          setWastageItem(null);
        }}
        preselectedItem={wastageItem}
        allItems={inventory}
        currentStall={currentStall}
        onWastageRecorded={handleWastageRecorded}
      />

      {/* Stock History Modal */}
      <StockHistoryModal
        isOpen={isGlobalHistoryOpen}
        onClose={() => {
          setIsGlobalHistoryOpen(false);
          setHistoryItem(null);
        }}
        item={historyItem}
        movements={movements}
      />
    </div>
  );
}
