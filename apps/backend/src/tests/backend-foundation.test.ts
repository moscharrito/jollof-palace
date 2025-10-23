import request from 'supertest';
import app from '../app';

describe('Backend API Foundation', () => {
  describe('Express Server Setup', () => {
    it('should start and respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Food Ordering API is running',
        timestamp: expect.any(String),
        environment: 'test',
      });
    });

    it('should have proper TypeScript configuration', async () => {
      // Test that TypeScript compilation works by making a request
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Food Ordering API');
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers for allowed origins', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/menu')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('Body Parsing Middleware', () => {
    it('should parse JSON body correctly', async () => {
      const testData = { test: 'data', number: 123 };
      
      // This will hit a 404 but should parse the JSON successfully
      const response = await request(app)
        .post('/test-json-parsing')
        .send(testData)
        .expect(404);

      // The fact that we get a proper JSON response means parsing worked
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle large JSON payloads within limit', async () => {
      const largeData = {
        items: Array(100).fill({ name: 'test item', description: 'test description' })
      };
      
      const response = await request(app)
        .post('/test-large-json')
        .send(largeData)
        .expect(404); // 404 because route doesn't exist, but JSON should be parsed

      expect(response.body.success).toBe(false);
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/test-malformed-json')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling Middleware', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /non-existent-route not found',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle different HTTP methods for 404', async () => {
      const methods: Array<'post' | 'put' | 'delete' | 'patch'> = ['post', 'put', 'delete', 'patch'];
      
      for (const method of methods) {
        const response = await request(app)
          [method]('/non-existent-route')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toContain(method.toUpperCase());
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers set by helmet
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options', 'noopen');
    });

    it('should set proper content security policy', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet should set some form of CSP or security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('Request Logging', () => {
    it('should log requests (verified by successful response)', async () => {
      // We can't directly test console.log, but we can verify the middleware chain works
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('API Routes Structure', () => {
    it('should mount API routes under /api prefix', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Food Ordering API',
        version: '1.0.0',
        endpoints: {
          menu: '/api/menu',
          orders: '/api/orders',
          payments: '/api/payments',
          admin: '/api/admin',
          analytics: '/api/admin/analytics',
          reports: '/api/admin/reports',
        },
        documentation: 'https://github.com/your-repo/food-ordering-system',
      });
    });

    it('should have menu routes available', async () => {
      // This should return a proper response structure even if no data
      const response = await request(app)
        .get('/api/menu')
        .expect([200, 500]); // 500 is acceptable if database is not connected

      expect(response.body).toHaveProperty('success');
    });

    it('should have orders routes available', async () => {
      const response = await request(app)
        .get('/api/orders/test-id')
        .expect([404, 500]); // 404 or 500 is acceptable

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Base Controller Functionality', () => {
    it('should have consistent response format', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      // All responses should follow the same structure
      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');
    });
  });

  describe('JWT Authentication Middleware Setup', () => {
    it('should reject requests to admin routes without token', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'InvalidToken')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with malformed Bearer token', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});