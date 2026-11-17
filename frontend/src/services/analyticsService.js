/**
 * FOODDESK FINANCIAL ANALYTICS ENGINE
 * Centralized service computing strict P&L, sales trends, tender distributions,
 * and ranking metrics using frozen historical snapshots and integer paise precision.
 */

import { storageService } from './storageService.js';
import { stallDataService } from './stallDataService.js';
import { getKolkataDateOnlyString, formatDate, formatDateTime } from '../utils/dateUtils.js';

export const DATE_PRESETS = [
  { key: 'today', label: "Today" },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];

export const PAYMENT_METHOD_COLORS = {
  Cash: '#10B981', // Emerald
  'Dynamic UPI': '#0EA5E9', // Sky
  'Static QR': '#8B5CF6', // Violet
  Other: '#94A3B8', // Slate
};

/**
 * Calculates start and end YYYY-MM-DD boundary strings in Asia/Kolkata timezone.
 */
export function calculateDateRangeBounds(preset = 'thisMonth', customStart = null, customEnd = null) {
  const now = new Date();
  const todayStr = getKolkataDateOnlyString(now);

  if (preset === 'custom') {
    if (!customStart || !customEnd) {
      const s = customStart || todayStr;
      const e = customEnd || todayStr;
      return {
        preset: 'custom',
        label: 'Custom Range',
        startDate: s,
        endDate: e,
        start: s,
        end: e,
      };
    }
    const start = String(customStart).trim();
    const end = String(customEnd).trim();
    if (start > end) {
      throw new Error(`Invalid Date Range: Start date (${start}) cannot be after end date (${end}).`);
    }
    return {
      preset: 'custom',
      label: `${start} to ${end}`,
      startDate: start,
      endDate: end,
      start,
      end,
    };
  }

  if (preset === 'today') {
    return {
      preset: 'today',
      label: 'Today',
      startDate: todayStr,
      endDate: todayStr,
      start: todayStr,
      end: todayStr,
    };
  }

  if (preset === 'yesterday') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestStr = getKolkataDateOnlyString(yest);
    return {
      preset: 'yesterday',
      label: 'Yesterday',
      startDate: yestStr,
      endDate: yestStr,
      start: yestStr,
      end: yestStr,
    };
  }

  if (preset === 'thisWeek') {
    // Current week starting Monday in Kolkata
    const d = new Date(now);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    const startOfWeekStr = getKolkataDateOnlyString(d);
    return {
      preset: 'thisWeek',
      label: 'This Week',
      startDate: startOfWeekStr,
      endDate: todayStr,
      start: startOfWeekStr,
      end: todayStr,
    };
  }

  if (preset === 'thisYear') {
    const yearStr = todayStr.slice(0, 4);
    const s = `${yearStr}-01-01`;
    return {
      preset: 'thisYear',
      label: 'This Year',
      startDate: s,
      endDate: todayStr,
      start: s,
      end: todayStr,
    };
  }

  // Default: 'thisMonth'
  const yearMonth = todayStr.slice(0, 7);
  const startOfMonth = `${yearMonth}-01`;
  return {
    preset: 'thisMonth',
    label: 'This Month',
    startDate: startOfMonth,
    endDate: todayStr,
    start: startOfMonth,
    end: todayStr,
  };
}

/**
 * Monetary conversion helper: converts floating INR amount to integer paise safely.
 */
