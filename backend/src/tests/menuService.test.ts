import { MenuService } from '../services/MenuService';
import { mockPrisma } from './setup';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

// Mock the database
jest.mock('../lib/database', () => ({
  prisma: mockPrisma,
}));

// Mock the cache
jest.mock('../lib/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
}));

describe('MenuService', () => {
  let menuService: MenuService;

  beforeEach(() => {
    menuService = new MenuService();
    jest.clearAllMocks();
  });

  describe('getAllMenuItems', () => {
    const mockMenuItems = [
      {
        id: '1',
        name: 'Jollof Rice',
        description: 'Authentic Nigerian jollof rice',
        price: 150000,
        category: 'MAIN',
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

    it('should return all menu items', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await menuService.getAllMenuItems();

      expect(result).toEqual(mockMenuItems);
      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });

    it('should filter by category', async () => {
      const mainItems = mockMenuItems.filter(item => item.category === 'MAIN');
      mockPrisma.menuItem.findMany.mockResolvedValue(mainItems);

      const result = await menuService.getAllMenuItems({ category: 'MAIN' });

      expect(result).toEqual(mainItems);
      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
        where: { category: 'MAIN' },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });

    it('should filter by availability', async () => {
      const availableItems = mockMenuItems.filter(item => item.isAvailable);
      mockPrisma.menuItem.findMany.mockResolvedValue(availableItems);

      const result = await menuService.getAllMenuItems({ isAvailable: true });

      expect(result).toEqual(availableItems);
      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
        where: { isAvailable: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });

    it('should search menu items', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await menuService.getAllMenuItems({ search: 'jollof' });

      expect(result).toEqual(mockMenuItems);
      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'jollof', mode: 'insensitive' } },
            { description: { contains: 'jollof', mode: 'insensitive' } },
            { ingredients: { has: 'jollof' } },
          ],
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });
    });
  });

  describe('getMenuItemById', () => {
    const mockMenuItem = {
      id: '1',
      name: 'Jollof Rice',
      description: 'Authentic Nigerian jollof rice',
      price: 150000,
      category: 'MAIN',
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
      mockPrisma.menuItem.findUnique.mockResolvedValue(mockMenuItem);

      const result = await menuService.getMenuItemById('1');

      expect(result).toEqual(mockMenuItem);
      expect(mockPrisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundError for non-existent item', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(menuService.getMenuItemById('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createMenuItem', () => {
    const createData = {
      name: 'New Item',
      description: 'A new menu item',
      price: 200000,
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/new-item.jpg',
      preparationTime: 20,
      ingredients: ['Ingredient 1', 'Ingredient 2'],
    };

    const createdItem = {
      id: '2',
      ...createData,
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

    it('should create a new menu item', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(null); // No existing item
      mockPrisma.menuItem.create.mockResolvedValue(createdItem);

      const result = await menuService.createMenuItem(createData);

      expect(result).toEqual(createdItem);
      expect(mockPrisma.menuItem.findFirst).toHaveBeenCalledWith({
        where: { name: createData.name },
      });
      expect(mockPrisma.menuItem.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          isAvailable: true,
        },
      });
    });

    it('should throw ConflictError for duplicate name', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(createdItem); // Existing item

      await expect(menuService.createMenuItem(createData)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateMenuItem', () => {
    const existingItem = {
      id: '1',
      name: 'Existing Item',
      description: 'An existing item',
      price: 150000,
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/existing.jpg',
      isAvailable: true,
      preparationTime: 15,
      ingredients: ['Ingredient 1'],
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      sodium: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateData = {
      name: 'Updated Item',
      price: 200000,
    };

    const updatedItem = {
      ...existingItem,
      ...updateData,
    };

    it('should update menu item', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.menuItem.findFirst.mockResolvedValue(null); // No name conflict
      mockPrisma.menuItem.update.mockResolvedValue(updatedItem);

      const result = await menuService.updateMenuItem('1', updateData);

      expect(result).toEqual(updatedItem);
      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });

    it('should throw ConflictError for duplicate name', async () => {
      const conflictingItem = { ...existingItem, id: '2' };
      
      mockPrisma.menuItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.menuItem.findFirst.mockResolvedValue(conflictingItem);

      await expect(menuService.updateMenuItem('1', updateData)).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteMenuItem', () => {
    const existingItem = {
      id: '1',
      name: 'Item to Delete',
      // ... other properties
    };

    it('should delete menu item', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.orderItem.count.mockResolvedValue(0); // No orders
      mockPrisma.menuItem.delete.mockResolvedValue(existingItem);

      await menuService.deleteMenuItem('1');

      expect(mockPrisma.menuItem.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw ConflictError if item has orders', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.orderItem.count.mockResolvedValue(5); // Has orders

      await expect(menuService.deleteMenuItem('1')).rejects.toThrow(ConflictError);
    });
  });

  describe('toggleAvailability', () => {
    const menuItem = {
      id: '1',
      name: 'Test Item',
      isAvailable: true,
      // ... other properties
    };

    it('should toggle availability', async () => {
      const toggledItem = { ...menuItem, isAvailable: false };
      
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItem);
      mockPrisma.menuItem.update.mockResolvedValue(toggledItem);

      const result = await menuService.toggleAvailability('1');

      expect(result).toEqual(toggledItem);
      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isAvailable: false },
      });
    });
  });
});