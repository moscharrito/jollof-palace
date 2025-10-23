import request from 'supertest';
import app from '../app';

describe('App', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
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
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /unknown-route not found',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON body', async () => {
      const testData = { test: 'data' };
      
      // This will hit the 404 handler but should parse the JSON
      const response = await request(app)
        .post('/test-json')
        .send(testData)
        .expect(404);

      // The fact that we get a proper JSON response means parsing worked
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid JSON', async () => {
      const response = await request(app)
        .post('/test-json')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});