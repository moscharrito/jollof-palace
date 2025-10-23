import request from 'supertest';
import { Category } from '@prisma/client';

// Mock the database first
jest.mock('../lib/database', () => ({
  prisma: {
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
    orderItem: {
      count: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('../middleware/adminAuth', () => ({
  authenticateAdmin: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    next();
  },
  requireAdminRole: () => (req: any, res: any, next: any) => next(),
  requireManagerRole: () => (req: any, res: any, next: any) => next(),
}));

// Mock auth middleware
jest.mock('../lib/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    next();
  },
  authorize: () => (req: any, res: any, next: any) => next(),
}));

// Import app after mocks
import app from '../app';

describe('Menu Management API', () => {
  let testMenuItemId: string;
  let mockPrisma: any;

  beforeEach(() => {
    testMenuItemId = 'test-menu-item-1';
    jest.clearAllMocks();
    
    // Get the mocked prisma instance
    mockPrisma = require('../lib/database').prisma;
  });

  describe('POST /api/menu/admin', () => {
    it('should create a new menu item', async () => {
      const menuItemData = {
        name: 'Test Jollof Rice',
        description: 'Delicious test jollof rice with spices',
        price: 1500, // $15.00 in cents
        category: 'MAIN' as Category,
        imageUrl: 'https://example.com/jollof.jpg',
        preparationTime: 25,
        ingredients: ['rice', 'tomatoes', 'onions', 'spices'],
        calories: 450,
        protein: 12.5,
        carbs: 65.0,
        fat: 8.2,
      };

      const mockCreatedItem = {
        id: testMenuItemId,
        ...menuItemData,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.menuItem.findFirst.mockResolvedValue(null); // No existing item
      mockPrisma.menuItem.create.mockResolvedValue(mockCreatedItem);

      const response = await request(app)
        .post('/api/menu/admin')
        .send(menuItemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: menuItemData.name,
        description: menuItemData.description,
        price: menuItemData.price,
        category: menuItemData.category,
        isAvailable: true,
      });

      expect(mockPrisma.menuItem.create).toHaveBeenCalledWith({
        data: {
          ...menuItemData,
          isAvailable: true,
        },
      });
    });

    it('should reject invalid menu item data', async () => {
      const invalidData = {
        name: '', // Empty name should be rejected
        description: 'Test description',
        price: -100, // Negative price should be rejected
        category: 'INVALID_CATEGORY',
      };

      await request(app)
        .post('/api/menu/admin')
        .send(invalidData)
        .expect(400);
    });

    it('should reject duplicate menu item names', async () => {
      const duplicateData = {
        name: 'Test Jollof Rice', // Same name as created above
        description: 'Another jollof rice',
        price: 1600,
        category: 'MAIN' as Category,
        imageUrl: 'https://example.com/jollof2.jpg',
        preparationTime: 30,
        ingredients: ['rice', 'tomatoes'],
      };

      // Mock existing item with same name
      mockPrisma.menuItem.findFirst.mockResolvedValue({
        id: 'existing-id',
        name: 'Test Jollof Rice',
      });

      await request(app)
        .post('/api/menu/admin')
        .send(duplicateData)
        .expect(409);
    });
  });

  describe('PUT /api/menu/admin/:id', () => {
    it('should update an existing menu item', async () => {
      const updateData = {
        name: 'Updated Jollof Rice',
        description: 'Updated description with more details',
        price: 1700,
        preparationTime: 30,
      };

      const existingItem = {
        id: testMenuItemId,
        name: 'Test Jollof Rice',
        description: 'Original description',
        price: 1500,
        preparationTime: 25,
      };

      const updatedItem = { ...existingItem, ...updateData };

      mockPrisma.menuItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.menuItem.findFirst.mockResolvedValue(null); // No name conflict
      mockPrisma.menuItem.update.mockResolvedValue(updatedItem);

      const response = await request(app)
        .put(`/api/menu/admin/${testMenuItemId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
    });

    it('should return 404 for non-existent menu item', async () => {
      const updateData = {
        name: 'Non-existent Item',
        price: 1000,
      };

      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await request(app)
        .put('/api/menu/admin/non-existent-id')
        .send(updateData)
        .expect(404);
    });
  });

  describe('PATCH /api/menu/admin/:id/toggle', () => {
    it('should toggle menu item availability', async () => {
      const existingItem = {
        id: testMenuItemId,
        name: 'Test Item',
        isAvailable: true,
      };

      const toggledItem = { ...existingItem, isAvailable: false };

      mockPrisma.menuItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.menuItem.update.mockResolvedValue(toggledItem);

      const response = await request(app)
        .patch(`/api/menu/admin/${testMenuItemId}/toggle`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isAvailable).toBe(false);
    });
  });

  describe('GET /api/menu/admin/analytics', () => {
    it('should return menu analytics data', async () => {
      const mockAnalytics = [
        {
          itemId: testMenuItemId,
          name: 'Test Item',
          category: 'MAIN',
          totalOrders: 1,
          totalQuantitySold: 2,
          totalRevenue: 3400,
          averageOrderValue: 3400,
          popularityRank: 1,
          salesTrend: 'stable',
        },
      ];

      // Mock the menu items with order items
      mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: testMenuItemId,
          name: 'Test Item',
          category: 'MAIN',
          orderItems: [
            {
              quantity: 2,
              totalPrice: 3400,
              order: { createdAt: new Date(), status: 'COMPLETED' },
            },
          ],
        },
      ]);

      const response = await request(app)
        .get('/api/menu/admin/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/menu/admin/stats', () => {
    it('should return menu statistics', async () => {
      const mockStats = {
        totalItems: 5,
        availableItems: 4,
        itemsByCategory: { MAIN: 3, SIDE: 2, COMBO: 0 },
      };

      mockPrisma.menuItem.count
        .mockResolvedValueOnce(5) // totalItems
        .mockResolvedValueOnce(4); // availableItems

      mockPrisma.menuItem.groupBy.mockResolvedValue([
        { category: 'MAIN', _count: { id: 3 } },
        { category: 'SIDE', _count: { id: 2 } },
      ]);

      const response = await request(app)
        .get('/api/menu/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('availableItems');
      expect(response.body.data).toHaveProperty('itemsByCategory');
      expect(typeof response.body.data.totalItems).toBe('number');
      expect(typeof response.body.data.availableItems).toBe('number');
    });
  });

  describe('DELETE /api/menu/admin/:id', () => {
    it('should prevent deletion of menu item with orders', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue({ id: testMenuItemId });
      mockPrisma.orderItem.count.mockResolvedValue(1); // Has orders

      await request(app)
        .delete(`/api/menu/admin/${testMenuItemId}`)
        .expect(409); // Conflict - item has orders
    });

    it('should delete menu item without orders', async () => {
      const deletableItemId = 'deletable-item-id';
      
      mockPrisma.menuItem.findUnique.mockResolvedValue({ id: deletableItemId });
      mockPrisma.orderItem.count.mockResolvedValue(0); // No orders
      mockPrisma.menuItem.delete.mockResolvedValue({ id: deletableItemId });

      await request(app)
        .delete(`/api/menu/admin/${deletableItemId}`)
        .expect(200);

      expect(mockPrisma.menuItem.delete).toHaveBeenCalledWith({
        where: { id: deletableItemId },
      });
    });
  });
});