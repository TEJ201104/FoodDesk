import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Tag,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { stallDataService } from '../../../services/stallDataService.js';

export function CategoryManagementModal({
  isOpen,
  onClose,
  stallId,
  categories = [],
  onCategoriesChanged,
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClearFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    handleClearFeedback();

    if (!newCategoryName.trim()) {
      setErrorMessage('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      stallDataService.addCategory(stallId, newCategoryName.trim());
      setSuccessMessage(`Category "${newCategoryName.trim()}" created successfully!`);
      setNewCategoryName('');
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start inline editing
  const handleStartEdit = (cat) => {
    handleClearFeedback();
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  // Save edited category
  const handleSaveEdit = (catId) => {
    handleClearFeedback();
    if (!editingName.trim()) {
      setErrorMessage('Category name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      stallDataService.updateCategory(stallId, catId, editingName.trim());
      setSuccessMessage(`Category updated to "${editingName.trim()}". Current menu items updated.`);
      setEditingId(null);
      setEditingName('');
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDeleteCategory = (cat) => {
    handleClearFeedback();
    const totalItems = (cat.itemCount || 0) + (cat.archivedCount || 0);
    if (totalItems > 0) {
      setErrorMessage(
        `Cannot delete "${cat.name}": It currently contains ${totalItems} menu item(s). Please reassign or delete these items first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      stallDataService.deleteCategory(stallId, cat.id);
      setSuccessMessage(`Category "${cat.name}" deleted successfully.`);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-surface-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Manage Menu Categories</h3>
              <p className="text-[11px] text-slate-500">Stall: {stallId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span className="flex-1 font-medium">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-400 hover:text-emerald-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Create Category Bar */}
        <div className="p-6 border-b border-slate-100 bg-surface-50/50">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="New Category Name (e.g. Burgers, Beverages)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                maxLength={40}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>
        </div>

        {/* Category List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Stall Categories ({categories.length})</span>
            <span>Items Assigned</span>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 bg-surface-50 rounded-xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">No categories found for this stall.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add your first category above.</p>
            </div>
          ) : (
            categories.map((cat) => {
              const isEditing = editingId === cat.id;
              const hasItems = (cat.itemCount || 0) + (cat.archivedCount || 0) > 0;

              return (
                <div
                  key={cat.id}
                  className="p-3 bg-surface-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1 bg-white border border-brand-500 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={isSubmitting || !editingName.trim()}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Save Changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        <span className="font-bold text-slate-800 text-xs truncate">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.itemCount > 0
                                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {cat.itemCount || 0} active
                          </span>
                          {cat.archivedCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-200 text-slate-600">
                              {cat.archivedCount} archived
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={hasItems}
                            className={`p-1 rounded transition-colors ${
                              hasItems
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={
                              hasItems
                                ? `Cannot delete: contains ${cat.itemCount + cat.archivedCount} item(s)`
                                : 'Delete Category'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Category renames automatically update active items.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

