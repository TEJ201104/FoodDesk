import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  Store,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { useStall } from '../../context/StallContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { stallDataService } from '../../services/stallDataService.js';
import { sound } from '../../utils/sound.js';
import { formatCurrency } from '../../utils/currency.js';
import { POSCategoryFilter } from './components/POSCategoryFilter';
import { POSMenuGrid } from './components/POSMenuGrid';
import { POSCartSidebar } from './components/POSCartSidebar';
import { POSOrderReviewModal } from './components/POSOrderReviewModal';
import { POSOrderSuccessModal } from './components/POSOrderSuccessModal';
import { POSPaymentModal } from './components/POSPaymentModal';
import { DigitalThermalReceiptModal } from './components/DigitalThermalReceiptModal';

export function POSPage() {
  const { currentStall, stallChangeKey } = useStall();
  const { user } = useAuth();
  const { showToast } = useNotification();

  // 1. Menu Items & Categories State (Scoped to active stall)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Interactive Cart State
  const [cartItems, setCartItems] = useState([]);
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. Modals State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // 4. Module 5 Payment & Receipt Modals State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);

  // Real-time synchronization when menu items or categories are updated in Module 8
  useEffect(() => {
    const handleMenuSync = () => {
      setMenuRefreshKey((prev) => prev + 1);
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

  // Retrieve active stall's menu items
  const menuItems = useMemo(() => {
    if (!currentStall?.id) return [];
    try {
      return stallDataService.getMenu(currentStall.id);
    } catch (err) {
      console.error('POS menu load error:', err);
      return [];
    }
  }, [currentStall?.id, stallChangeKey, menuRefreshKey]);

  // Compute unique categories and item counts
  const { categories, categoryCounts } = useMemo(() => {
    const counts = {};
    const catSet = new Set();

    // Include explicitly created stall categories (even with 0 items)
    try {
      if (currentStall?.id) {
        const stallCats = stallDataService.getCategories(currentStall.id);
        stallCats.forEach((c) => catSet.add(c.name));
      }
    } catch (e) {}

    menuItems.forEach((item) => {
      if (item.category) {
        catSet.add(item.category);
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return {
      categories: Array.from(catSet),
      categoryCounts: counts,
    };
  }, [menuItems, currentStall?.id, menuRefreshKey]);

  // Reset cart and filters whenever active stall changes to prevent cross-stall leakage
  useEffect(() => {
    setCartItems([]);
    setSelectedCategory('all');
    setSearchQuery('');
    setDiscountType('none');
    setDiscountValue(0);
  }, [currentStall?.id]);

  // Filter items based on active category & search query
  const filteredItems = useMemo(() => {
    let list = menuItems;

    if (selectedCategory !== 'all') {
      list = list.filter(
        (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [menuItems, selectedCategory, searchQuery]);

  // Map of item IDs to their current cart quantities
  const cartQuantities = useMemo(() => {
    const map = {};
    cartItems.forEach((i) => {
      map[i.id] = i.quantity;
    });
    return map;
  }, [cartItems]);

  // Cart operations
  const handleAddToCart = useCallback((item) => {
    if (item.isAvailable === false) {
      showToast(`"${item.name}" is currently sold out and cannot be ordered.`, 'warning');
      return;
    }

    sound.playItemAdd();

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          sellingPrice: Number(item.sellingPrice),
          costPrice: Number(item.costPrice || 0),
          imageUrl: item.imageUrl || '',
          quantity: 1,
        },
      ];
    });
  }, [showToast]);

  const handleUpdateQuantity = useCallback((itemId, delta) => {
    sound.playItemAdd();
    setCartItems((prev) => {
      return prev
        .map((i) => {
          if (i.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  }, []);

  const handleRemoveItem = useCallback((itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setDiscountType('none');
    setDiscountValue(0);
    setCustomerMobile('');
    setCustomerNotes('');
  }, []);

  // Financial calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, i) => acc + i.sellingPrice * i.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (discountType === 'none' || subtotal === 0) return 0;
    const val = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      return Math.round((subtotal * Math.min(100, Math.max(0, val))) / 100);
    }
    return Math.min(subtotal, Math.max(0, val));
  }, [subtotal, discountType, discountValue]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Preview upcoming order number and token for modal
  const nextOrderPreview = useMemo(() => {
    if (!currentStall?.id) return null;
    try {
      return stallDataService.previewNextOrder(currentStall.id);
    } catch (e) {
      return null;
    }
  }, [currentStall?.id, cartItems.length, isReviewOpen]);

  const isSubmittingRef = useRef(false);

  // Submit order execution with double-click guard
  const handleConfirmOrder = async () => {
    if (!currentStall?.id || cartItems.length === 0 || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const orderPayload = {
        items: cartItems,
        customerMobile,
        customerNotes,
        discountType,
        discountValue,
        paymentMethod,
      };

      const order = await stallDataService.createOrder(currentStall.id, orderPayload);
      sound.playSuccess();
      setCreatedOrder(order);
      setIsReviewOpen(false);
      setIsSuccessOpen(true);
      showToast(
        `Order ${order.orderNumber} created! Pickup Token #${order.pickupToken}.`,
        'success'
      );
    } catch (err) {
      console.error('Order creation error:', err);
      showToast(err.message || 'Failed to create order.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleStartNextOrder = () => {
    handleClearCart();
    setCreatedOrder(null);
    setIsSuccessOpen(false);
    setIsPaymentOpen(false);
    setIsReceiptOpen(false);
    setActivePaymentOrder(null);
    setReceiptData(null);
  };

  const handleOpenPayment = (orderToPay) => {
    const target = orderToPay || createdOrder;
    if (!target) return;
    setActivePaymentOrder(target);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (paymentRecord, paidOrder) => {
    showToast(`Payment recorded for ${paidOrder?.orderNumber || 'order'}!`, 'success');
    setCreatedOrder((prev) => (prev ? { ...prev, paymentStatus: 'paid' } : prev));
    setIsPaymentOpen(false);
    try {
      const rData = stallDataService.getReceiptData(currentStall.id, paidOrder.id);
      setReceiptData(rData);
      setIsReceiptOpen(true);
    } catch (e) {
      console.warn('Failed to generate receipt data:', e);
    }
  };

  const handleOpenReceipt = (orderForReceipt) => {
    const target = orderForReceipt || createdOrder;
    if (!target) return;
    try {
      const rData = stallDataService.getReceiptData(currentStall.id, target.id);
      setReceiptData(rData);
      setIsReceiptOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to load receipt.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Workstation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-navy-900 border border-slate-800 rounded-2xl p-4 sm:px-6 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] font-bold border border-brand-500/30 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>{currentStall?.name || 'Stall Workspace'}</span>
              <span className="text-slate-400 font-mono">({currentStall?.id})</span>
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-slate-400 text-xs hidden sm:inline">Walk-in POS Workstation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Counter Point of Sale</span>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or ingredients..."
            className="w-full pl-9 pr-8 py-2 bg-navy-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Menu Catalog (2 cols on lg) vs Right Cart Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Section: Categories + Food Grid (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Filter Pills */}
          <POSCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalItemsCount={menuItems.length}
            categoryCounts={categoryCounts}
          />

          {/* Menu Items Grid */}
          <POSMenuGrid
            items={filteredItems}
            cartQuantities={cartQuantities}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
          />
        </div>

        {/* Right Section: Sticky Cart & Bill Summary (4 cols on lg) */}
        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <POSCartSidebar
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            customerMobile={customerMobile}
            onChangeMobile={setCustomerMobile}
            customerNotes={customerNotes}
            onChangeNotes={setCustomerNotes}
            discountType={discountType}
            onChangeDiscountType={setDiscountType}
            discountValue={discountValue}
            onChangeDiscountValue={setDiscountValue}
            paymentMethod={paymentMethod}
            onChangePaymentMethod={setPaymentMethod}
            subtotal={subtotal}
            discountAmount={discountAmount}
            grandTotal={grandTotal}
            onOpenReview={() => setIsReviewOpen(true)}
            activeStall={currentStall}
          />
        </div>
      </div>

      {/* Review Modal */}
      <POSOrderReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirmOrder={handleConfirmOrder}
        isSubmitting={isSubmitting}
        cartItems={cartItems}
        customerMobile={customerMobile}
        customerNotes={customerNotes}
        subtotal={subtotal}
        discountType={discountType}
        discountValue={discountValue}
        discountAmount={discountAmount}
        grandTotal={grandTotal}
        paymentMethod={paymentMethod}
        activeStall={currentStall}
        nextOrderPreview={nextOrderPreview}
      />

      {/* Success Modal */}
      <POSOrderSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        createdOrder={createdOrder}
        onStartNextOrder={handleStartNextOrder}
        onOpenPayment={handleOpenPayment}
        onOpenReceipt={handleOpenReceipt}
      />

      {/* Module 5: Payment Processing Modal */}
      <POSPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        order={activePaymentOrder}
        activeStall={currentStall}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Module 5: Digital Thermal Receipt Modal */}
      <DigitalThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={receiptData}
        onStartNextOrder={handleStartNextOrder}
      />
    </div>
  );
}
