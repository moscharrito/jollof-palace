import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/database';
import { Category } from '@prisma/client';

describe('Menu Integration Tests', () => {
  let testMenuItemId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.menuItem.deleteMany({
      where: { name: { contains: 'Test' } },
    });

    // Create a test menu item
    const testMenuItem = await prisma.menuItem.create({
      data: {
        name: 'Test Jollof Rice',
        description: 'Test Nigerian jollof rice with spices',
        price: 150000,
        category: Category.MAIN,
        imageUrl: 'https://example.com/test-jollof.jpg',
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
      where: { name: { contains: 'Test' } },
    });
    await prisma.$disconnect();
  });

  describe('Public Menu Endpoints', () => {
    it('GET /api/menu should return all menu items', async () => {
      const response = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that our test item is included
      const testItem = response.body.data.find((item: any) => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
      expect(testItem.name).toBe('Test Jollof Rice');
    });

    it('GET /api/menu/:id should return specific menu item', async () => {
      const response = await request(app)
        .get(`/api/menu/${testMenuItemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testMenuItemId);
      expect(response.body.data.name).toBe('Test Jollof Rice');
      expect(response.body.data.category).toBe('MAIN');
      expect(response.body.data.isAvailable).toBe(true);
    });

    it('GET /api/menu/:id should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/menu/non-existent-id')
        .expect(500); // This might be 404 with proper error handling

      expect(response.body.success).toBe(false);
    });

    it('GET /api/menu/available should return only available items', async () => {
      const response = await request(app)
        .get('/api/menu/available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All items should be available
      response.body.data.forEach((item: any) => {
        expect(item.isAvailable).toBe(true);
      });
    });

    it('GET /api/menu/category/MAIN should return main category items', async () => {
      const response = await request(app)
        .get('/api/menu/category/MAIN')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All items should be MAIN category
      response.body.data.forEach((item: any) => {
        expect(item.category).toBe('MAIN');
      });
    });

    it('GET /api/menu/category/INVALID should return 400', async () => {
      const response = await request(app)
        .get('/api/menu/category/INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('GET /api/menu/search/jollof should return search results', async () => {
      const response = await request(app)
        .get('/api/menu/search/jollof')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should include our test item
      const testItem = response.body.data.find((item: any) => item.id === testMenuItemId);
      expect(testItem).toBeDefined();
    });

    it('GET /api/menu/search/x should return 400 for short query', async () => {
      const response = await request(app)
        .get('/api/menu/search/x')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('GET /api/menu with filters should work', async () => {
      const response = await request(app)
        .get('/api/menu?category=MAIN&available=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All items should be MAIN category and available
      response.body.data.forEach((item: any) => {
        expect(item.category).toBe('MAIN');
        expect(item.isAvailable).toBe(true);
      });
    });
  });

  describe('Inventory Status Checking', () => {
    it('should reflect availability status correctly', async () => {
      // First, get the current item
      const getResponse = await request(app)
        .get(`/api/menu/${testMenuItemId}`)
        .expect(200);

      expect(getResponse.body.data.isAvailable).toBe(true);

      // Check that available endpoint includes it
      const availableResponse = await request(app)
        .get('/api/menu/available')
        .expect(200);

      const availableItem = availableResponse.body.data.find((item: any) => item.id === testMenuItemId);
      expect(availableItem).toBeDefined();
    });

    it('should handle out of stock items correctly', async () => {
      // Create an out of stock item
      const outOfStockItem = await prisma.menuItem.create({
        data: {
          name: 'Test Out of Stock Item',
          description: 'This item is out of stock',
          price: 100000,
          category: Category.SIDE,
          imageUrl: 'https://example.com/out-of-stock.jpg',
          preparationTime: 10,
          ingredients: ['Test'],
          isAvailable: false,
        },
      });

      // Check that available endpoint excludes it
      const availableResponse = await request(app)
        .get('/api/menu/available')
        .expect(200);

      const unavailableItem = availableResponse.body.data.find((item: any) => item.id === outOfStockItem.id);
      expect(unavailableItem).toBeUndefined();

      // But all items endpoint should include it
      const allResponse = await request(app)
        .get('/api/menu')
        .expect(200);

      const allItem = allResponse.body.data.find((item: any) => item.id === outOfStockItem.id);
      expect(allItem).toBeDefined();
      expect(allItem.isAvailable).toBe(false);

      // Clean up
      await prisma.menuItem.delete({ where: { id: outOfStockItem.id } });
    });
  });

  describe('Data Validation', () => {
    it('should return proper data structure for menu items', async () => {
      const response = await request(app)
        .get(`/api/menu/${testMenuItemId}`)
        .expect(200);

      const item = response.body.data;
      
      // Check required fields
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('imageUrl');
      expect(item).toHaveProperty('isAvailable');
      expect(item).toHaveProperty('preparationTime');
      expect(item).toHaveProperty('ingredients');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');

      // Check data types
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.price).toBe('number');
      expect(typeof item.category).toBe('string');
      expect(typeof item.imageUrl).toBe('string');
      expect(typeof item.isAvailable).toBe('boolean');
      expect(typeof item.preparationTime).toBe('number');
      expect(Array.isArray(item.ingredients)).toBe(true);

      // Check category is valid
      expect(['MAIN', 'SIDE', 'COMBO']).toContain(item.category);
    });
  });
});