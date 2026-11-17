/**
 * Centralized Demo Inventory Seed Data
 * Raw ingredients and stock levels per stall.
 */

export const initialInventory = [
  // Fast Food Stall (stall-1)
  {
    id: 'inv-ff-01',
    stallId: 'stall-1',
    name: 'Burger Buns (Pack of 12)',
    unit: 'packets',
    currentStock: 25,
    minThreshold: 10,
    costPerUnit: 40,
  },
  {
    id: 'inv-ff-02',
    stallId: 'stall-1',
    name: 'Vegetable Patties',
    unit: 'units',
    currentStock: 48,
    minThreshold: 15,
    costPerUnit: 18,
  },
  {
    id: 'inv-ff-03',
    stallId: 'stall-1',
    name: 'Cheese Slices',
    unit: 'packets',
    currentStock: 4, // Below minimum threshold (Low Stock demo)
    minThreshold: 8,
    costPerUnit: 120,
  },

  // Beverages Stall (stall-2)
  {
    id: 'inv-bev-01',
    stallId: 'stall-2',
    name: 'Whole Milk',
    unit: 'litres',
    currentStock: 30,
    minThreshold: 10,
    costPerUnit: 60,
  },
  {
    id: 'inv-bev-02',
    stallId: 'stall-2',
    name: 'Coffee Beans (Dark Roast)',
    unit: 'kg',
    currentStock: 1.5, // Below threshold
    minThreshold: 3,
    costPerUnit: 450,
  },

  // Desserts Stall (stall-3)
  {
    id: 'inv-des-01',
    stallId: 'stall-3',
    name: 'Dark Chocolate Slab (55%)',
    unit: 'kg',
    currentStock: 5,
    minThreshold: 2,
    costPerUnit: 380,
  },
  {
    id: 'inv-des-02',
    stallId: 'stall-3',
    name: 'Cream Cheese',
    unit: 'kg',
    currentStock: 0.8, // Below threshold
    minThreshold: 2,
    costPerUnit: 520,
  },
];

