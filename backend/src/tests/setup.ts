import { PrismaClient } from '@prisma/client';

// Mock Prisma client for testing
export const mockPrisma = {
  menuItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  adminUser: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  systemSetting: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Cleanup after all tests
  await mockPrisma.$disconnect();
});

// Test helper functions for analytics tests
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createTestAdmin() {
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  
  return await prisma.adminUser.create({
    data: {
      email: 'test@admin.com',
      name: 'Test Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
}

export async function createTestMenuItems() {
  const items = [
    {
      name: 'Jollof Rice with Chicken',
      description: 'Spicy jollof rice with grilled chicken',
      price: 1500, // $15.00 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/jollof-chicken.jpg',
      preparationTime: 25,
      ingredients: ['rice', 'chicken', 'tomatoes', 'spices'],
    },
    {
      name: 'Pepper Beef',
      description: 'Tender beef in spicy pepper sauce',
      price: 1800, // $18.00 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/pepper-beef.jpg',
      preparationTime: 30,
      ingredients: ['beef', 'peppers', 'onions', 'spices'],
    },
    {
      name: 'Dodo (Fried Plantain)',
      description: 'Sweet fried plantain slices',
      price: 800, // $8.00 in cents
      category: 'SIDE' as const,
      imageUrl: 'https://example.com/dodo.jpg',
      preparationTime: 15,
      ingredients: ['plantain', 'oil'],
    },
  ];

  return await Promise.all(
    items.map(item => prisma.menuItem.create({ data: item }))
  );
}

export async function createTestOrders(menuItems: any[]) {
  const orders = [];
  
  // Create orders for the last 30 days
  for (let i = 0; i < 30; i++) {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - i);
    
    // Create 1-3 orders per day
    const ordersPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < ordersPerDay; j++) {
      const orderTime = new Date(orderDate);
      orderTime.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
      orderTime.setMinutes(Math.floor(Math.random() * 60));
      
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          customerName: `Customer ${i}-${j}`,
          customerPhone: `+1234567${String(i).padStart(3, '0')}`,
          customerEmail: `customer${i}${j}@test.com`,
          orderType: Math.random() > 0.5 ? 'PICKUP' : 'DELIVERY',
          subtotal: 0, // Will be calculated
          tax: 0, // Will be calculated
          total: 0, // Will be calculated
          status: 'COMPLETED',
          estimatedReadyTime: new Date(orderTime.getTime() + 30 * 60 * 1000),
          actualReadyTime: new Date(orderTime.getTime() + 25 * 60 * 1000),
          createdAt: orderTime,
        },
      });

      // Add 1-3 items to each order
      const itemsPerOrder = Math.floor(Math.random() * 3) + 1;
      let orderSubtotal = 0;
      
      for (let k = 0; k < itemsPerOrder; k++) {
        const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const totalPrice = menuItem.price * quantity;
        
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: menuItem.id,
            quantity,
            unitPrice: menuItem.price,
            totalPrice,
          },
        });
        
        orderSubtotal += totalPrice;
      }
      
      const tax = Math.floor(orderSubtotal * 0.08); // 8% tax
      const total = orderSubtotal + tax;
      
      // Update order totals
      await prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal: orderSubtotal,
          tax,
          total,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          currency: 'USD',
          method: ['CARD', 'PAYPAL', 'APPLE_PAY'][Math.floor(Math.random() * 3)] as any,
          status: 'COMPLETED',
          reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: orderTime,
        },
      });
      
      orders.push(order);
    }
  }
  
  return orders;
}