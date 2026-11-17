/**
 * Centralized Demo Expenses Seed Data
 * Pre-seeded business expenses categorized per stall.
 */

export const initialExpenses = [
  // Fast Food Stall (stall-1) Expenses
  {
    id: 'exp-ff-01',
    stallId: 'stall-1',
    category: 'raw_materials',
    description: 'Fresh vegetables, burger buns, and dairy butter from wholesale market',
    amount: 1450,
    date: '2026-11-12T08:00:00.000Z',
    recordedBy: 'owner_1',
  },
  {
    id: 'exp-ff-02',
    stallId: 'stall-1',
    category: 'gas',
    description: 'Commercial 19kg LPG cylinder refilling',
    amount: 1850,
    date: '2026-11-10T10:30:00.000Z',
    recordedBy: 'owner_1',
  },

  // Beverages Stall (stall-2) Expenses
  {
    id: 'exp-bev-01',
    stallId: 'stall-2',
    category: 'raw_materials',
    description: 'Fresh milk pouches, coffee beans, and tea powder stock',
    amount: 850,
    date: '2026-11-12T07:30:00.000Z',
    recordedBy: 'owner_1',
  },

  // Desserts Stall (stall-3) Expenses
  {
    id: 'exp-des-01',
    stallId: 'stall-3',
    category: 'raw_materials',
    description: 'Dark cocoa blocks, butter, cream cheese, and chocolate chips',
    amount: 1200,
    date: '2026-11-12T09:00:00.000Z',
    recordedBy: 'owner_2',
  },
];

