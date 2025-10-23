import { NotificationService } from '../../services/NotificationService';
import { Order, OrderStatus, OrderType } from '@prisma/client';
import twilio from 'twilio';

// Mock Twilio
jest.mock('twilio');
const mockTwilio = twilio as jest.MockedFunction<typeof twilio>;

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockTwilioClient: any;
  let mockOrder: Order;

  beforeEach(() => {
    // Reset environment variables
    process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    // Mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn(),
      },
    };
    mockTwilio.mockReturnValue(mockTwilioClient);

    // Create service instance
    notificationService = new NotificationService();

    // Mock order data
    mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'John Doe',
      customerPhone: '+1234567890',
      customerEmail: 'john@example.com',
      orderType: OrderType.PICKUP,
      deliveryStreet: null,
      deliveryCity: null,
      deliveryState: null,
      deliveryPostalCode: null,
      deliveryLandmark: null,
      subtotal: 250000, // ₦2500 in kobo
      tax: 18750, // 7.5% tax
      deliveryFee: 0,
      total: 268750,
      status: OrderStatus.CONFIRMED,
      estimatedReadyTime: new Date('2024-01-01T12:30:00Z'),
      actualReadyTime: null,
      specialInstructions: null,
      createdAt: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with Twilio credentials', () => {
      expect(mockTwilio).toHaveBeenCalledWith('test_account_sid', 'test_auth_token');
      expect(notificationService.isConfigured()).toBe(true);
    });

    it('should handle missing Twilio credentials gracefully', () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const service = new NotificationService();
      expect(service.isConfigured()).toBe(false);
    });

    it('should warn when Twilio credentials are missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      delete process.env.TWILIO_ACCOUNT_SID;
      
      new NotificationService();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Twilio credentials not found. SMS notifications disabled.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Order Status Notifications', () => {
    it('should send order confirmation SMS', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED,
        mockOrder.estimatedReadyTime
      );

      expect(result).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Order Confirmed!'),
        from: '+1234567890',
        to: '+11234567890', // Phone number gets formatted with country code
      });

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('ORD-123456-ABC');
      expect(callArgs.body).toContain('07:30 AM'); // Time is formatted with leading zero
      expect(callArgs.body).toContain('http://localhost:3000/order/ORD-123456-ABC');
    });

    it('should send order preparing SMS', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.PREPARING
      );

      expect(result).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Order in Progress!'),
        from: '+1234567890',
        to: '+11234567890', // Phone number gets formatted with country code
      });

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('ORD-123456-ABC');
      expect(callArgs.body).toContain('being prepared');
    });

    it('should send order ready SMS for pickup', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.READY
      );

      expect(result).toBe(true);
      
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('Order Ready!');
      expect(callArgs.body).toContain('ORD-123456-ABC');
      expect(callArgs.body).toContain('ready for pickup');
      expect(callArgs.body).toContain('come to the restaurant');
    });

    it('should send order ready SMS for delivery', async () => {
      const deliveryOrder = { ...mockOrder, orderType: OrderType.DELIVERY };
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendOrderStatusNotification(
        deliveryOrder,
        OrderStatus.READY
      );

      expect(result).toBe(true);
      
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('Order Ready!');
      expect(callArgs.body).toContain('ready for delivery');
      expect(callArgs.body).toContain('delivery driver is on the way');
    });

    it('should send order completed SMS', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.COMPLETED
      );

      expect(result).toBe(true);
      
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('Order Completed!');
      expect(callArgs.body).toContain('ORD-123456-ABC');
      expect(callArgs.body).toContain('Thank you for choosing Jollof Palace');
    });

    it('should skip SMS for unsupported status', async () => {
      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.PENDING
      );

      expect(result).toBe(false);
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

    it('should skip SMS when Twilio is not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const service = new NotificationService();

      const result = await service.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
    });

    it('should skip SMS when customer phone is missing', async () => {
      const orderWithoutPhone = { ...mockOrder, customerPhone: null };

      const result = await notificationService.sendOrderStatusNotification(
        orderWithoutPhone as any,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('Delay Notifications', () => {
    it('should send delay notification with new estimated time', async () => {
      const newEstimatedTime = new Date('2024-01-01T13:00:00Z');
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendDelayNotification(
        mockOrder,
        newEstimatedTime
      );

      expect(result).toBe(true);
      
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('Order Update');
      expect(callArgs.body).toContain('ORD-123456-ABC');
      expect(callArgs.body).toContain('taking a bit longer');
      expect(callArgs.body).toContain('8:00 AM'); // Time is formatted in local timezone
    });

    it('should include reason in delay notification', async () => {
      const newEstimatedTime = new Date('2024-01-01T13:00:00Z');
      const reason = 'High order volume';
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.sendDelayNotification(
        mockOrder,
        newEstimatedTime,
        reason
      );

      expect(result).toBe(true);
      
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('Reason: High order volume');
    });
  });

  describe('Bulk Notifications', () => {
    it('should send bulk notifications to multiple phone numbers', async () => {
      const phoneNumbers = ['+1234567890', '+0987654321', '+1122334455'];
      const message = 'Special promotion: 20% off all orders today!';
      
      mockTwilioClient.messages.create.mockResolvedValue({ sid: 'SMS123456' });

      const result = await notificationService.sendBulkNotification(phoneNumbers, message);

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk notifications', async () => {
      const phoneNumbers = ['+1234567890', '+0987654321', '+1122334455'];
      const message = 'Special promotion: 20% off all orders today!';
      
      mockTwilioClient.messages.create
        .mockResolvedValueOnce({ sid: 'SMS123456' })
        .mockRejectedValueOnce(new Error('Invalid phone number'))
        .mockResolvedValueOnce({ sid: 'SMS789012' });

      const result = await notificationService.sendBulkNotification(phoneNumbers, message);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(3);
    });

    it('should return all failed when Twilio is not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const service = new NotificationService();
      
      const phoneNumbers = ['+1234567890', '+0987654321'];
      const message = 'Test message';

      const result = await service.sendBulkNotification(phoneNumbers, message);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(2);
    });
  });

  describe('Phone Number Formatting', () => {
    it('should format 10-digit US phone numbers', async () => {
      const orderWithUSPhone = { ...mockOrder, customerPhone: '1234567890' };
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        orderWithUSPhone,
        OrderStatus.CONFIRMED
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.to).toBe('+11234567890');
    });

    it('should format 11-digit US phone numbers', async () => {
      const orderWithUSPhone = { ...mockOrder, customerPhone: '11234567890' };
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        orderWithUSPhone,
        OrderStatus.CONFIRMED
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.to).toBe('+11234567890');
    });

    it('should handle international phone numbers', async () => {
      const orderWithIntlPhone = { ...mockOrder, customerPhone: '+234801234567' };
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        orderWithIntlPhone,
        OrderStatus.CONFIRMED
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.to).toBe('+234801234567');
    });

    it('should handle phone numbers with formatting characters', async () => {
      const orderWithFormattedPhone = { ...mockOrder, customerPhone: '(123) 456-7890' };
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        orderWithFormattedPhone,
        OrderStatus.CONFIRMED
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.to).toBe('+11234567890');
    });
  });

  describe('Error Handling', () => {
    it('should handle Twilio API errors gracefully', async () => {
      const error = new Error('Twilio API Error');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
    });

    it('should log failed notifications', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('SMS delivery failed');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send SMS notification:',
        error
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockTwilioClient.messages.create.mockRejectedValue(timeoutError);

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
    });
  });

  describe('Test SMS Service', () => {
    it('should send test SMS successfully', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      const result = await notificationService.testSMSService('+1234567890');

      expect(result).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Test message from Jollof Palace ordering system. SMS notifications are working correctly!',
        from: '+1234567890',
        to: '+11234567890',
      });
    });

    it('should throw error when Twilio is not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const service = new NotificationService();

      await expect(service.testSMSService('+1234567890')).rejects.toThrow(
        'Twilio not configured'
      );
    });

    it('should throw error when test SMS fails', async () => {
      const error = new Error('Test SMS failed');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      await expect(notificationService.testSMSService('+1234567890')).rejects.toThrow(
        'Test SMS failed'
      );
    });
  });

  describe('Message Templates', () => {
    it('should generate proper order confirmation message', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED,
        mockOrder.estimatedReadyTime
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      const message = callArgs.body;

      expect(message).toContain('🍽️ Order Confirmed!');
      expect(message).toContain('ORD-123456-ABC');
      expect(message).toContain('confirmed and is being prepared');
      expect(message).toContain('Estimated ready time: 07:30 AM'); // Time is formatted with leading zero
      expect(message).toContain('Track your order: http://localhost:3000/order/ORD-123456-ABC');
      expect(message).toContain('- Jollof Palace');
    });

    it('should generate proper order ready message for pickup', async () => {
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.READY
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      const message = callArgs.body;

      expect(message).toContain('✅ Order Ready!');
      expect(message).toContain('ready for pickup');
      expect(message).toContain('come to the restaurant to collect');
    });

    it('should generate proper order ready message for delivery', async () => {
      const deliveryOrder = { ...mockOrder, orderType: OrderType.DELIVERY };
      const mockResult = { sid: 'SMS123456' };
      mockTwilioClient.messages.create.mockResolvedValue(mockResult);

      await notificationService.sendOrderStatusNotification(
        deliveryOrder,
        OrderStatus.READY
      );

      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      const message = callArgs.body;

      expect(message).toContain('✅ Order Ready!');
      expect(message).toContain('ready for delivery');
      expect(message).toContain('delivery driver is on the way');
    });
  });
});