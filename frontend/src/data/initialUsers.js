/**
 * Centralized Demo Users Seed Data
 * Contains Super Admin and two distinct Stall Owners with defined stall authorizations.
 */

export const initialUsers = [
  {
    id: 'user_admin',
    name: 'Platform Administrator',
    email: 'admin@gmail.com',
    password: 'admin',
    role: 'super_admin',
    phone: '+91 98765 00000',
    authorizedStalls: [], // Global platform oversight
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'owner_1',
    name: 'Rahul Sharma',
    email: 'owner1@gmail.com',
    password: 'owner1',
    role: 'stall_owner',
    phone: '+91 98765 11111',
    // Authorized for Fast Food Stall (stall-1) AND Beverages Stall (stall-2)
    authorizedStalls: ['stall-1', 'stall-2'],
    createdAt: '2026-10-15T00:00:00.000Z',
  },
  {
    id: 'owner_2',
    name: 'Priya Patel',
    email: 'owner2@gmail.com',
    password: 'owner2',
    role: 'stall_owner',
    phone: '+91 98765 22222',
    // Strictly authorized for Desserts & Sweets Stall (stall-3) ONLY
    authorizedStalls: ['stall-3'],
    createdAt: '2026-10-20T00:00:00.000Z',
  },
];

