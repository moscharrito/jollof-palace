import { NotificationService } from '../../services/NotificationService';
import { Order, OrderStatus, OrderType } from '@prisma/client';

describe('SMS Notification Integration Tests', () => {
  let notificationService: NotificationService;
  let mockOrder: Order;

  beforeAll(() => {
    // Set up test environment variables
    // These should be real Twilio test credentials for integration testing
    process.env.TWILIO_ACCOUNT_SID = process.env.TEST_TWILIO_ACCOUNT_SID || 'test_sid';
    process.env.TWILIO_AUTH_TOKEN = process.env.TEST_TWILIO_AUTH_TOKEN || 'test_token';
    process.env.TWILIO_PHONE_NUMBER = process.env.TEST_TWILIO_PHONE_NUMBER || '+15005550006'; // Twilio test number
    process.env.FRONTEND_URL = 'http://localhost:3000';

    notificationService = new NotificationService();

    // Mock order for testing
    mockOrder = {
      id: 'test-order-123',
      orderNumber: 'ORD-TEST-123',
      customerName: 'Test Customer',
      customerPhone: '+15005550006', // Twilio test number that always succeeds
      customerEmail: 'test@example.com',
      orderType: OrderType.PICKUP,
      deliveryStreet: null,
      deliveryCity: null,
      deliveryState: null,
      deliveryPostalCode: null,
      deliveryLandmark: null,
      subtotal: 250000,
      tax: 18750,
      deliveryFee: 0,
      total: 268750,
      status: OrderStatus.CONFIRMED,
      estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      actualReadyTime: null,
      specialInstructions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('Real Twilio Integration', () => {
    // Skip these tests if running in CI without real Twilio credentials
    const skipIfNoCredentials = () => {
      if (!process.env.TEST_TWILIO_ACCOUNT_SID || !process.env.TEST_TWILIO_AUTH_TOKEN) {
        console.log('Skipping Twilio integration tests - no test credentials provided');
        return true;
      }
      return false;
    };

    it('should send real SMS for order confirmation', async () => {
      if (skipIfNoCredentials()) return;

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED,
        mockOrder.estimatedReadyTime
      );

      expect(result).toBe(true);
    }, 10000); // 10 second timeout for network request

    it('should send real SMS for order ready notification', async () => {
      if (skipIfNoCredentials()) return;

      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.READY
      );

      expect(result).toBe(true);
    }, 10000);

    it('should send real delay notification', async () => {
      if (skipIfNoCredentials()) return;

      const newEstimatedTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const result = await notificationService.sendDelayNotification(
        mockOrder,
        newEstimatedTime,
        'High order volume'
      );

      expect(result).toBe(true);
    }, 10000);

    it('should test SMS service connectivity', async () => {
      if (skipIfNoCredentials()) return;

      const result = await notificationService.testSMSService('+15005550006');
      expect(result).toBe(true);
    }, 10000);
  });

  describe('Error Scenarios with Real Twilio', () => {
    it('should handle invalid phone number gracefully', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      const orderWithInvalidPhone = {
        ...mockOrder,
        customerPhone: '+15005550001', // Twilio test number that always fails
      };

      const result = await notificationService.sendOrderStatusNotification(
        orderWithInvalidPhone,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
    }, 10000);

    it('should handle unverified phone number in trial account', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      const orderWithUnverifiedPhone = {
        ...mockOrder,
        customerPhone: '+15005550007', // Twilio test number for unverified number error
      };

      const result = await notificationService.sendOrderStatusNotification(
        orderWithUnverifiedPhone,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
    }, 10000);
  });

  describe('Fallback Handling', () => {
    it('should gracefully handle SMS failure without crashing', async () => {
      // Test with invalid credentials to simulate service failure
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      const originalToken = process.env.TWILIO_AUTH_TOKEN;

      process.env.TWILIO_ACCOUNT_SID = 'invalid_sid';
      process.env.TWILIO_AUTH_TOKEN = 'invalid_token';

      const failingService = new NotificationService();
      
      const result = await failingService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);

      // Restore original credentials
      process.env.TWILIO_ACCOUNT_SID = originalSid;
      process.env.TWILIO_AUTH_TOKEN = originalToken;
    }, 10000);

    it('should continue order processing even if SMS fails', async () => {
      // This test ensures that SMS failure doesn't break the order flow
      const orderWithBadPhone = {
        ...mockOrder,
        customerPhone: 'invalid-phone',
      };

      // Should not throw an error, just return false
      const result = await notificationService.sendOrderStatusNotification(
        orderWithBadPhone,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(false);
    });
  });

  describe('Bulk SMS Integration', () => {
    it('should send bulk notifications to multiple valid numbers', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      const phoneNumbers = [
        '+15005550006', // Valid test number
        '+15005550006', // Valid test number (duplicate for testing)
      ];
      const message = 'Integration test: Bulk SMS notification';

      const result = await notificationService.sendBulkNotification(phoneNumbers, message);

      expect(result.sent).toBeGreaterThan(0);
      expect(result.sent + result.failed).toBe(phoneNumbers.length);
    }, 15000);

    it('should handle mixed valid/invalid numbers in bulk send', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      const phoneNumbers = [
        '+15005550006', // Valid test number
        '+15005550001', // Invalid test number
        '+15005550006', // Valid test number
      ];
      const message = 'Integration test: Mixed bulk SMS';

      const result = await notificationService.sendBulkNotification(phoneNumbers, message);

      expect(result.sent).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.sent + result.failed).toBe(phoneNumbers.length);
    }, 15000);
  });

  describe('Message Content Validation', () => {
    it('should include all required information in order confirmation SMS', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      // We can't easily verify the actual message content in integration tests
      // but we can ensure the SMS is sent successfully with proper data
      const result = await notificationService.sendOrderStatusNotification(
        mockOrder,
        OrderStatus.CONFIRMED,
        mockOrder.estimatedReadyTime
      );

      expect(result).toBe(true);
    }, 10000);

    it('should handle special characters in order details', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      const orderWithSpecialChars = {
        ...mockOrder,
        orderNumber: 'ORD-TEST-123-ñáéíóú',
        customerName: 'José María',
        specialInstructions: 'Extra spicy 🌶️ & no onions',
      };

      const result = await notificationService.sendOrderStatusNotification(
        orderWithSpecialChars,
        OrderStatus.CONFIRMED
      );

      expect(result).toBe(true);
    }, 10000);
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle multiple rapid SMS sends', async () => {
      if (!notificationService.isConfigured()) {
        console.log('Skipping - Twilio not configured');
        return;
      }

      const promises = [];
      for (let i = 0; i < 3; i++) {
        const testOrder = {
          ...mockOrder,
          id: `test-order-${i}`,
          orderNumber: `ORD-TEST-${i}`,
        };
        
        promises.push(
          notificationService.sendOrderStatusNotification(
            testOrder,
            OrderStatus.CONFIRMED
          )
        );
      }

      const results = await Promise.all(promises);
      
      // At least some should succeed (depending on rate limits)
      const successCount = results.filter(r => r === true).length;
      expect(successCount).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Configuration Validation', () => {
    it('should properly detect when Twilio is configured', () => {
      expect(notificationService.isConfigured()).toBe(true);
    });

    it('should handle missing phone number configuration', () => {
      const originalPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      delete process.env.TWILIO_PHONE_NUMBER;

      const serviceWithoutPhone = new NotificationService();
      expect(serviceWithoutPhone.isConfigured()).toBe(false);

      // Restore
      process.env.TWILIO_PHONE_NUMBER = originalPhoneNumber;
    });
  });
});