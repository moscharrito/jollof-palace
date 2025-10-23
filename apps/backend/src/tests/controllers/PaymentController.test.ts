import request from 'supertest';
import { app } from '../../app';
import { PaymentService } from '../../services/PaymentService';
import { generateAuthToken } from '../../lib/auth';

// Mock the PaymentService
jest.mock('../../services/PaymentService');
const MockedPaymentService = PaymentService as jest.MockedClass<typeof PaymentService>;

describe('PaymentController', () => {
  let mockPaymentService: jest.Mocked<PaymentService>;
  let adminToken: string;

  beforeEach(() => {
    mockPaymentService = new MockedPaymentService() as jest.Mocked<PaymentService>;
    MockedPaymentService.mockImplementation(() => mockPaymentService);

    // Generate admin token for protected routes
    adminToken = generateAuthToken({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/payments/initialize', () => {
    const validPaymentData = {
      orderId: 'order-1',
      method: 'CARD',
      customerEmail: 'test@example.com',
    };

    beforeEach(() => {
      // Mock database access through service
      (mockPaymentService as any).db = {
        order: {
          findUnique: jest.fn(),
        },
      };
    });

    it('should initialize Stripe payment successfully', async () => {
      // Mock order lookup
      (mockPaymentService as any).db.order.findUnique.mockResolvedValue({
        id: 'order-1',
        total: 2500,
        status: 'PENDING',
      });

      mockPaymentService.createStripePaymentIntent.mockResolvedValue({
        clientSecret: 'pi_test_123_secret',
        paymentIntentId: 'pi_test_123',
        reference: 'PAY_123456',
      });

      const response = await request(app)
        .post('/api/payments/initialize')
        .send(validPaymentData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          type: 'stripe',
          clientSecret: 'pi_test_123_secret',
          paymentIntentId: 'pi_test_123',
          reference: 'PAY_123456',
        },
      });
    });

    it('should initialize PayPal payment successfully', async () => {
      const paypalData = { ...validPaymentData, method: 'PAYPAL' };

      (mockPaymentService as any).db.order.findUnique.mockResolvedValue({
        id: 'order-1',
        total: 2500,
        status: 'PENDING',
      });

      mockPaymentService.createPayPalOrder.mockResolvedValue({
        orderId: 'paypal-order-123',
        approvalUrl: 'https://paypal.com/approve/123',
        reference: 'PAY_123456',
      });

      const response = await request(app)
        .post('/api/payments/initialize')
        .send(paypalData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'PayPal order created successfully',
        data: {
          type: 'paypal',
          orderId: 'paypal-order-123',
          approvalUrl: 'https://paypal.com/approve/123',
          reference: 'PAY_123456',
        },
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .send({ orderId: 'order-1' }) // Missing method
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order ID and payment method are required');
    });

    it('should return 400 for invalid payment method', async () => {
      const invalidData = { ...validPaymentData, method: 'INVALID_METHOD' };

      const response = await request(app)
        .post('/api/payments/initialize')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid payment method');
    });

    it('should return 404 for non-existent order', async () => {
      (mockPaymentService as any).db.order.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/payments/initialize')
        .send(validPaymentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order not found');
    });

    it('should return 400 for non-payable order status', async () => {
      (mockPaymentService as any).db.order.findUnique.mockResolvedValue({
        id: 'order-1',
        total: 2500,
        status: 'CONFIRMED', // Not PENDING
      });

      const response = await request(app)
        .post('/api/payments/initialize')
        .send(validPaymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order is not in a payable state');
    });
  });

  describe('GET /api/payments/verify/:reference', () => {
    it('should verify payment successfully', async () => {
      const mockPayment = {
        reference: 'PAY_123456',
        status: 'COMPLETED',
        amount: 2500,
        currency: 'USD',
        method: 'CARD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPaymentService.verifyPayment.mockResolvedValue(mockPayment as any);

      const response = await request(app)
        .get('/api/payments/verify/PAY_123456')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          reference: 'PAY_123456',
          status: 'COMPLETED',
          amount: 2500,
          currency: 'USD',
          method: 'CARD',
          createdAt: mockPayment.createdAt.toISOString(),
          updatedAt: mockPayment.updatedAt.toISOString(),
        },
      });
    });

    it('should return 404 for invalid payment reference', async () => {
      mockPaymentService.verifyPayment.mockRejectedValue(new Error('Payment not found'));

      const response = await request(app)
        .get('/api/payments/verify/INVALID_REF')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/methods', () => {
    it('should return available payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        {
          id: 'CARD',
          name: 'Credit/Debit Card',
          description: 'Pay with Visa, Mastercard, American Express',
          icon: 'credit-card',
          enabled: true,
        },
        {
          id: 'APPLE_PAY',
          name: 'Apple Pay',
          description: 'Pay securely with Touch ID or Face ID',
          icon: 'apple',
          enabled: true,
        },
        {
          id: 'GOOGLE_PAY',
          name: 'Google Pay',
          description: 'Pay quickly with your Google account',
          icon: 'google',
          enabled: true,
        },
        {
          id: 'PAYPAL',
          name: 'PayPal',
          description: 'Pay with your PayPal account',
          icon: 'paypal',
          enabled: true,
        },
      ]);
    });
  });

  describe('GET /api/payments/config', () => {
    it('should return payment configuration', async () => {
      const response = await request(app)
        .get('/api/payments/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        currency: 'USD',
        country: 'US',
        supportedMethods: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL'],
      });
    });
  });

  describe('GET /api/payments/order/:orderId', () => {
    it('should return payments for an order', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          reference: 'PAY_123456',
          status: 'COMPLETED',
          amount: 2500,
          currency: 'USD',
          method: 'CARD',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPaymentService.getPaymentsByOrder.mockResolvedValue(mockPayments as any);

      const response = await request(app)
        .get('/api/payments/order/order-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual({
        id: 'payment-1',
        reference: 'PAY_123456',
        status: 'COMPLETED',
        amount: 2500,
        currency: 'USD',
        method: 'CARD',
        createdAt: mockPayments[0].createdAt.toISOString(),
        updatedAt: mockPayments[0].updatedAt.toISOString(),
      });
    });
  });

  describe('POST /api/admin/payments/:id/refund', () => {
    it('should refund payment successfully (admin only)', async () => {
      const mockRefundedPayment = {
        id: 'payment-1',
        reference: 'PAY_123456',
        status: 'REFUNDED',
        amount: 2500,
        currency: 'USD',
        method: 'CARD',
        updatedAt: new Date(),
      };

      mockPaymentService.refundPayment.mockResolvedValue(mockRefundedPayment as any);

      const response = await request(app)
        .post('/api/admin/payments/payment-1/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 2500, reason: 'Customer request' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REFUNDED');
      expect(mockPaymentService.refundPayment).toHaveBeenCalledWith('payment-1', 2500);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/admin/payments/payment-1/refund')
        .send({ amount: 2500 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/payments/stats', () => {
    it('should return payment statistics (admin only)', async () => {
      const mockStats = {
        totalPayments: 100,
        totalRevenue: 250000, // In cents
        successfulPayments: 85,
        failedPayments: 10,
        refundedAmount: 5000, // In cents
        paymentMethodDistribution: {
          CARD: 60,
          PAYPAL: 25,
          APPLE_PAY: 15,
        },
      };

      mockPaymentService.getPaymentStats.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/admin/payments/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        totalPayments: 100,
        totalRevenue: 2500, // Converted to dollars
        successfulPayments: 85,
        failedPayments: 10,
        refundedAmount: 50, // Converted to dollars
        paymentMethodDistribution: {
          CARD: 60,
          PAYPAL: 25,
          APPLE_PAY: 15,
        },
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/payments/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/apple-pay/validate', () => {
    it('should validate Apple Pay merchant successfully', async () => {
      const validationData = {
        validationURL: 'https://apple-pay-gateway.apple.com/paymentservices/startSession',
      };

      const response = await request(app)
        .post('/api/payments/apple-pay/validate')
        .send(validationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('merchantSessionIdentifier');
      expect(response.body.data).toHaveProperty('epochTimestamp');
      expect(response.body.data).toHaveProperty('expiresAt');
      expect(response.body.data.displayName).toBe('Jollof Palace');
    });

    it('should return 400 for missing validation URL', async () => {
      const response = await request(app)
        .post('/api/payments/apple-pay/validate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation URL is required');
    });
  });
});