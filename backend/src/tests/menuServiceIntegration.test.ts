import { MenuService } from '../services/MenuService';
import { prisma } from '../lib/database';
import { Category } from '@prisma/client';

describe('MenuService Integration Tests', () => {
  let menuService: MenuService;
  let testMenuItemId: string;

  beforeAll(async () => {
    menuService = new MenuService();
    
    // Clean up any existing test data
    await prisma.menuItem.deleteMany({
      where: { name: { contains: 'Test Menu Service' } },
    });

    // Create a test menu item
    const testMenuItem = await prisma.menuItem.create({
      data: {
        name: 'Test Menu Service Jollof Rice',
        description: 'Test Nigerian jollof rice with spices for service testing',
        price: 150000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/test-service-jollof.jpg',
        preparationTime: 15,
        ingredients: ['Rice', 'Tomatoes', 'Spices'],
        isAvailable: true,
        calories: 320,
        protein: 8.5,
        carbs: 65.2,
        fat: 4.1,
        fiber: 2.3,
        sodium: 450,
      },
    });

    testMenuItemId = testMenuItem.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.menuItem.deleteMany({
      where: { name: { contains: 'Test Menu Service' } },
    });
    await prisma.$disconnect();
  });

  describe('getAllMenuItems', () => {
    it('should return all menu items without filters', async () => {
      const items = await menuService.getAllMenuItems();
      
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      
      // Should include our test item
      const testItem = items.find(item => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
      expect(testItem?.name).toBe('Test Menu Service Jollof Rice');
    });

    it('should filter by category', async () => {
      const mainItems = await menuService.getAllMenuItems({ category: Category.MAIN });
      
      expect(Array.isArray(mainItems)).toBe(true);
      mainItems.forEach(item => {
        expect(item.category).toBe(Category.MAIN);
      });
      
      // Should include our test item
      const testItem = mainItems.find(item => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
    });

    it('should filter by availability', async () => {
      const availableItems = await menuService.getAllMenuItems({ isAvailable: true });
      
      expect(Array.isArray(availableItems)).toBe(true);
      availableItems.forEach(item => {
        expect(item.isAvailable).toBe(true);
      });
      
      // Should include our test item
      const testItem = availableItems.find(item => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
    });

    it('should search by name', async () => {
      const searchResults = await menuService.getAllMenuItems({ search: 'Test Menu Service' });
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThan(0);
      
      // Should include our test item
      const testItem = searchResults.find(item => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
    });
  });

  describe('getMenuItemById', () => {
    it('should return menu item by ID', async () => {
      const item = await menuService.getMenuItemById(testMenuItemId);
      
      expect(item).toBeDefined();
      expect(item.id).toBe(testMenuItemId);
      expect(item.name).toBe('Test Menu Service Jollof Rice');
      expect(item.category).toBe(Category.MAIN);
      expect(item.isAvailable).toBe(true);
    });

    it('should throw error for non-existent ID', async () => {
      await expect(menuService.getMenuItemById('non-existent-id')).rejects.toThrow('Menu item not found');
    });
  });

  describe('createMenuItem', () => {
    it('should create new menu item', async () => {
      const newItemData = {
        name: 'Test Menu Service New Item',
        description: 'A new test item created by service',
        price: 200000,
        category: Category.SIDE,
        imageUrl: 'https://example.com/new-test-item.jpg',
        preparationTime: 10,
        ingredients: ['Test Ingredient'],
        calories: 150,
        protein: 5.0,
        carbs: 30.0,
        fat: 2.0,
        fiber: 1.0,
        sodium: 200,
      };

      const createdItem = await menuService.createMenuItem(newItemData);
      
      expect(createdItem).toBeDefined();
      expect(createdItem.name).toBe(newItemData.name);
      expect(createdItem.category).toBe(Category.SIDE);
      expect(createdItem.isAvailable).toBe(true);
      
      // Clean up
      await prisma.menuItem.delete({ where: { id: createdItem.id } });
    });

    it('should throw error for duplicate name', async () => {
      const duplicateData = {
        name: 'Test Menu Service Jollof Rice', // Same as existing
        description: 'Duplicate item',
        price: 100000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/duplicate.jpg',
        preparationTime: 10,
        ingredients: ['Test'],
      };

      await expect(menuService.createMenuItem(duplicateData)).rejects.toThrow('Menu item with this name already exists');
    });
  });

  describe('updateMenuItem', () => {
    it('should update menu item', async () => {
      const updateData = {
        price: 180000,
        description: 'Updated description for test item',
      };

      const updatedItem = await menuService.updateMenuItem(testMenuItemId, updateData);
      
      expect(updatedItem).toBeDefined();
      expect(updatedItem.price).toBe(180000);
      expect(updatedItem.description).toBe('Updated description for test item');
      expect(updatedItem.name).toBe('Test Menu Service Jollof Rice'); // Should remain unchanged
    });

    it('should throw error for non-existent item', async () => {
      const updateData = { price: 100000 };
      
      await expect(menuService.updateMenuItem('non-existent-id', updateData)).rejects.toThrow('Menu item not found');
    });
  });

  describe('toggleAvailability', () => {
    it('should toggle availability', async () => {
      // First toggle to false
      const toggledItem = await menuService.toggleAvailability(testMenuItemId);
      expect(toggledItem.isAvailable).toBe(false);
      
      // Toggle back to true
      const toggledBackItem = await menuService.toggleAvailability(testMenuItemId);
      expect(toggledBackItem.isAvailable).toBe(true);
    });

    it('should throw error for non-existent item', async () => {
      await expect(menuService.toggleAvailability('non-existent-id')).rejects.toThrow('Menu item not found');
    });
  });

  describe('getAvailableMenuItems', () => {
    it('should return only available items', async () => {
      const availableItems = await menuService.getAvailableMenuItems();
      
      expect(Array.isArray(availableItems)).toBe(true);
      availableItems.forEach(item => {
        expect(item.isAvailable).toBe(true);
      });
    });
  });

  describe('searchMenuItems', () => {
    it('should search menu items', async () => {
      const searchResults = await menuService.searchMenuItems('jollof');
      
      expect(Array.isArray(searchResults)).toBe(true);
      
      // Should include our test item
      const testItem = searchResults.find(item => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
    });
  });

  describe('getMenuStats', () => {
    it('should return menu statistics', async () => {
      const stats = await menuService.getMenuStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.availableItems).toBe('number');
      expect(typeof stats.itemsByCategory).toBe('object');
      expect(stats.totalItems).toBeGreaterThan(0);
      expect(stats.availableItems).toBeGreaterThan(0);
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete menu item', async () => {
      // Create a temporary item to delete
      const tempItem = await prisma.menuItem.create({
        data: {
          name: 'Test Menu Service Temp Delete Item',
          description: 'Temporary item for deletion test',
          price: 100000,
          category: Category.SIDE,
          imageUrl: 'https://example.com/temp.jpg',
          preparationTime: 5,
          ingredients: ['Temp'],
          isAvailable: true,
        },
      });

      // Delete the item
      await menuService.deleteMenuItem(tempItem.id);
      
      // Verify it's deleted
      await expect(menuService.getMenuItemById(tempItem.id)).rejects.toThrow('Menu item not found');
    });

    it('should throw error for non-existent item', async () => {
      await expect(menuService.deleteMenuItem('non-existent-id')).rejects.toThrow('Menu item not found');
    });
  });
});