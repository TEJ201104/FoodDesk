import React from 'react';
import { Utensils } from 'lucide-react';

export function POSCategoryFilter({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  totalItemsCount = 0,
  categoryCounts = {},
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 select-none">
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
          selectedCategory === 'all'
            ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
            : 'bg-navy-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-navy-800'
        }`}
      >
        <Utensils className="w-3.5 h-3.5" />
        <span>All Items</span>
        <span
          className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            selectedCategory === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {totalItemsCount}
        </span>
      </button>

      {categories.map((category) => {
        const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
        const count = categoryCounts[category] || 0;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              isSelected
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                : 'bg-navy-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-navy-800'
            }`}
          >
            <span>{category}</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

