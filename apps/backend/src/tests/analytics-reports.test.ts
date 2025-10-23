import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import { createTestAdmin, createTestMenuItems, createTestOrders } from './setup';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Analytics and Reports', () => {
  let adminToken: string;
  let adminId: string;
  let menuItems: any[];
  let testOrders: any[];

  beforeAll(async () => {
    // Clean up existing data
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.adminUser.deleteMany();

    // Create test admin
    const admin = await createTestAdmin();
    adminId = admin.id;
    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test menu items
    menuItems = await createTestMenuItems();

    // Create test orders with different dates and statuses
    testOrders = await createTestOrders(menuItems);
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.adminUser.deleteMany();
    await prisma.$disconnect();
  });

  describe('Analytics Controller', () => {
    describe('GET /api/analytics/dashboard', () => {
      it('should return dashboard statistics', async () => {
        const response = await request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('today');
        expect(response.body.data).toHaveProperty('week');
        expect(response.body.data).toHaveProperty('pending');
        expect(response.body.data).toHaveProperty('popularItems');
        expect(response.body.data.today).toHaveProperty('orders');
        expect(response.body.data.today).toHaveProperty('revenue');
        expect(response.body.data.popularItems).toBeInstanceOf(Array);
      });

      it('should cache dashboard data', async () => {
        // First request
        const start = Date.now();
        await request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
        const firstRequestTime = Date.now() - start;

        // Second request (should be faster due to caching)
        const start2 = Date.now();
        await request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
        const secondRequestTime = Date.now() - start2;

        expect(secondRequestTime).toBeLessThan(firstRequestTime);
      });
    });

    describe('GET /api/analytics/sales', () => {
      it('should return sales analytics for default period', async () => {
        const response = await request(app)
          .get('/api/analytics/sales')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('period');
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('dailySales');
        expect(response.body.data).toHaveProperty('paymentMethods');
        expect(response.body.data).toHaveProperty('orderTypes');
        expect(response.body.data.summary).toHaveProperty('totalOrders');
        expect(response.body.data.summary).toHaveProperty('totalRevenue');
        expect(response.body.data.summary).toHaveProperty('averageOrderValue');
      });

      it('should return sales analytics for custom period', async () => {
        const response = await request(app)
          .get('/api/analytics/sales?days=7')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.period.days).toBe(7);
      });

      it('should validate days parameter', async () => {
        await request(app)
          .get('/api/analytics/sales?days=invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);
      });
    });

    describe('GET /api/analytics/menu', () => {
      it('should return menu analytics', async () => {
        const response = await request(app)
          .get('/api/analytics/menu')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('topItems');
        expect(response.body.data).toHaveProperty('categoryPerformance');
        expect(response.body.data).toHaveProperty('underperformingItems');
        expect(response.body.data.topItems).toBeInstanceOf(Array);
        expect(response.body.data.categoryPerformance).toBeInstanceOf(Array);
      });

      it('should include item details in top items', async () => {
        const response = await request(app)
          .get('/api/analytics/menu')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        if (response.body.data.topItems.length > 0) {
          const topItem = response.body.data.topItems[0];
          expect(topItem).toHaveProperty('id');
          expect(topItem).toHaveProperty('name');
          expect(topItem).toHaveProperty('category');
          expect(topItem).toHaveProperty('quantitySold');
          expect(topItem).toHaveProperty('revenue');
          expect(topItem).toHaveProperty('orderFrequency');
        }
      });
    });

    describe('GET /api/analytics/customers', () => {
      it('should return customer analytics', async () => {
        const response = await request(app)
          .get('/api/analytics/customers')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('segments');
        expect(response.body.data).toHaveProperty('topCustomers');
        expect(response.body.data.summary).toHaveProperty('totalCustomers');
        expect(response.body.data.summary).toHaveProperty('retentionRate');
        expect(response.body.data.segments).toHaveProperty('oneTime');
        expect(response.body.data.segments).toHaveProperty('occasional');
        expect(response.body.data.segments).toHaveProperty('regular');
        expect(response.body.data.segments).toHaveProperty('frequent');
      });

      it('should calculate customer segments correctly', async () => {
        const response = await request(app)
          .get('/api/analytics/customers')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const segments = response.body.data.segments;
        const totalPercentage = segments.oneTime.percentage + 
                               segments.occasional.percentage + 
                               segments.regular.percentage + 
                               segments.frequent.percentage;

        // Allow for small rounding errors
        expect(totalPercentage).toBeCloseTo(100, 1);
      });
    });
  });

  describe('Reports Controller', () => {
    describe('POST /api/reports/sales', () => {
      const reportData = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        type: 'weekly'
      };

      it('should generate sales report in JSON format', async () => {
        const response = await request(app)
          .post('/api/reports/sales')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(reportData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('reportId');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('breakdown');
        expect(response.body.data).toHaveProperty('topItems');
        expect(response.body.data).toHaveProperty('generatedAt');
        expect(response.body.data).toHaveProperty('generatedBy');
      });

      it('should generate sales report in CSV format', async () => {
        const response = await request(app)
          .post('/api/reports/sales')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...reportData, format: 'csv' })
          .expect(200);

        expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.text).toContain('Summary');
        expect(response.text).toContain('Metric,Value');
      });

      it('should validate date range', async () => {
        await request(app)
          .post('/api/reports/sales')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            startDate: 'invalid-date',
            endDate: new Date().toISOString()
          })
          .expect(400);
      });

      it('should require both start and end dates', async () => {
        await request(app)
          .post('/api/reports/sales')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            startDate: new Date().toISOString()
          })
          .expect(400);
      });
    });

    describe('POST /api/reports/sales/daily', () => {
      it('should generate daily sales report for today', async () => {
        const response = await request(app)
          .post('/api/reports/sales/daily')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('dailyMetrics');
        expect(response.body.data.dailyMetrics).toHaveProperty('hourlyBreakdown');
        expect(response.body.data.dailyMetrics).toHaveProperty('peakHour');
        expect(response.body.data.dailyMetrics.hourlyBreakdown).toHaveLength(24);
      });

      it('should generate daily sales report for specific date', async () => {
        const testDate = new Date();
        testDate.setDate(testDate.getDate() - 1);

        const response = await request(app)
          .post('/api/reports/sales/daily')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ date: testDate.toISOString() })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toContain(testDate.toDateString());
      });
    });

    describe('POST /api/reports/customers', () => {
      const reportData = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      };

      it('should generate customer report', async () => {
        const response = await request(app)
          .post('/api/reports/customers')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(reportData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('reportId');
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('segments');
        expect(response.body.data).toHaveProperty('topCustomers');
        expect(response.body.data.segments).toHaveProperty('byOrderFrequency');
        expect(response.body.data.segments).toHaveProperty('bySpendingLevel');
      });

      it('should export customer report as CSV', async () => {
        const response = await request(app)
          .post('/api/reports/customers')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...reportData, format: 'csv' })
          .expect(200);

        expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
        expect(response.text).toContain('Summary');
      });
    });

    describe('POST /api/reports/menu', () => {
      const reportData = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      };

      it('should generate menu performance report', async () => {
        const response = await request(app)
          .post('/api/reports/menu')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(reportData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('reportId');
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('performance');
        expect(response.body.data).toHaveProperty('recommendations');
        expect(response.body.data.performance).toHaveProperty('topPerformers');
        expect(response.body.data.performance).toHaveProperty('underPerformers');
        expect(response.body.data.performance).toHaveProperty('categoryAnalysis');
      });
    });

    describe('GET /api/reports/history', () => {
      it('should return report history', async () => {
        const response = await request(app)
          .get('/api/reports/history')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('reports');
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('limit');
        expect(response.body.data.reports).toBeInstanceOf(Array);
      });

      it('should respect limit parameter', async () => {
        const response = await request(app)
          .get('/api/reports/history?limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.limit).toBe(10);
      });
    });
  });

  describe('Analytics Calculations', () => {
    it('should calculate revenue correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { totalRevenue, totalOrders, averageOrderValue } = response.body.data.summary;
      
      if (totalOrders > 0) {
        expect(averageOrderValue).toBeCloseTo(totalRevenue / totalOrders, 2);
      }
    });

    it('should calculate customer retention rate correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { totalCustomers, returningCustomers, retentionRate } = response.body.data.summary;
      
      if (totalCustomers > 0) {
        expect(retentionRate).toBeCloseTo((returningCustomers / totalCustomers) * 100, 2);
      }
    });

    it('should calculate category performance correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const categoryPerformance = response.body.data.categoryPerformance;
      
      categoryPerformance.forEach((category: any) => {
        if (category.itemCount > 0) {
          expect(category.averageRevenuePerItem).toBeCloseTo(
            category.totalRevenue / category.itemCount, 
            2
          );
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      await request(app)
        .get('/api/analytics/dashboard')
        .expect(401);
    });

    it('should handle invalid token', async () => {
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle database errors gracefully', async () => {
      // Temporarily disconnect from database
      await prisma.$disconnect();

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      // Reconnect for cleanup
      await prisma.$connect();

      expect(response.status).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Performance', () => {
    it('should respond to analytics requests within reasonable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/analytics/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});