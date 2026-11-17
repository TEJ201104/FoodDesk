import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Calendar,
  X,
  History,
  Edit2,
  Trash2,
  TrendingDown,
  PieChart,
  Clock,
  ArrowUpDown,
  Tag,
  IndianRupee,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useStall } from '../../context/StallContext';
import { useNotification } from '../../context/NotificationContext';
import {
  stallDataService,
  EXPENSE_CATEGORIES,
} from '../../services/stallDataService.js';
import { formatCurrency } from '../../utils/currency.js';
import {
  formatDate,
  formatDateTime,
  isTodayKolkata,
  getKolkataDateOnlyString,
} from '../../utils/dateUtils.js';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpenseHistoryModal } from './components/ExpenseHistoryModal';
import { ExpenseDeleteModal } from './components/ExpenseDeleteModal';
import { ExpenseBreakdownChart } from './components/ExpenseBreakdownChart';

const CATEGORY_BADGES = {
  'Raw Materials': 'warning',
  'Gas': 'brand',
  'Electricity': 'info',
  'Salaries': 'success',
  'Packaging': 'info',
  'Transportation': 'default',
  'Maintenance': 'danger',
  'Other': 'default',
};

export function ExpenseManagementPage() {
  const { currentStall, stallChangeKey } = useStall();
  const { showToast } = useNotification();

  // Primary Data State
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all' | 'today' | 'this_month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [historyExpense, setHistoryExpense] = useState(null);
  const [deleteExpense, setDeleteExpense] = useState(null);

  // Load Data for active stall
  const loadExpenses = useCallback(() => {
    if (!currentStall?.id) return;
    setIsLoading(true);
    try {
      const data = stallDataService.getExpenses(currentStall.id);
      const summ = stallDataService.getExpenseSummary(currentStall.id);
      setExpenses(data);
      setSummary(summ);
    } catch (err) {
      console.error('Failed to load expenses for stall:', err);
      showToast(err.message || 'Failed to load stall expenses.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentStall?.id, showToast]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses, stallChangeKey]);

  // Handle Save (Add or Edit)
  const handleExpenseSaved = (savedItem, isEdit) => {
    showToast(
      isEdit
        ? `Expense record updated. Audit trail preserved.`
        : `Expense of ${formatCurrency(savedItem.amount)} recorded under ${savedItem.category}.`,
      'success'
    );
    loadExpenses();
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async (expenseId, reason) => {
    try {
      stallDataService.deleteExpense(currentStall.id, expenseId, reason);
      showToast('Expense record removed. Historical audit trail archived.', 'success');
      loadExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense record.', 'error');
    }
  };

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Description Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDesc = (e.description || '').toLowerCase().includes(query);
        const matchesCat = (e.category || '').toLowerCase().includes(query);
        const matchesId = (e.id || '').toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat && !matchesId) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        if (e.category !== selectedCategory) return false;
      }

      // 3. Date Range Filter
      const expenseDateStr = getKolkataDateOnlyString(e.date || e.createdAt);
      const todayStr = getKolkataDateOnlyString(new Date());

      if (dateRangeFilter === 'today') {
        if (expenseDateStr !== todayStr) return false;
      } else if (dateRangeFilter === 'this_month') {
        const currentMonthPrefix = todayStr.substring(0, 7);
        if (!expenseDateStr || !expenseDateStr.startsWith(currentMonthPrefix)) return false;
      } else if (dateRangeFilter === 'custom') {
        if (customStartDate && expenseDateStr < customStartDate) return false;
        if (customEndDate && expenseDateStr > customEndDate) return false;
      }

      return true;
    });
  }, [expenses, searchQuery, selectedCategory, dateRangeFilter, customStartDate, customEndDate]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    dateRangeFilter !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDateRangeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-brand-500" />
            <span>Expense Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track stall operating costs: raw materials, gas, electricity, salaries, packaging, and maintenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* 3 Summary KPI Cards (Asia/Kolkata Business Date Boundaries) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Today's Expenses */}
        <Card className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Expenses
            </span>
            <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(summary?.todayTotal || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Business date: <strong>{formatDate(new Date())}</strong></span>
            </p>
          </div>
        </Card>

        {/* Card 2: This Month's Expenses */}
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              This Month's Expenses
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(summary?.monthTotal || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active operational spending in current calendar month
            </p>
          </div>
        </Card>

        {/* Card 3: Top Expense Category */}
        <Card className="border-l-4 border-l-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Expense Category
            </span>
            <span className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
              {summary?.topCategory?.name || 'None'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {summary?.topCategory?.amount > 0 ? (
                <span>
                  <strong>{formatCurrency(summary.topCategory.amount)}</strong> recorded
                </span>
              ) : (
                'No expenses logged yet'
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* Expense Category Breakdown Chart Card */}
      <Card
        title="Expense Breakdown by Category"
        subtitle="Distribution of operational costs across predefined categories"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="navy" size="sm">
              {filteredExpenses.length} Records Shown
            </Badge>
          </div>
        }
      >
        <ExpenseBreakdownChart
          categoryBreakdown={summary?.categoryBreakdown || []}
          totalExpenses={summary?.totalExpenses || 0}
          selectedCategory={selectedCategory}
        />
      </Card>

      {/* Filter & Search Toolbar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, ID, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Preset Filter */}
            <div>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers (visible if custom selected) */}
          {dateRangeFilter === 'custom' && (
            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                placeholder="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                placeholder="End Date"
              />
            </div>
          )}

          {/* Filter Status & Reset */}
          <div className="flex items-center justify-between lg:justify-end gap-2 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filteredExpenses.length}</strong> of{' '}
              {expenses.length}
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

      {/* Expense Registry Table */}
      <Card bodyClassName="p-0 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">
              {hasActiveFilters ? 'No expenses match the selected filters' : 'No expenses recorded yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {hasActiveFilters
                ? 'Try clearing your search query or adjusting the date and category filters.'
                : 'Click "Record Expense" above to log your first business expense for this stall.'}
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
                  setExpenseToEdit(null);
                  setIsModalOpen(true);
                }}
              >
                Record First Expense
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Recorded By / Log</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.map((expense) => {
                  const badgeVariant = CATEGORY_BADGES[expense.category] || 'default';
                  const auditCount = Array.isArray(expense.auditTrail) ? expense.auditTrail.length : 1;

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatDate(expense.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{expense.date}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={badgeVariant} size="sm">
                          {expense.category}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs sm:max-w-md truncate">
                        <span className="font-medium">{expense.description}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {expense.id}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>

                      {/* Audit info */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        <div className="font-medium text-slate-700">
                          {expense.recordedBy || expense.createdBy || 'Stall Owner'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <History className="w-3 h-3 text-slate-400" />
                          <span>{auditCount} {auditCount === 1 ? 'version' : 'revisions'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* History / Audit Button */}
                          <button
                            type="button"
                            title="View Audit Trail"
                            onClick={() => setHistoryExpense(expense)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            title="Edit Expense"
                            onClick={() => {
                              setExpenseToEdit(expense);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            title="Delete Expense"
                            onClick={() => setDeleteExpense(expense)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenseToEdit={expenseToEdit}
        currentStall={currentStall}
        onExpenseSaved={handleExpenseSaved}
      />

      {/* History / Audit Trail Modal */}
      <ExpenseHistoryModal
        isOpen={Boolean(historyExpense)}
        onClose={() => setHistoryExpense(null)}
        expense={historyExpense}
      />

      {/* Delete Confirmation Modal */}
      <ExpenseDeleteModal
        isOpen={Boolean(deleteExpense)}
        onClose={() => setDeleteExpense(null)}
        expense={deleteExpense}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
