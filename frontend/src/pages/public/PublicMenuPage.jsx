import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  UtensilsCrossed,
  ShieldAlert,
  Store,
  Clock,
  Phone,
  Search,
  AlertCircle,
  ExternalLink,
  Receipt,
  Sparkles
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { stallDataService } from '../../services/stallDataService.js';
import { formatCurrency } from '../../utils/currency.js';

export function PublicMenuPage() {
  const { stallSlug } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time synchronization for menu availability and category updates
  useEffect(() => {
    const handleMenuSync = () => {
      setRefreshKey((k) => k + 1);
    };

    window.addEventListener('fooddesk:menu_updated', handleMenuSync);
    window.addEventListener('fooddesk:categories_updated', handleMenuSync);
    window.addEventListener('storage', handleMenuSync);

    return () => {
      window.removeEventListener('fooddesk:menu_updated', handleMenuSync);
      window.removeEventListener('fooddesk:categories_updated', handleMenuSync);
      window.removeEventListener('storage', handleMenuSync);
    };
  }, []);

  // Service-layer lookup strictly bound to URL parameter
  const menuData = useMemo(() => {
    try {
      return stallDataService.getPublicMenu(stallSlug || 'fast-food-stall');
    } catch (err) {
      return { error: err.message };
    }
  }, [stallSlug, refreshKey]);

  const stall = menuData?.stall;
  const items = menuData?.menu || [];
  const error = menuData?.error;

  // Extract unique categories for this stall
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Stall Menu Unavailable</h2>
            <p className="text-xs text-slate-500">{error}</p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-xs font-bold text-brand-600 hover:text-brand-700 underline"
              >
                Return to Staff Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Stall Brand Banner */}
        <div className="bg-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-card border border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="brand">Customer Walk-in Digital Menu</Badge>
              <span className="text-xs text-slate-400 font-mono">({stall?.id})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {stall?.name || 'Stall Digital Menu'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {stall?.description || 'Browse our digital menu at the counter. Please place your order directly with the stall staff.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              {stall?.category && (
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-brand-400" />
                  <span>{stall.category}</span>
                </div>
              )}
              {stall?.contactNumber && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-400" />
                  <span>{stall.contactNumber}</span>
                </div>
              )}
              {stall?.operatingHours?.openingTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>{stall.operatingHours.openingTime} – {stall.operatingHours.closingTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counter Ordering Notice */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Walk-in Counter Ordering Only:</strong> This digital menu is read-only. In accordance with FoodDesk's business model, customer-side cart and online checkout are disabled. All orders must be communicated verbally to the counter staff.
          </span>
        </div>

        {/* Category Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? `All Items (${items.length})` : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stall menu..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Stall Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between ${
                !item.isAvailable ? 'opacity-75 bg-slate-50/70 border-slate-300' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    />
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  {!item.isAvailable && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 shadow-xs">
                      Sold Out
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Counter Price</span>
                <span className="font-extrabold text-brand-600 text-base">
                  {formatCurrency(item.sellingPrice)}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No menu items match your search.</p>
            <p className="text-xs text-slate-400 mt-0.5">Try selecting another category or clear your search.</p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>FoodDesk Walk-in Digital Menu • </span>
            <span className="font-semibold text-slate-700">{stall?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/track/${stall?.slug || 'fast-food-stall'}`}
              className="text-brand-600 hover:text-brand-700 font-semibold underline flex items-center gap-1"
            >
              <span>Order Tracker</span>
            </Link>
            <span>•</span>
            <Link to="/dashboard" className="text-slate-500 hover:text-slate-700">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