function toPaise(inrAmount) {
  const num = Number(inrAmount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise back to standard floating INR amount.
 */
function toRupees(paiseAmount) {
  return paiseAmount / 100;
}

export const analyticsService = {
  /**
   * Generates a complete Financial Analytics and P&L Report for the requested stall and date range.
   */
  getFinancialAnalytics(stallId, options = {}) {
    const validId = stallDataService.validateStallAccess(stallId);
    const stall = storageService.getStallById(validId);
    const stallName = stall ? stall.name : validId;

    const { rangePreset = 'thisMonth', customStart = null, customEnd = null } = options;
    const period = calculateDateRangeBounds(rangePreset, customStart, customEnd);

    // Retrieve raw stored collections for this stall
    const allOrders = storageService.getOrders(validId);
    const allExpenses = storageService.getExpenses(validId);
    const allPayments = storageService.getPayments(validId);

    // Filter non-deleted expenses falling within the date boundary
    const periodExpenses = allExpenses.filter((e) => {
      if (e.isDeleted) return false;
      const expenseDate = e.date || getKolkataDateOnlyString(e.createdAt);
      return expenseDate >= period.startDate && expenseDate <= period.endDate;
    });

    let totalExpensesPaise = 0;
    periodExpenses.forEach((e) => {
      totalExpensesPaise += toPaise(e.amount);
    });

    // Partition and evaluate orders within the date range
    let grossSalesPaise = 0;
    let discountsPaise = 0;
    let refundsPaise = 0;
    let cogsPaise = 0;

    let totalOrdersCount = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let failedPaymentsCount = 0;

    const eligibleOrders = [];
    const itemSalesMap = new Map(); // menuItemId -> { name, category, quantity, revenuePaise, cogsPaise }
    const dailyDataMap = new Map(); // YYYY-MM-DD -> { grossSalesPaise, discountsPaise, refundsPaise, cogsPaise, expensesPaise, orderCount }

    // Tender Method Distribution accumulators (Net collected in Paise)
    let tenderCashPaise = 0;
    let tenderDynamicUpiPaise = 0;
    let tenderStaticQrPaise = 0;
    let tenderOtherPaise = 0;

    allOrders.forEach((order) => {
      const orderDateStr = getKolkataDateOnlyString(order.createdAt);
      if (orderDateStr < period.startDate || orderDateStr > period.endDate) {
        return; // Exclude orders outside reporting period
      }

      totalOrdersCount++;

      const pStatus = (order.paymentStatus || '').toLowerCase();
      const oStatus = (order.orderStatus || '').toLowerCase();

      if (oStatus === 'cancelled') {
        cancelledOrdersCount++;
        // If order was cancelled without payment, it is strictly excluded from realized sales
        if (pStatus !== 'paid' && pStatus !== 'successful' && pStatus !== 'partially_refunded' && pStatus !== 'refunded') {
          return;
        }
      }

      if (pStatus === 'failed') {
        failedPaymentsCount++;
        return; // Failed payments never count towards revenue
      }

      if (pStatus === 'pending') {
        pendingOrdersCount++;
        return; // Pending/unpaid orders never count towards realized revenue
      }

      // Order is realized / eligible
      paidOrdersCount++;
      eligibleOrders.push(order);

      // Financials Extraction
      // Gross sales = item sellingPrice * quantity before discount
      let orderSubtotal = 0;
      let orderCOGS = 0;

      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const sellingPrice = Number(item.sellingPrice) || 0;
          // CRITICAL: Must use historical frozen costPrice snapshot
          const costPrice = Number(item.costPrice) || 0;

          orderSubtotal += sellingPrice * qty;
          orderCOGS += costPrice * qty;

          // Item level aggregation for Top 5 Best-Selling Items
          const itemKey = item.name || item.menuItemId;
          if (!itemSalesMap.has(itemKey)) {
            itemSalesMap.set(itemKey, {
              name: item.name || 'Unnamed Item',
              category: item.category || 'General',
              quantity: 0,
              revenuePaise: 0,
              cogsPaise: 0,
            });
          }
          const rec = itemSalesMap.get(itemKey);
          rec.quantity += qty;
          rec.revenuePaise += toPaise(sellingPrice * qty);
          rec.cogsPaise += toPaise(costPrice * qty);
        });
      } else {
        orderSubtotal = Number(order.financials?.subtotal ?? order.totalAmount ?? 0);
        orderCOGS = Number(order.financials?.totalCostOfGoodsSold ?? 0);
      }

      const orderDiscount = Number(order.financials?.discountAmount ?? order.discountAmount ?? 0);

      // Calculate cumulative refunds for this order (prevent double counting)
      let orderRefund = 0;
      if (order.totalRefundedAmount !== undefined) {
        orderRefund = Number(order.totalRefundedAmount) || 0;
      } else if (pStatus === 'refunded') {
        orderRefund = Number(order.financials?.grandTotal ?? order.totalAmount ?? orderSubtotal - orderDiscount);
      } else if (order.refundAmount !== undefined) {
        orderRefund = Number(order.refundAmount) || 0;
      }

      const orderGrossPaise = toPaise(orderSubtotal);
      const orderDiscountPaise = toPaise(orderDiscount);
      const orderRefundPaise = toPaise(orderRefund);
      const orderCogsPaise = toPaise(orderCOGS);

      grossSalesPaise += orderGrossPaise;
      discountsPaise += orderDiscountPaise;
      refundsPaise += orderRefundPaise;
      cogsPaise += orderCogsPaise;

      // Tender Method Aggregation
      const pMethod = (order.paymentMethod || '').toLowerCase();
      const pDetails = order.paymentDetails || {};
      const orderNetPaidPaise = Math.max(0, orderGrossPaise - orderDiscountPaise - orderRefundPaise);

      if (pMethod === 'split_tender') {
        const cashPart = Number(pDetails.cashAmount ?? pDetails.cashTendered ?? 0);
        const upiPart = Number(pDetails.upiAmount ?? 0);
        const totalSplit = cashPart + upiPart;
        if (totalSplit > 0) {
          const cashRatio = cashPart / totalSplit;
          tenderCashPaise += Math.round(orderNetPaidPaise * cashRatio);
          tenderDynamicUpiPaise += Math.round(orderNetPaidPaise * (1 - cashRatio));
        } else {
          tenderCashPaise += orderNetPaidPaise;
        }
      } else if (pMethod === 'cash') {
        tenderCashPaise += orderNetPaidPaise;
      } else if (pMethod === 'upi_gateway' || pMethod === 'dynamic_upi') {
        tenderDynamicUpiPaise += orderNetPaidPaise;
      } else if (pMethod === 'upi_static_qr' || pMethod === 'static_qr' || pMethod === 'upi') {
        tenderStaticQrPaise += orderNetPaidPaise;
      } else {
        tenderOtherPaise += orderNetPaidPaise;
      }

      // Daily bucket for Sales Trends Area Chart
      if (!dailyDataMap.has(orderDateStr)) {
        dailyDataMap.set(orderDateStr, {
          grossSalesPaise: 0,
          discountsPaise: 0,
          refundsPaise: 0,
          cogsPaise: 0,
          expensesPaise: 0,
          orderCount: 0,
        });
      }
      const dayRec = dailyDataMap.get(orderDateStr);
      dayRec.grossSalesPaise += orderGrossPaise;
      dayRec.discountsPaise += orderDiscountPaise;
      dayRec.refundsPaise += orderRefundPaise;
      dayRec.cogsPaise += orderCogsPaise;
      dayRec.orderCount += 1;
    });

    // Distribute expenses into daily bucket
    periodExpenses.forEach((exp) => {
      const expDateStr = exp.date || getKolkataDateOnlyString(exp.createdAt);
      if (!dailyDataMap.has(expDateStr)) {
        dailyDataMap.set(expDateStr, {
          grossSalesPaise: 0,
          discountsPaise: 0,
          refundsPaise: 0,
          cogsPaise: 0,
          expensesPaise: 0,
          orderCount: 0,
        });
      }
      const dayRec = dailyDataMap.get(expDateStr);
      dayRec.expensesPaise += toPaise(exp.amount);
    });

    // Core P&L Formulas
    // Net Revenue = Gross Sales - Discounts - Refunds
    const netRevenuePaise = Math.max(0, grossSalesPaise - discountsPaise - refundsPaise);
    // Gross Profit = Net Revenue - COGS
    const grossProfitPaise = netRevenuePaise - cogsPaise;
    // Net Profit = Gross Profit - Total Expenses
    const netProfitPaise = grossProfitPaise - totalExpensesPaise;

    // Convert all Paise to standard Rupee values
    const grossSales = toRupees(grossSalesPaise);
    const totalDiscounts = toRupees(discountsPaise);
    const totalRefunds = toRupees(refundsPaise);
    const netRevenue = toRupees(netRevenuePaise);
    const cogs = toRupees(cogsPaise);
    const grossProfit = toRupees(grossProfitPaise);
    const totalExpenses = toRupees(totalExpensesPaise);
    const netProfit = toRupees(netProfitPaise);

    const averageOrderValue = paidOrdersCount > 0 ? Math.round(netRevenue / paidOrdersCount) : 0;
    const grossProfitMargin = netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 100) : 0;
    const netProfitMargin = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 100) : 0;

    // Construct Sequential Timeline for Sales Trends Chart (Continuous date line without gaps)
    const salesTrends = [];
    const curDate = new Date(`${period.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${period.endDate}T00:00:00.000Z`);

    // Guard against excessive iterations for long historical ranges
    let iter = 0;
    while (curDate <= endDate && iter < 366) {
      const dateStr = curDate.toISOString().slice(0, 10);
      const bucket = dailyDataMap.get(dateStr) || {
        grossSalesPaise: 0,
        discountsPaise: 0,
        refundsPaise: 0,
        cogsPaise: 0,
        expensesPaise: 0,
        orderCount: 0,
      };

      const dayNetRevenuePaise = Math.max(0, bucket.grossSalesPaise - bucket.discountsPaise - bucket.refundsPaise);
      const dayGrossProfitPaise = dayNetRevenuePaise - bucket.cogsPaise;
      const dayNetProfitPaise = dayGrossProfitPaise - bucket.expensesPaise;

      // Label formatted for chart axis: e.g. "14 Nov"
      const parts = dateStr.split('-');
      const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const shortLabel = dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      salesTrends.push({
        date: dateStr,
        label: shortLabel,
        grossSales: toRupees(bucket.grossSalesPaise),
        netRevenue: toRupees(dayNetRevenuePaise),
        cogs: toRupees(bucket.cogsPaise),
        expenses: toRupees(bucket.expensesPaise),
        grossProfit: toRupees(dayGrossProfitPaise),
        netProfit: toRupees(dayNetProfitPaise),
        orderCount: bucket.orderCount,
      });

      curDate.setUTCDate(curDate.getUTCDate() + 1);
      iter++;
    }

    // Construct Payment Method Pie Chart Data
    const totalTenderPaise = tenderCashPaise + tenderDynamicUpiPaise + tenderStaticQrPaise + tenderOtherPaise;
    const paymentMethods = [
      {
        name: 'Cash',
        key: 'cash',
        amount: toRupees(tenderCashPaise),
        value: toRupees(tenderCashPaise),
        count: allOrders.filter(o => (o.paymentMethod || '').toLowerCase().includes('cash')).length,
        percentage: totalTenderPaise > 0 ? Math.round((tenderCashPaise / totalTenderPaise) * 100) : 0,
        color: PAYMENT_METHOD_COLORS.Cash,
      },
      {
        name: 'Dynamic UPI',
        key: 'dynamic_upi',
        amount: toRupees(tenderDynamicUpiPaise),
        value: toRupees(tenderDynamicUpiPaise),
        count: allOrders.filter(o => (o.paymentMethod || '').toLowerCase().includes('upi') || (o.paymentMethod || '').toLowerCase().includes('dynamic')).length,
        percentage: totalTenderPaise > 0 ? Math.round((tenderDynamicUpiPaise / totalTenderPaise) * 100) : 0,
        color: PAYMENT_METHOD_COLORS['Dynamic UPI'],
      },
      {
        name: 'Static QR',
        key: 'static_qr',
        amount: toRupees(tenderStaticQrPaise),
        value: toRupees(tenderStaticQrPaise),
        count: allOrders.filter(o => (o.paymentMethod || '').toLowerCase().includes('static') || (o.paymentMethod || '').toLowerCase().includes('qr')).length,
        percentage: totalTenderPaise > 0 ? Math.round((tenderStaticQrPaise / totalTenderPaise) * 100) : 0,
        color: PAYMENT_METHOD_COLORS['Static QR'],
      },
    ];

    if (tenderOtherPaise > 0) {
      paymentMethods.push({
        name: 'Other',
        key: 'other',
        amount: toRupees(tenderOtherPaise),
        value: toRupees(tenderOtherPaise),
        count: 1,
        percentage: totalTenderPaise > 0 ? Math.round((tenderOtherPaise / totalTenderPaise) * 100) : 0,
        color: PAYMENT_METHOD_COLORS.Other,
      });
    }

    // Construct Top 5 Best-Selling Items Bar Chart Data
    const topSellingItems = Array.from(itemSalesMap.values())
      .map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        revenue: toRupees(item.revenuePaise),
        cogs: toRupees(item.cogsPaise),
        profit: toRupees(item.revenuePaise - item.cogsPaise),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      stallId: validId,
      stallName,
      period,
      dateRangeMeta: period,
      kpis: {
        grossSales,
        totalDiscounts,
        totalRefunds,
        netRevenue,
        cogs,
        grossProfit,
        totalExpenses,
        netProfit,
        averageOrderValue,
        grossProfitMargin,
        netProfitMargin,
      },
      counts: {
        totalOrders: totalOrdersCount,
        paidOrders: paidOrdersCount,
        pendingOrders: pendingOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        failedPayments: failedPaymentsCount,
      },
      charts: {
        salesTrends,
        paymentMethods,
        topSellingItems,
      },
      // Direct root convenience properties for component consumption
      grossSales,
      discounts: totalDiscounts,
      refunds: totalRefunds,
      netRevenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      averageOrderValue,
      grossMargin: grossProfitMargin,
      profitMargin: netProfitMargin,
      totalOrders: totalOrdersCount,
      paidOrders: paidOrdersCount,
      pendingOrders: pendingOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      failedPayments: failedPaymentsCount,
      salesTrends,
      paymentMethods,
      topSellingItems,
      leastSellingItems: [],
      eligibleOrders,
      expenses: periodExpenses,
    };
  },

  /**
   * Convenience alias accepting either preset string or options object.
   */
  getStallFinancialAnalytics(stallId, presetOrOptions = 'thisMonth', customRange = null) {
    let options = {};
    if (typeof presetOrOptions === 'string') {
      options = {
        rangePreset: presetOrOptions,
        customStart: customRange?.startDate,
        customEnd: customRange?.endDate,
      };
    } else if (presetOrOptions && typeof presetOrOptions === 'object') {
      options = presetOrOptions;
    }
    return this.getFinancialAnalytics(stallId, options);
  },

  /**
   * Generates a fully compliant, escaped CSV string representation of the analytics report.
   */
  generateCSVReport(reportData) {
    if (!reportData || !reportData.kpis) {
      throw new Error('analyticsService: Invalid report data payload for CSV export.');
    }

    const { stallName, stallId, period, kpis, counts, charts, eligibleOrders } = reportData;

    const escape = (val) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [];

    // Header metadata
    lines.push(['FoodDesk Financial & Operations Report'].map(escape).join(','));
    lines.push(['Stall Name', stallName].map(escape).join(','));
    lines.push(['Stall ID', stallId].map(escape).join(','));
    lines.push(['Reporting Period', `${period.label} (${period.startDate} to ${period.endDate})`].map(escape).join(','));
    lines.push(['Generated On', formatDateTime(new Date())].map(escape).join(','));
    lines.push([]);

    // Executive P&L Summary Matrix
    lines.push(['--- FINANCIAL P&L STATEMENT (INR) ---'].map(escape).join(','));
    lines.push(['Metric', 'Amount (INR)', 'Formula / Business Context'].map(escape).join(','));
    lines.push(['Gross Sales', kpis.grossSales.toFixed(2), 'Sum of all item sales before discounts'].map(escape).join(','));
    lines.push(['Total Discounts', `-${kpis.totalDiscounts.toFixed(2)}`, 'Promotional and fixed price discounts'].map(escape).join(','));
    lines.push(['Total Refunds', `-${kpis.totalRefunds.toFixed(2)}`, 'Disbursed full and partial customer refunds'].map(escape).join(','));
    lines.push(['Net Revenue', kpis.netRevenue.toFixed(2), 'Gross Sales - Discounts - Refunds'].map(escape).join(','));
    lines.push(['Cost of Goods Sold (COGS)', `-${kpis.cogs.toFixed(2)}`, 'Historical cost price * quantity sold'].map(escape).join(','));
    lines.push(['Gross Profit', kpis.grossProfit.toFixed(2), 'Net Revenue - COGS'].map(escape).join(','));
    lines.push(['Operating Expenses', `-${kpis.totalExpenses.toFixed(2)}`, 'Raw materials, utilities, maintenance, salaries'].map(escape).join(','));
    lines.push(['Net Profit', kpis.netProfit.toFixed(2), 'Gross Profit - Operating Expenses'].map(escape).join(','));
    lines.push(['Gross Profit Margin', `${kpis.grossProfitMargin}%`, '(Gross Profit / Net Revenue) * 100'].map(escape).join(','));
    lines.push(['Net Profit Margin', `${kpis.netProfitMargin}%`, '(Net Profit / Net Revenue) * 100'].map(escape).join(','));
    lines.push([]);

    // Volume Statistics
    lines.push(['--- ORDER & REVENUE VOLUME METRICS ---'].map(escape).join(','));
    lines.push(['Metric', 'Count'].map(escape).join(','));
    lines.push(['Total Paid Orders', counts.paidOrders].map(escape).join(','));
    lines.push(['Average Order Value (AOV)', `INR ${kpis.averageOrderValue.toFixed(2)}`].map(escape).join(','));
    lines.push(['Pending Orders', counts.pendingOrders].map(escape).join(','));
    lines.push(['Cancelled Orders', counts.cancelledOrders].map(escape).join(','));
    lines.push(['Failed Payment Attempts', counts.failedPayments].map(escape).join(','));
    lines.push([]);

    // Top Selling Items Section
    lines.push(['--- TOP 5 BEST-SELLING ITEMS ---'].map(escape).join(','));
    lines.push(['Rank', 'Item Name', 'Category', 'Units Sold', 'Revenue (INR)', 'Profit (INR)'].map(escape).join(','));
    if (charts.topSellingItems.length === 0) {
      lines.push(['-', 'No sales recorded in this period', '-', 0, 0, 0].map(escape).join(','));
    } else {
      charts.topSellingItems.forEach((item, idx) => {
        lines.push([
          idx + 1,
          item.name,
          item.category,
          item.quantity,
          item.revenue.toFixed(2),
          item.profit.toFixed(2),
        ].map(escape).join(','));
      });
    }
    lines.push([]);

    // Detailed Itemized Transaction Ledger
    lines.push(['--- ITEMIZED ORDER TRANSACTION LEDGER ---'].map(escape).join(','));
    lines.push([
      'Order Number',
      'Created At (IST)',
      'Payment Status',
      'Payment Method',
      'Items Ordered (Qty x Name)',
      'Subtotal (INR)',
      'Discount (INR)',
      'Refunded (INR)',
      'Net Paid (INR)',
    ].map(escape).join(','));

    if (eligibleOrders.length === 0) {
      lines.push(['No transactions recorded in this period'].map(escape).join(','));
    } else {
      eligibleOrders.forEach((o) => {
        const itemSummary = Array.isArray(o.items)
          ? o.items.map((i) => `${i.quantity}x ${i.name}`).join('; ')
          : '-';
        const subtotal = Number(o.financials?.subtotal ?? o.totalAmount ?? 0);
        const discount = Number(o.financials?.discountAmount ?? o.discountAmount ?? 0);
        const refunded = Number(o.totalRefundedAmount ?? (o.paymentStatus === 'refunded' ? subtotal - discount : 0));
        const netPaid = Math.max(0, subtotal - discount - refunded);

        lines.push([
          o.orderNumber,
          formatDateTime(o.createdAt),
          o.paymentStatus,
          o.paymentMethod || 'cash',
          itemSummary,
          subtotal.toFixed(2),
          discount.toFixed(2),
          refunded.toFixed(2),
          netPaid.toFixed(2),
        ].map(escape).join(','));
      });
    }

    return lines.join('\r\n');
  },

  /**
   * Browser file download trigger for CSV exports. Accepts report data object or raw CSV string.
   */
  downloadCSVReport(reportOrCsv, optionalFilename) {
    if (typeof window === 'undefined') return;
    let csvContent = '';
    let filename = '';

    if (typeof reportOrCsv === 'string') {
      csvContent = reportOrCsv;
      filename = optionalFilename || `FoodDesk_Report_${Date.now()}.csv`;
    } else if (reportOrCsv && (reportOrCsv.kpis || reportOrCsv.grossSales !== undefined)) {
      csvContent = this.generateCSVReport(reportOrCsv);
      const cleanStallSlug = (reportOrCsv.stallId || 'stall').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanPeriod = (reportOrCsv.period?.preset || reportOrCsv.dateRangeMeta?.preset || 'report').toLowerCase();
      const todayStr = getKolkataDateOnlyString(new Date());
      filename = optionalFilename || `FoodDesk_Report_${cleanStallSlug}_${cleanPeriod}_${todayStr}.csv`;
    } else {
      throw new Error('downloadCSVReport: Invalid report payload for CSV export.');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

