/**
 * Centralized Demo Stalls Seed Data
 * 3 distinct stalls mapped to owner_1 and owner_2.
 */

export const initialStalls = [
  {
    id: 'stall-1',
    ownerId: 'owner_1',
    ownerName: 'Rahul Sharma',
    ownerEmail: 'owner1@gmail.com',
    name: 'Fast Food Stall',
    slug: 'fast-food-stall',
    category: 'Fast Food & Snacks',
    description: 'Hot burgers, crispy fries, steaming momos, and fresh pizza slices made to order.',
    contactNumber: '+91 98765 11111',
    address: {
      street: 'Counter #04, Food Street Plaza',
      landmark: 'Near City Metro Gate 2',
      city: 'Indore',
      pincode: '452001',
    },
    operatingHours: {
      openingTime: '11:00 AM',
      closingTime: '11:30 PM',
      daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    paymentSettings: {
      upiId: 'fastfood@okhdfcbank',
      payeeName: 'Fast Food Stall POS',
      staticQrImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
      allowCash: true,
      allowStaticQr: true,
      allowDynamicGatewayQr: true,
    },
    status: 'active', // 'pending_approval' | 'active' | 'inactive' | 'suspended'
    createdAt: '2026-10-15T00:00:00.000Z',
  },
  {
    id: 'stall-2',
    ownerId: 'owner_1',
    ownerName: 'Rahul Sharma',
    ownerEmail: 'owner1@gmail.com',
    name: 'Beverages Stall',
    slug: 'beverages-stall',
    category: 'Shakes, Teas & Cold Beverages',
    description: 'Fresh fruit juices, chilled thick milkshakes, signature cold coffees, and piping hot masala chai.',
    contactNumber: '+91 98765 11111',
    address: {
      street: 'Kiosk #12, Central Food Court',
      landmark: 'Opposite Multiplex',
      city: 'Indore',
      pincode: '452001',
    },
    operatingHours: {
      openingTime: '09:00 AM',
      closingTime: '11:00 PM',
      daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    paymentSettings: {
      upiId: 'beverages@icici',
      payeeName: 'Beverages Counter POS',
      staticQrImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
      allowCash: true,
      allowStaticQr: true,
      allowDynamicGatewayQr: true,
    },
    status: 'active',
    createdAt: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'stall-3',
    ownerId: 'owner_2',
    ownerName: 'Priya Patel',
    ownerEmail: 'owner2@gmail.com',
    name: 'Desserts & Sweets Stall',
    slug: 'desserts-sweets-stall',
    category: 'Bakery, Sweets & Ice Creams',
    description: 'Decadent chocolate pastries, warm waffles, authentic gulab jamun, and artisanal cheesecake slices.',
    contactNumber: '+91 98765 22222',
    address: {
      street: 'Shop #08, Corner Delight Boulevard',
      landmark: 'Near Gandhi Hall',
      city: 'Indore',
      pincode: '452007',
    },
    operatingHours: {
      openingTime: '12:00 PM',
      closingTime: '12:00 AM',
      daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    paymentSettings: {
      upiId: 'desserts@paytm',
      payeeName: 'Desserts & Sweets POS',
      staticQrImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
      allowCash: true,
      allowStaticQr: true,
      allowDynamicGatewayQr: true,
    },
    status: 'active',
    createdAt: '2026-10-20T00:00:00.000Z',
  },
];

