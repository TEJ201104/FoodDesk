import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  Store,
  FolderTree,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  Tag,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  Layers,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useStall } from '../../context/StallContext';
import { useNotification } from '../../context/NotificationContext';
import { stallDataService } from '../../services/stallDataService';
import { formatCurrency } from '../../utils/currency';
import { sound } from '../../utils/sound';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { MenuItemModal } from './components/MenuItemModal';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { ArchiveConfirmModal } from './components/ArchiveConfirmModal';

export function MenuManagementPage() {
  const { currentStall, stallChangeKey } = useStall();
  const { showToast } = useNotification();

  // Primary data state
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available' | 'sold_out'
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [targetArchiveItem, setTargetArchiveItem] = useState(null);
  const [archiveModalMode, setArchiveModalMode] = useState('archive'); // 'archive' | 'restore'
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Load menu items and categories for the active stall
  const loadMenuData = useCallback(() => {
    if (!currentStall?.id) return;
    try {
      setIsLoading(true);
      const items = stallDataService.getAllMenuItems(currentStall.id);
      const cats = stallDataService.getCategories(currentStall.id);
      setAllItems(items);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load menu data:', err);
      showToast(err.message || 'Failed to load menu items.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentStall?.id, showToast]);

  // Initial load and stall change listener
  useEffect(() => {
    loadMenuData();
    setSelectedCategory('all');
    setSearchQuery('');
    setActiveTab('active');
  }, [currentStall?.id, stallChangeKey, loadMenuData]);

  // Synchronize on external menu/category events
  useEffect(() => {
    const handleSync = () => {
      loadMenuData();
    };
    window.addEventListener('fooddesk:menu_updated', handleSync);
    window.addEventListener('fooddesk:categories_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fooddesk:menu_updated', handleSync);
      window.removeEventListener('fooddesk:categories_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadMenuData]);

  // Derived KPI metrics
  const kpis = useMemo(() => {
    const activeItems = allItems.filter((i) => !i.isArchived);
    const archivedItems = allItems.filter((i) => i.isArchived);
    const availableCount = activeItems.filter((i) => i.isAvailable !== false).length;
    const soldOutCount = activeItems.filter((i) => i.isAvailable === false).length;

    return {
      totalActive: activeItems.length,
      available: availableCount,
      soldOut: soldOutCount,
      totalArchived: archivedItems.length,
      totalCategories: categories.length,
    };
  }, [allItems, categories]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    let list = allItems;

    // Filter by active vs archived tab
    if (activeTab === 'archived') {
      list = list.filter((i) => i.isArchived);
    } else {
      list = list.filter((i) => !i.isArchived);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(
        (i) => i.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Availability (for active items)
    if (activeTab === 'active') {
      if (availabilityFilter === 'available') {
        list = list.filter((i) => i.isAvailable !== false);
      } else if (availabilityFilter === 'sold_out') {
        list = list.filter((i) => i.isAvailable === false);
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allItems, activeTab, selectedCategory, availabilityFilter, searchQuery]);

  // Immediate Availability Toggle Switch
  const handleToggleAvailability = (item) => {
    try {
      sound.playItemAdd();
      const updated = stallDataService.toggleItemAvailability(
        currentStall.id,
        item.id,
        !item.isAvailable
      );
      showToast(
        `"${item.name}" marked as ${updated.isAvailable ? 'In Stock / Available' : 'Sold Out'}.`,
        updated.isAvailable ? 'success' : 'warning'
      );
      loadMenuData();
    } catch (err) {
      showToast(err.message || 'Failed to update availability.', 'error');
    }
  };

  // Open Add Item Modal
  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  // Open Archive Confirm Modal
  const handleOpenArchiveModal = (item) => {
    setTargetArchiveItem(item);
    setArchiveModalMode('archive');
    setIsArchiveModalOpen(true);
  };

  // Open Restore Confirm Modal
  const handleOpenRestoreModal = (item) => {
    setTargetArchiveItem(item);
    setArchiveModalMode('restore');
    setIsArchiveModalOpen(true);
  };

  // Confirm Archive Execution
  const handleConfirmArchive = () => {
    if (!targetArchiveItem) return;
    setIsActionSubmitting(true);
    try {
      stallDataService.archiveMenuItem(currentStall.id, targetArchiveItem.id);
      showToast(
        `"${targetArchiveItem.name}" archived. Historical orders remain 100% preserved.`,
        'success'
      );
      setIsArchiveModalOpen(false);
      setTargetArchiveItem(null);
      loadMenuData();
    } catch (err) {
      showToast(err.message || 'Failed to archive item.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Confirm Restore Execution
  const handleConfirmRestore = () => {
    if (!targetArchiveItem) return;
    setIsActionSubmitting(true);
    try {
      stallDataService.restoreMenuItem(currentStall.id, targetArchiveItem.id);
      showToast(`"${targetArchiveItem.name}" restored back to the active menu!`, 'success');
      setIsArchiveModalOpen(false);
      setTargetArchiveItem(null);
      loadMenuData();
    } catch (err) {
      showToast(err.message || 'Failed to restore item.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Item saved callback from Modal
  const handleItemSaved = (savedItem, isEdit) => {
    showToast(
      isEdit
        ? `"${savedItem.name}" updated successfully.`
        : `"${savedItem.name}" created and added to catalog!`,
      'success'
    );
    loadMenuData();
  };

  return (
    <div className="space-y-6">
      {/* Top Workstation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-navy-900 border border-slate-800 rounded-2xl p-4 sm:px-6 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] font-bold border border-brand-500/30 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>{currentStall?.name || 'Stall Workspace'}</span>
              <span className="text-slate-400 font-mono">({currentStall?.id})</span>
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-slate-400 text-xs hidden sm:inline">Menu Management Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="w-6 h-6 text-brand-400" />
            <span>Food Menu & Category Management</span>
          </h1>
        </div>

        {/* Workstation Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="darkOutline"
            size="sm"
            icon={FolderTree}
            onClick={() => setIsCategoryModalOpen(true)}
            className="text-xs"
          >
            <span>Categories</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold">
              {categories.length}
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="text-xs font-extrabold"
          >
            Add New Item
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Active Items</span>
            <UtensilsCrossed className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.totalActive}</div>
          <div className="text-[11px] text-slate-500 mt-1">Available for POS ordering</div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{kpis.available}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Available to customers</div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Sold Out</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpis.soldOut}</div>
          <div className="text-[11px] text-amber-700/80 mt-1">Blocked from new carts</div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Categories</span>
            <FolderTree className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-brand-600">{kpis.totalCategories}</div>
          <div className="text-[11px] text-slate-500 mt-1">Stall menu sections</div>
        </Card>

        <Card className="p-4 border-slate-200/80 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Archived</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-600">{kpis.totalArchived}</div>
          <div className="text-[11px] text-slate-400 mt-1">Preserves past order records</div>
        </Card>
      </div>

      {/* Main Catalog View Card */}
      <Card className="overflow-hidden border-slate-200/90 shadow-sm">
        {/* Navigation Tabs (Active vs Archived) & Search / Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-surface-50/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Active vs Archived Segmented Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('active');
                  setSelectedCategory('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Active Menu Items ({kpis.totalActive})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('archived');
                  setSelectedCategory('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  activeTab === 'archived'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived ({kpis.totalArchived})</span>
              </button>
            </div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center gap-2">
              {activeTab === 'active' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
                    Availability:
                  </span>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
                  >
                    <option value="all">All States</option>
                    <option value="available">In Stock Only</option>
                    <option value="sold_out">Sold Out Only</option>
                  </select>
                </div>
              )}

              <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar & Sticky Category Pills */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food items by name, category, or ingredients..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills (Scrollable horizontally) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin select-none max-w-full sm:max-w-md">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All ({allItems.filter((i) => (activeTab === 'archived' ? i.isArchived : !i.isArchived)).length})</span>
              </button>

              {categories.map((cat) => {
                const count = allItems.filter(
                  (i) =>
                    (activeTab === 'archived' ? i.isArchived : !i.isArchived) &&
                    i.category?.toLowerCase() === cat.name.toLowerCase()
                ).length;

                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Body: Grid View vs Table View */}
        <div className="p-4 sm:p-6">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-surface-50 rounded-2xl border border-dashed border-slate-200">
              <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-extrabold text-slate-800 text-sm">No Menu Items Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || selectedCategory !== 'all' || availabilityFilter !== 'all'
                  ? 'No items match your active filters or search terms. Try clearing your filters.'
                  : activeTab === 'archived'
                  ? 'There are currently no archived items for this stall.'
                  : 'Get started by creating your first menu item for this stall.'}
              </p>
              {activeTab === 'active' && (
                <div className="mt-4">
                  <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddModal}>
                    Add First Item
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* =========================================================================
             * GRID VIEW: Responsive Cards (1-col mobile, 2-col tablet, 3-col desktop)
             * ========================================================================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const profit = (Number(item.sellingPrice) || 0) - (Number(item.costPrice) || 0);
                const margin =
                  item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100) : 0;
                const isSoldOut = item.isAvailable === false;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-150 overflow-hidden flex flex-col justify-between ${
                      item.isArchived
                        ? 'bg-slate-50/80 border-slate-200 opacity-80'
                        : isSoldOut
                        ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-card'
                    }`}
                  >
                    <div>
                      {/* Card Thumbnail Top Banner */}
                      <div className="relative h-36 bg-slate-100 overflow-hidden">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
                          }}
                        />

                        {/* Veg / Non-veg pill top left */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs shadow-xs text-[10px] font-extrabold text-slate-800">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{item.isVeg ? 'VEG' : 'NON-VEG'}</span>
                        </div>

                        {/* Category badge top right */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                            {item.category}
                          </span>
                        </div>

                        {/* Sold Out Watermark overlay */}
                        {isSoldOut && !item.isArchived && (
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Archived overlay */}
                        {item.isArchived && (
                          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1">
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archived</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content Details */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {item.id}
                          </span>
                        </div>

                        {item.description ? (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No description provided.</p>
                        )}

                        {/* Price & COGS Box */}
                        <div className="p-2.5 bg-surface-50 border border-slate-200/70 rounded-xl grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Selling Price
                            </span>
                            <span className="text-base font-black text-brand-600">
                              {formatCurrency(item.sellingPrice)}
                            </span>
                          </div>

                          <div className="text-right border-l border-slate-200 pl-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Cost (COGS)
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {formatCurrency(item.costPrice || 0)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                              +{formatCurrency(profit)} ({margin}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-surface-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!item.isArchived ? (
                        <>
                          {/* Availability Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              item.isAvailable !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 border border-emerald-300/80'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200/80 border border-amber-300'
                            }`}
                            title={
                              item.isAvailable !== false
                                ? 'Click to mark as Sold Out'
                                : 'Click to make Available'
                            }
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.isAvailable !== false ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                            />
                            <span>{item.isAvailable !== false ? 'In Stock' : 'Sold Out'}</span>
                          </button>

                          {/* Edit & Archive Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 border border-slate-200 transition-colors"
                              title="Edit Item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenArchiveModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
                              title="Archive Item (Preserves History)"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Archived item footer */
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Preserved in history</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenRestoreModal(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Item</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =========================================================================
             * TABLE VIEW: Workstation Data Table
             * ========================================================================= */
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-surface-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Dietary</th>
                    <th className="py-3 px-3">Selling Price</th>
                    <th className="py-3 px-3">Cost Price</th>
                    <th className="py-3 px-3">Gross Margin</th>
                    <th className="py-3 px-3">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const profit = (Number(item.sellingPrice) || 0) - (Number(item.costPrice) || 0);
                    const margin =
                      item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div>
                              <div className="font-extrabold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              item.isVeg ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-brand-600 text-sm">
                          {formatCurrency(item.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-600">
                          {formatCurrency(item.costPrice || 0)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-bold text-emerald-600">
                            +{formatCurrency(profit)} ({margin}%)
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {!item.isArchived ? (
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(item)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                                item.isAvailable !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                            >
                              {item.isAvailable !== false ? 'In Stock' : 'Sold Out'}
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!item.isArchived ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                                  title="Edit Item"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenArchiveModal(item)}
                                  className="p-1.5 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-slate-100"
                                  title="Archive Item"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenRestoreModal(item)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Add / Edit Menu Item Modal */}
      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        stallId={currentStall?.id || 'stall-1'}
        itemToEdit={itemToEdit}
        categories={categories}
        onSuccess={handleItemSaved}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        stallId={currentStall?.id || 'stall-1'}
        categories={categories}
        onCategoriesChanged={loadMenuData}
      />

      {/* Archive / Restore Confirmation Modal */}
      <ArchiveConfirmModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setTargetArchiveItem(null);
        }}
        item={targetArchiveItem}
        mode={archiveModalMode}
        onConfirmArchive={handleConfirmArchive}
        onConfirmRestore={handleConfirmRestore}
        isSubmitting={isActionSubmitting}
      />
    </div>
  );
}
