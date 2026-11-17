/**
 * Centralized Demo Orders Seed Data
 * Pre-seeded orders across the 3 stalls with historical snapshots.
 */

export const initialOrders = [
  // Fast Food Stall (stall-1) Orders
  {
    id: 'ord-ff-001',
    stallId: 'stall-1',
    orderNumber: 'ORD-20261112-0001',
    pickupToken: 1,
    customerMobile: '+91 98765 43210',
    items: [
      {
        menuItemId: 'ff-01',
        name: 'Veg Burger',
        category: 'Burgers',
        sellingPrice: 70,
        costPrice: 35,
        quantity: 2,
        itemTotal: 140,
      },
      {
        menuItemId: 'ff-06',
        name: 'French Fries',
        category: 'Fries',
        sellingPrice: 70,
        costPrice: 30,
        quantity: 1,
        itemTotal: 70,
      },
    ],
    financials: {
      subtotal: 210,
      discountAmount: 10,
      grandTotal: 200,
      totalCostOfGoodsSold: 100,
    },
    orderStatus: 'completed',
    paymentStatus: 'successful',
    paymentMethod: 'upi_gateway',
    paymentDetails: {
      transactionRef: 'UPI-RAZOR-908123',
      verifiedAt: '2026-11-12T12:30:00.000Z',
    },
    createdAt: '2026-11-12T12:28:00.000Z',
  },
  {
    id: 'ord-ff-002',
    stallId: 'stall-1',
    orderNumber: 'ORD-20261112-0002',
    pickupToken: 2,
    customerMobile: '+91 98111 22233',
    items: [
      {
        menuItemId: 'ff-03',
        name: 'Chicken Burger',
        category: 'Burgers',
        sellingPrice: 130,
        costPrice: 70,
        quantity: 1,
        itemTotal: 130,
      },
      {
        menuItemId: 'ff-07',
        name: 'Peri Peri Fries',
        category: 'Fries',
        sellingPrice: 85,
        costPrice: 38,
        quantity: 1,
        itemTotal: 85,
      },
    ],
    financials: {
      subtotal: 215,
      discountAmount: 0,
      grandTotal: 215,
      totalCostOfGoodsSold: 108,
    },
    orderStatus: 'ready',
    paymentStatus: 'successful',
    paymentMethod: 'upi_static_qr',
    paymentDetails: {
      transactionRef: 'UTR123456789012',
      verifiedAt: '2026-11-12T13:15:00.000Z',
    },
    createdAt: '2026-11-12T13:12:00.000Z',
  },

  // Beverages Stall (stall-2) Orders
  {
    id: 'ord-bev-001',
    stallId: 'stall-2',
    orderNumber: 'ORD-20261112-0001',
    pickupToken: 1,
    customerMobile: '+91 97777 88888',
    items: [
      {
        menuItemId: 'bev-01',
        name: 'Cold Coffee',
        category: 'Cold Beverages',
        sellingPrice: 80,
        costPrice: 35,
        quantity: 2,
        itemTotal: 160,
      },
    ],
    financials: {
      subtotal: 160,
      discountAmount: 0,
      grandTotal: 160,
      totalCostOfGoodsSold: 70,
    },
    orderStatus: 'completed',
    paymentStatus: 'successful',
    paymentMethod: 'cash',
    paymentDetails: {
      transactionRef: 'CASH-REC-001',
      cashTendered: 200,
      changeReturned: 40,
      verifiedAt: '2026-11-12T14:10:00.000Z',
    },
    createdAt: '2026-11-12T14:08:00.000Z',
  },

  // Desserts Stall (stall-3) Orders
  {
    id: 'ord-des-001',
    stallId: 'stall-3',
    orderNumber: 'ORD-20261112-0001',
    pickupToken: 1,
    customerMobile: '+91 96666 55555',
    items: [
      {
        menuItemId: 'des-01',
        name: 'Chocolate Brownie',
        category: 'Pastries',
        sellingPrice: 90,
        costPrice: 45,
        quantity: 2,
        itemTotal: 180,
      },
      {
        menuItemId: 'des-07',
        name: 'Gulab Jamun (2 pcs)',
        category: 'Traditional',
        sellingPrice: 50,
        costPrice: 22,
        quantity: 1,
        itemTotal: 50,
      },
    ],
    financials: {
      subtotal: 230,
      discountAmount: 0,
      grandTotal: 230,
      totalCostOfGoodsSold: 112,
    },
    orderStatus: 'completed',
    paymentStatus: 'successful',
    paymentMethod: 'upi_gateway',
    paymentDetails: {
      transactionRef: 'UPI-RAZOR-882190',
      verifiedAt: '2026-11-12T16:20:00.000Z',
    },
    createdAt: '2026-11-12T16:18:00.000Z',
  },
];

