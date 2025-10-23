import request from 'supertest';
import { app } from '../app';
import { NotificationService } from '../services/NotificationService';
import { OrderService } from '../services/OrderService';

// Mock the services
jest.mock('../services/NotificationService');
jest.mock('../services/OrderService');

const MockedNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;
const MockedOrderService = OrderService as jest.MockedClass<typeof OrderService>;

describe('Notification API Endpoints', () => {
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockOrderService: jest.Mocked<OrderService>;
  let adminToken: string;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockNotificationService = {
      isConfigured: jest.fn(),
      testSMSService: jest.fn(),
      sendBulkNotification: jest.fn(),
      sendOrderStatusNotification: jest.fn(),
      sendDelayNotification: jest.fn(),
    } as any;

    mockOrderService = {
      getOrderById: jest.fn(),
      updateEstimatedReadyTime: jest.fn(),
    } as any;

    // Mock the constructors to return our mocked instances
    MockedNotificationService.mockImplementation(() => mockNotificationService);
    MockedOrderService.mockImplementation(() => mockOrderService);

    // Mock admin token (in real tests, you'd get this from login)
    adminToken = 'mock-admin-token';
  });

  describe('POST /api/notifications/test-sms', () => {
    it('should send test SMS successfully', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockNotificationService.testSMSService.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/notifications/test-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test SMS sent successfully');
      expect(mockNotificationService.testSMSService).toHaveBeenCalledWith('+1234567890');
    });

    it('should return error when SMS service is not configured', async () => {
      mockNotificationService.isConfigured.mockReturnValue(false);

      const response = await request(app)
        .post('/api/notifications/test-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
        });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('SMS service is not configured');
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/notifications/test-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: 'invalid-phone',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .post('/api/notifications/test-sms')
        .send({
          phoneNumber: '+1234567890',
        });

      expect(response.status).toBe(401);
    });

    it('should handle SMS service errors', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockNotificationService.testSMSService.mockRejectedValue(new Error('Twilio error'));

      const response = await request(app)
        .post('/api/notifications/test-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('SMS test failed');
    });
  });

  describe('POST /api/notifications/bulk-sms', () => {
    it('should send bulk SMS successfully', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockNotificationService.sendBulkNotification.mockResolvedValue({
        sent: 2,
        failed: 1,
      });

      const phoneNumbers = ['+1234567890', '+0987654321', '+1122334455'];
      const message = 'Test bulk message';

      const response = await request(app)
        .post('/api/notifications/bulk-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumbers,
          message,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.sent).toBe(2);
      expect(response.body.results.failed).toBe(1);
      expect(response.body.results.total).toBe(3);
      expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledWith(
        phoneNumbers,
        message
      );
    });

    it('should validate phone numbers array', async () => {
      const response = await request(app)
        .post('/api/notifications/bulk-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumbers: [],
          message: 'Test message',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(1601); // Exceed SMS limit

      const response = await request(app)
        .post('/api/notifications/bulk-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumbers: ['+1234567890'],
          message: longMessage,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should limit phone numbers array size', async () => {
      const tooManyNumbers = Array(101).fill('+1234567890');

      const response = await request(app)
        .post('/api/notifications/bulk-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumbers: tooManyNumbers,
          message: 'Test message',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/order-notification', () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-123456',
      customerPhone: '+1234567890',
      estimatedReadyTime: new Date(),
    };

    it('should send order notification successfully', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);
      mockNotificationService.sendOrderStatusNotification.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/notifications/order-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'order-123',
          status: 'CONFIRMED',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orderNumber).toBe('ORD-123456');
      expect(mockNotificationService.sendOrderStatusNotification).toHaveBeenCalledWith(
        mockOrder,
        'CONFIRMED',
        mockOrder.estimatedReadyTime
      );
    });

    it('should return error for non-existent order', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockOrderService.getOrderById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/notifications/order-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'non-existent',
          status: 'CONFIRMED',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });

    it('should validate order status', async () => {
      const response = await request(app)
        .post('/api/notifications/order-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'order-123',
          status: 'INVALID_STATUS',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notifications/status', () => {
    it('should return SMS service status when configured', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const response = await request(app)
        .get('/api/notifications/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.smsService.configured).toBe(true);
      expect(response.body.smsService.provider).toBe('Twilio');
      expect(response.body.smsService.fromNumber).toBe('+1234567890');
    });

    it('should return SMS service status when not configured', async () => {
      mockNotificationService.isConfigured.mockReturnValue(false);
      delete process.env.TWILIO_PHONE_NUMBER;

      const response = await request(app)
        .get('/api/notifications/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.smsService.configured).toBe(false);
      expect(response.body.smsService.fromNumber).toBe('Not configured');
    });
  });

  describe('POST /api/notifications/delay-notification', () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-123456',
      customerPhone: '+1234567890',
    };

    it('should send delay notification successfully', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);
      mockNotificationService.sendDelayNotification.mockResolvedValue(true);
      mockOrderService.updateEstimatedReadyTime.mockResolvedValue(mockOrder as any);

      const newEstimatedTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const reason = 'High order volume';

      const response = await request(app)
        .post('/api/notifications/delay-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'order-123',
          newEstimatedTime,
          reason,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orderNumber).toBe('ORD-123456');
      expect(response.body.reason).toBe(reason);
      expect(mockNotificationService.sendDelayNotification).toHaveBeenCalledWith(
        mockOrder,
        new Date(newEstimatedTime),
        reason
      );
      expect(mockOrderService.updateEstimatedReadyTime).toHaveBeenCalledWith(
        'order-123',
        new Date(newEstimatedTime)
      );
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .post('/api/notifications/delay-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'order-123',
          newEstimatedTime: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle optional reason parameter', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);
      mockNotificationService.sendDelayNotification.mockResolvedValue(true);
      mockOrderService.updateEstimatedReadyTime.mockResolvedValue(mockOrder as any);

      const newEstimatedTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .post('/api/notifications/delay-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'order-123',
          newEstimatedTime,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockNotificationService.sendDelayNotification).toHaveBeenCalledWith(
        mockOrder,
        new Date(newEstimatedTime),
        undefined
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockNotificationService.testSMSService.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/api/notifications/test-sms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service unavailable');
    });

    it('should handle database errors', async () => {
      mockNotificationService.isConfigured.mockReturnValue(true);
      mockOrderService.getOrderById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/notifications/order-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'order-123',
          status: 'CONFIRMED',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});