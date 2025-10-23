import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import { AnalyticsService } from '../services/AnalyticsService';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Analytics API', () => {
  let adminToken: string;
  let testOrderId: string;
  let testMenuItemId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.adminUser.deleteMany({
      where: { email: { contains: 'analytics.test' } },
    });

    // Create test admin user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const testAdmin = await prisma.adminUser.create({
      data: {
        email: 'analytics.test@example.com',
        name: 'Analytics Test Admin',
        password: hashedPassword,
        role: 'MANAGER',
        isActive: true,
      },
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'analytics.test@example.com',
        password: 'testpassword123',
      });

    adminToken = loginResponse.body.data.token;

    // Create test menu item
    const testMenuItem = await prisma.menuItem.create({
      data: {
        name: 'Test Burger',
        description: 'A test burger for analytics',
        price: 1299, // $12.99
        category: 'MAIN',
        imageUrl: 'https://example.com/burger.jpg',
        preparationTime: 15,
        ingredients: ['beef', 'lettuce', 'tomato'],
        isAvailable: true,
      },
    });

    testMenuItemId = testMenuItem.id;

    // Create test order
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-001',
        customerName: 'Test Customer',
        customerPhone: '+1234567890',
        customerEmail: 'test.customer@example.com',
        orderType: 'PICKUP',
        subtotal: 1299,
        tax: 104,
        total: 1403,
        status: 'COMPLETED',
        estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    testOrderId = testOrder.id;

    // Create test order item
    await prisma.orderItem.create({
      data: {
        orderId: testOrderId,
        menuItemId: testMenuItemId,
        quantity: 1,
        unitPrice: 1299,
        totalPrice: 1299,
        customizations: [],
      },
    });

    // Create test payment
    await prisma.payment.create({
      data: {
        orderId: testOrderId,
        amount: 1403,
        method: 'CARD',
        status: 'COMPLETED',
        reference: 'TEST-PAY-001',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.adminUser.deleteMany({
      where: { email: { contains: 'analytics.test' } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/analytics/dashboard', () => {
    it('should get dashboard metrics with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('averageOrderValue');
      expect(response.body.data).toHaveProperty('totalCustomers');
      expect(response.body.data).toHaveProperty('popularItems');
      expect(response.body.data).toHaveProperty('recentOrders');
      
      // Check that amounts are converted from cents to dollars
      expect(typeof response.body.data.totalRevenue).toBe('number');
      expect(response.body.data.totalRevenue).toBeGreaterThan(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/analytics/sales', () => {
    it('should get sales analytics with default parameters', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/sales')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dailySales');
      expect(response.body.data).toHaveProperty('weeklySales');
      expect(response.body.data).toHaveProperty('monthlySales');
      expect(response.body.data).toHaveProperty('paymentMethodDistribution');
      expect(response.body.data).toHaveProperty('orderTypeDistribution');
      
      expect(Array.isArray(response.body.data.dailySales)).toBe(true);
    });

    it('should get sales analytics with custom days parameter', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/sales?days=7')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid days parameter', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/sales?days=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject days parameter out of range', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/sales?days=500')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/analytics/customers', () => {
    it('should get customer analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCustomers');
      expect(response.body.data).toHaveProperty('newCustomersThisMonth');
      expect(response.body.data).toHaveProperty('returningCustomers');
      expect(response.body.data).toHaveProperty('averageOrdersPerCustomer');
      expect(response.body.data).toHaveProperty('topCustomers');
      expect(response.body.data).toHaveProperty('customerRetentionRate');
      
      expect(Array.isArray(response.body.data.topCustomers)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/menu', () => {
    it('should get menu analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/menu')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalMenuItems');
      expect(response.body.data).toHaveProperty('activeMenuItems');
      expect(response.body.data).toHaveProperty('topSellingItems');
      expect(response.body.data).toHaveProperty('lowPerformingItems');
      expect(response.body.data).toHaveProperty('categoryPerformance');
      
      expect(Array.isArray(response.body.data.topSellingItems)).toBe(true);
      expect(Array.isArray(response.body.data.categoryPerformance)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/operations', () => {
    it('should get operational analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/operations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('averagePreparationTime');
      expect(response.body.data).toHaveProperty('orderFulfillmentRate');
      expect(response.body.data).toHaveProperty('peakHours');
      expect(response.body.data).toHaveProperty('busyDays');
      expect(response.body.data).toHaveProperty('orderStatusDistribution');
      
      expect(Array.isArray(response.body.data.peakHours)).toBe(true);
      expect(Array.isArray(response.body.data.busyDays)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/real-time', () => {
    it('should get real-time metrics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/real-time')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('todayOrders');
      expect(response.body.data).toHaveProperty('pendingOrders');
      expect(response.body.data).toHaveProperty('activeCustomers');
      expect(response.body.data).toHaveProperty('currentRevenue');
      expect(response.body.data).toHaveProperty('timestamp');
      
      expect(typeof response.body.data.todayOrders).toBe('number');
      expect(typeof response.body.data.currentRevenue).toBe('number');
    });
  });

  describe('GET /api/admin/analytics/export', () => {
    it('should export analytics data in JSON format', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export?type=sales&format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dailySales');
    });

    it('should export analytics data in CSV format', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export?type=sales&format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should reject invalid analytics type', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export?type=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeAll(() => {
    analyticsService = new AnalyticsService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics', async () => {
      const metrics = await analyticsService.getDashboardMetrics();

      expect(metrics).toHaveProperty('totalOrders');
      expect(metrics).toHaveProperty('totalRevenue');
      expect(metrics).toHaveProperty('averageOrderValue');
      expect(metrics).toHaveProperty('totalCustomers');
      expect(metrics).toHaveProperty('popularItems');
      expect(metrics).toHaveProperty('recentOrders');
      
      expect(typeof metrics.totalOrders).toBe('number');
      expect(typeof metrics.totalRevenue).toBe('number');
      expect(Array.isArray(metrics.popularItems)).toBe(true);
      expect(Array.isArray(metrics.recentOrders)).toBe(true);
    });
  });

  describe('getSalesAnalytics', () => {
    it('should return sales analytics for default period', async () => {
      const analytics = await analyticsService.getSalesAnalytics();

      expect(analytics).toHaveProperty('dailySales');
      expect(analytics).toHaveProperty('weeklySales');
      expect(analytics).toHaveProperty('monthlySales');
      expect(analytics).toHaveProperty('paymentMethodDistribution');
      expect(analytics).toHaveProperty('orderTypeDistribution');
      
      expect(Array.isArray(analytics.dailySales)).toBe(true);
      expect(typeof analytics.paymentMethodDistribution).toBe('object');
      expect(analytics.orderTypeDistribution).toHaveProperty('PICKUP');
      expect(analytics.orderTypeDistribution).toHaveProperty('DELIVERY');
    });

    it('should return sales analytics for custom period', async () => {
      const analytics = await analyticsService.getSalesAnalytics(7);

      expect(analytics).toHaveProperty('dailySales');
      expect(Array.isArray(analytics.dailySales)).toBe(true);
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return customer analytics', async () => {
      const analytics = await analyticsService.getCustomerAnalytics();

      expect(analytics).toHaveProperty('totalCustomers');
      expect(analytics).toHaveProperty('newCustomersThisMonth');
      expect(analytics).toHaveProperty('returningCustomers');
      expect(analytics).toHaveProperty('averageOrdersPerCustomer');
      expect(analytics).toHaveProperty('topCustomers');
      expect(analytics).toHaveProperty('customerRetentionRate');
      
      expect(typeof analytics.totalCustomers).toBe('number');
      expect(typeof analytics.customerRetentionRate).toBe('number');
      expect(Array.isArray(analytics.topCustomers)).toBe(true);
    });
  });

  describe('getMenuAnalytics', () => {
    it('should return menu analytics', async () => {
      const analytics = await analyticsService.getMenuAnalytics();

      expect(analytics).toHaveProperty('totalMenuItems');
      expect(analytics).toHaveProperty('activeMenuItems');
      expect(analytics).toHaveProperty('topSellingItems');
      expect(analytics).toHaveProperty('lowPerformingItems');
      expect(analytics).toHaveProperty('categoryPerformance');
      
      expect(typeof analytics.totalMenuItems).toBe('number');
      expect(typeof analytics.activeMenuItems).toBe('number');
      expect(Array.isArray(analytics.topSellingItems)).toBe(true);
      expect(Array.isArray(analytics.categoryPerformance)).toBe(true);
    });
  });

  describe('getOperationalAnalytics', () => {
    it('should return operational analytics', async () => {
      const analytics = await analyticsService.getOperationalAnalytics();

      expect(analytics).toHaveProperty('averagePreparationTime');
      expect(analytics).toHaveProperty('orderFulfillmentRate');
      expect(analytics).toHaveProperty('peakHours');
      expect(analytics).toHaveProperty('busyDays');
      expect(analytics).toHaveProperty('orderStatusDistribution');
      
      expect(typeof analytics.averagePreparationTime).toBe('number');
      expect(typeof analytics.orderFulfillmentRate).toBe('number');
      expect(Array.isArray(analytics.peakHours)).toBe(true);
      expect(Array.isArray(analytics.busyDays)).toBe(true);
      expect(typeof analytics.orderStatusDistribution).toBe('object');
    });
  });
});