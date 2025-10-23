import request from 'supertest';
import app from '../app';
import { MenuService } from '../services/MenuService';
import { Category } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock the MenuService
jest.mock('../services/MenuService');
const MockedMenuService = MenuService as jest.MockedClass<typeof MenuService>;

describe('Admin Menu API', () => {
  let mockMenuService: jest.Mocked<MenuService>;
  let adminToken: string;

  beforeEach(() => {
    mockMenuService = new MockedMenuService() as jest.Mocked<MenuService>;
    MockedMenuService.mockClear();

    // Create a mock admin token
    adminToken = jwt.sign(
      { id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/menu/admin', () => {
    const validMenuItemData = {
      name: 'New Jollof Rice',
      description: 'Delicious Nigerian jollof rice with spices',
      price: 180000,
      category: 'MAIN',
      imageUrl: 'https://example.com/new-jollof.jpg',
      preparationTime: 20,
      ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices'],
      calories: 350,
      protein: 10.5,
      carbs: 70.2,
      fat: 5.1,
      fiber: 3.3,
      sodium: 450,
    };

    const createdMenuItem = {
      id: 'menu-1',
      ...validMenuItemData,
      category: Category.MAIN,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a new menu item with valid data', async () => {
      mockMenuService.createMenuItem.mockResolvedValue(createdMenuItem);

      const response = await request(app)
        .post('/api/menu/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validMenuItemData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdMenuItem,
        message: 'Menu item created successfully',
      });

      expect(mockMenuService.createMenuItem).toHaveBeenCalledWith(validMenuItemData);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/menu/admin')
        .send(validMenuItemData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.createMenuItem).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/api/menu/admin')
        .set('Authorization', 'Bearer invalid-token')
        .send(validMenuItemData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.createMenuItem).not.toHaveBeenCalled();
    });

    it('should reject invalid menu item data', async () => {
      const invalidData = {
        name: 'A', // Too short
        description: 'Short', // Too short
        price: -100, // Negative price
        category: 'INVALID', // Invalid category
        imageUrl: 'not-a-url', // Invalid URL
        preparationTime: 0, // Invalid time
        ingredients: [], // Empty ingredients
      };

      const response = await request(app)
        .post('/api/menu/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.createMenuItem).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockMenuService.createMenuItem.mockRejectedValue(
        new Error('Menu item with this name already exists')
      );

      const response = await request(app)
        .post('/api/menu/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validMenuItemData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/menu/admin/:id', () => {
    const updateData = {
      name: 'Updated Jollof Rice',
      price: 200000,
      isAvailable: false,
    };

    const updatedMenuItem = {
      id: 'menu-1',
      name: 'Updated Jollof Rice',
      description: 'Delicious Nigerian jollof rice with spices',
      price: 200000,
      category: Category.MAIN,
      imageUrl: 'https://example.com/jollof.jpg',
      isAvailable: false,
      preparationTime: 20,
      ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices'],
      calories: 350,
      protein: 10.5,
      carbs: 70.2,
      fat: 5.1,
      fiber: 3.3,
      sodium: 450,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update menu item with valid data', async () => {
      mockMenuService.updateMenuItem.mockResolvedValue(updatedMenuItem);

      const response = await request(app)
        .put('/api/menu/admin/menu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedMenuItem,
        message: 'Menu item updated successfully',
      });

      expect(mockMenuService.updateMenuItem).toHaveBeenCalledWith('menu-1', updateData);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .put('/api/menu/admin/menu-1')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.updateMenuItem).not.toHaveBeenCalled();
    });

    it('should handle non-existent menu item', async () => {
      mockMenuService.updateMenuItem.mockRejectedValue(
        new Error('Menu item not found')
      );

      const response = await request(app)
        .put('/api/menu/admin/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid update data', async () => {
      const invalidUpdateData = {
        price: -100, // Negative price
        category: 'INVALID', // Invalid category
      };

      const response = await request(app)
        .put('/api/menu/admin/menu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.updateMenuItem).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/menu/admin/:id', () => {
    it('should delete menu item successfully', async () => {
      mockMenuService.deleteMenuItem.mockResolvedValue();

      const response = await request(app)
        .delete('/api/menu/admin/menu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'Menu item deleted successfully',
      });

      expect(mockMenuService.deleteMenuItem).toHaveBeenCalledWith('menu-1');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .delete('/api/menu/admin/menu-1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.deleteMenuItem).not.toHaveBeenCalled();
    });

    it('should handle non-existent menu item', async () => {
      mockMenuService.deleteMenuItem.mockRejectedValue(
        new Error('Menu item not found')
      );

      const response = await request(app)
        .delete('/api/menu/admin/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle menu item with existing orders', async () => {
      mockMenuService.deleteMenuItem.mockRejectedValue(
        new Error('Cannot delete menu item that has been ordered')
      );

      const response = await request(app)
        .delete('/api/menu/admin/menu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/menu/admin/:id/toggle', () => {
    const toggledMenuItem = {
      id: 'menu-1',
      name: 'Jollof Rice',
      description: 'Delicious Nigerian jollof rice with spices',
      price: 180000,
      category: Category.MAIN,
      imageUrl: 'https://example.com/jollof.jpg',
      isAvailable: false, // Toggled to false
      preparationTime: 20,
      ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices'],
      calories: 350,
      protein: 10.5,
      carbs: 70.2,
      fat: 5.1,
      fiber: 3.3,
      sodium: 450,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should toggle menu item availability', async () => {
      mockMenuService.toggleAvailability.mockResolvedValue(toggledMenuItem);

      const response = await request(app)
        .patch('/api/menu/admin/menu-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: toggledMenuItem,
        message: 'Menu item disabled successfully',
      });

      expect(mockMenuService.toggleAvailability).toHaveBeenCalledWith('menu-1');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .patch('/api/menu/admin/menu-1/toggle')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.toggleAvailability).not.toHaveBeenCalled();
    });

    it('should handle non-existent menu item', async () => {
      mockMenuService.toggleAvailability.mockRejectedValue(
        new Error('Menu item not found')
      );

      const response = await request(app)
        .patch('/api/menu/admin/non-existent/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/menu/admin/stats', () => {
    const mockStats = {
      totalItems: 15,
      availableItems: 12,
      itemsByCategory: {
        MAIN: 8,
        SIDE: 5,
        COMBO: 2,
      },
    };

    it('should return menu statistics', async () => {
      mockMenuService.getMenuStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/menu/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats,
        message: 'Menu statistics retrieved successfully',
      });

      expect(mockMenuService.getMenuStats).toHaveBeenCalled();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/menu/admin/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.getMenuStats).not.toHaveBeenCalled();
    });
  });

  describe('Authorization Tests', () => {
    let staffToken: string;

    beforeEach(() => {
      // Create a mock staff token
      staffToken = jwt.sign(
        { id: 'staff-1', role: 'STAFF', email: 'staff@test.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should allow STAFF to create menu items', async () => {
      const validMenuItemData = {
        name: 'Staff Created Item',
        description: 'Item created by staff member',
        price: 150000,
        category: 'SIDE',
        imageUrl: 'https://example.com/staff-item.jpg',
        preparationTime: 15,
        ingredients: ['Ingredient1', 'Ingredient2'],
      };

      const createdMenuItem = {
        id: 'menu-staff-1',
        ...validMenuItemData,
        category: Category.SIDE,
        isAvailable: true,
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        sodium: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMenuService.createMenuItem.mockResolvedValue(createdMenuItem);

      const response = await request(app)
        .post('/api/menu/admin')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validMenuItemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockMenuService.createMenuItem).toHaveBeenCalled();
    });

    it('should allow STAFF to update menu items', async () => {
      const updateData = { price: 160000 };
      const updatedMenuItem = {
        id: 'menu-1',
        name: 'Updated Item',
        description: 'Updated description',
        price: 160000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/updated.jpg',
        isAvailable: true,
        preparationTime: 20,
        ingredients: ['Rice', 'Spices'],
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        sodium: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMenuService.updateMenuItem.mockResolvedValue(updatedMenuItem);

      const response = await request(app)
        .put('/api/menu/admin/menu-1')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockMenuService.updateMenuItem).toHaveBeenCalled();
    });

    it('should NOT allow STAFF to delete menu items', async () => {
      const response = await request(app)
        .delete('/api/menu/admin/menu-1')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(mockMenuService.deleteMenuItem).not.toHaveBeenCalled();
    });

    it('should allow STAFF to toggle availability', async () => {
      const toggledMenuItem = {
        id: 'menu-1',
        name: 'Test Item',
        description: 'Test description',
        price: 150000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/test.jpg',
        isAvailable: false,
        preparationTime: 15,
        ingredients: ['Test'],
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        sodium: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMenuService.toggleAvailability.mockResolvedValue(toggledMenuItem);

      const response = await request(app)
        .patch('/api/menu/admin/menu-1/toggle')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockMenuService.toggleAvailability).toHaveBeenCalled();
    });
  });
});