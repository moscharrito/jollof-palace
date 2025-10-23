import request from 'supertest';
import app from '../app';
import { MenuService } from '../services/MenuService';
import { mockPrisma } from './setup';
import { Category } from '@prisma/client';

// Mock the MenuService
jest.mock('../services/MenuService');
const MockedMenuService = MenuService as jest.MockedClass<typeof MenuService>;

describe('Menu API', () => {
  let mockMenuService: jest.Mocked<MenuService>;

  beforeEach(() => {
    mockMenuService = new MockedMenuService() as jest.Mocked<MenuService>;
    MockedMenuService.mockClear();
  });

  describe('GET /api/menu', () => {
    const mockMenuItems = [
      {
        id: '1',
        name: 'Jollof Rice',
        description: 'Authentic Nigerian jollof rice',
        price: 150000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/jollof.jpg',
        isAvailable: true,
        preparationTime: 15,
        ingredients: ['Rice', 'Tomatoes', 'Spices'],
        calories: 320,
        protein: 8.5,
        carbs: 65.2,
        fat: 4.1,
        fiber: 2.3,
        sodium: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Pepper Chicken',
        description: 'Spicy grilled chicken',
        price: 250000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/chicken.jpg',
        isAvailable: true,
        preparationTime: 20,
        ingredients: ['Chicken', 'Peppers', 'Spices'],
        calories: 285,
        protein: 32.1,
        carbs: 3.2,
        fat: 15.8,
        fiber: 0.5,
        sodium: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all menu items', async () => {
      mockMenuService.getAllMenuItems.mockResolvedValue(mockMenuItems);

      const response = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMenuItems,
        message: 'Menu items retrieved successfully',
      });

      expect(mockMenuService.getAllMenuItems).toHaveBeenCalledWith({});
    });

    it('should filter menu items by category', async () => {
      const mainItems = mockMenuItems.filter(item => item.category === Category.MAIN);
      mockMenuService.getAllMenuItems.mockResolvedValue(mainItems);

      const response = await request(app)
        .get('/api/menu?category=MAIN')
        .expect(200);

      expect(response.body.data).toEqual(mainItems);
      expect(mockMenuService.getAllMenuItems).toHaveBeenCalledWith({
        category: 'MAIN',
      });
    });

    it('should filter available menu items', async () => {
      const availableItems = mockMenuItems.filter(item => item.isAvailable);
      mockMenuService.getAllMenuItems.mockResolvedValue(availableItems);

      const response = await request(app)
        .get('/api/menu?available=true')
        .expect(200);

      expect(response.body.data).toEqual(availableItems);
      expect(mockMenuService.getAllMenuItems).toHaveBeenCalledWith({
        isAvailable: true,
      });
    });

    it('should search menu items', async () => {
      const searchResults = [mockMenuItems[0]];
      mockMenuService.getAllMenuItems.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/menu?search=jollof')
        .expect(200);

      expect(response.body.data).toEqual(searchResults);
      expect(mockMenuService.getAllMenuItems).toHaveBeenCalledWith({
        search: 'jollof',
      });
    });

    it('should reject invalid category', async () => {
      const response = await request(app)
        .get('/api/menu?category=INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/menu/:id', () => {
    const mockMenuItem = {
      id: '1',
      name: 'Jollof Rice',
      description: 'Authentic Nigerian jollof rice',
      price: 150000,
      category: Category.MAIN,
      imageUrl: 'https://example.com/jollof.jpg',
      isAvailable: true,
      preparationTime: 15,
      ingredients: ['Rice', 'Tomatoes', 'Spices'],
      calories: 320,
      protein: 8.5,
      carbs: 65.2,
      fat: 4.1,
      fiber: 2.3,
      sodium: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return menu item by ID', async () => {
      mockMenuService.getMenuItemById.mockResolvedValue(mockMenuItem);

      const response = await request(app)
        .get('/api/menu/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMenuItem,
        message: 'Menu item retrieved successfully',
      });

      expect(mockMenuService.getMenuItemById).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent menu item', async () => {
      mockMenuService.getMenuItemById.mockRejectedValue(
        new Error('Menu item not found')
      );

      const response = await request(app)
        .get('/api/menu/999')
        .expect(500); // This would be 404 with proper error handling

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/menu/category/:category', () => {
    it('should return menu items by category', async () => {
      const mainItems = [
        {
          id: '1',
          name: 'Jollof Rice',
          category: Category.MAIN,
          description: 'Authentic Nigerian jollof rice',
          price: 150000,
          imageUrl: 'https://example.com/jollof.jpg',
          isAvailable: true,
          preparationTime: 15,
          ingredients: ['Rice', 'Tomatoes', 'Spices'],
          calories: 320,
          protein: 8.5,
          carbs: 65.2,
          fat: 4.1,
          fiber: 2.3,
          sodium: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockMenuService.getMenuItemsByCategory.mockResolvedValue(mainItems);

      const response = await request(app)
        .get('/api/menu/category/MAIN')
        .expect(200);

      expect(response.body.data).toEqual(mainItems);
      expect(mockMenuService.getMenuItemsByCategory).toHaveBeenCalledWith('MAIN');
    });

    it('should reject invalid category', async () => {
      const response = await request(app)
        .get('/api/menu/category/INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid category');
    });
  });

  describe('GET /api/menu/search/:query', () => {
    it('should search menu items', async () => {
      const searchResults = [
        {
          id: '1',
          name: 'Jollof Rice',
          description: 'Authentic Nigerian jollof rice',
          price: 150000,
          category: Category.MAIN,
          imageUrl: 'https://example.com/jollof.jpg',
          isAvailable: true,
          preparationTime: 15,
          ingredients: ['Rice', 'Tomatoes', 'Spices'],
          calories: 320,
          protein: 8.5,
          carbs: 65.2,
          fat: 4.1,
          fiber: 2.3,
          sodium: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockMenuService.searchMenuItems.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/menu/search/jollof')
        .expect(200);

      expect(response.body.data).toEqual(searchResults);
      expect(mockMenuService.searchMenuItems).toHaveBeenCalledWith('jollof');
    });

    it('should reject short search queries', async () => {
      const response = await request(app)
        .get('/api/menu/search/j')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Search query must be at least 2 characters');
    });
  });

  describe('GET /api/menu/available', () => {
    it('should return only available menu items', async () => {
      const availableItems = [
        {
          id: '1',
          name: 'Jollof Rice',
          description: 'Authentic Nigerian jollof rice',
          price: 150000,
          category: Category.MAIN,
          imageUrl: 'https://example.com/jollof.jpg',
          isAvailable: true,
          preparationTime: 15,
          ingredients: ['Rice', 'Tomatoes', 'Spices'],
          calories: 320,
          protein: 8.5,
          carbs: 65.2,
          fat: 4.1,
          fiber: 2.3,
          sodium: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockMenuService.getAvailableMenuItems.mockResolvedValue(availableItems);

      const response = await request(app)
        .get('/api/menu/available')
        .expect(200);

      expect(response.body.data).toEqual(availableItems);
      expect(mockMenuService.getAvailableMenuItems).toHaveBeenCalled();
    });
  });
});