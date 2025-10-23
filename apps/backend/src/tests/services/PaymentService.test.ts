import { PaymentService } from '../../services/PaymentService';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockDb: DeepMockProxy<PrismaClient>;
  let mockStripe: DeepMockProxy<Stripe>;

  beforeEach(() => {
    mockDb = mockDeep<PrismaClient>();
    mockStripe = mockDeep<Stripe>();
    
    // Mock Stripe constructor
    MockedStripe.mockImplementation(() => mockStripe as any);
    
    paymentService = new PaymentService();
    (paymentService as any).db = mockDb;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripePaymentIntent', () => {
    const mockOrder = {
      id: 'order-1',
      status: 'PENDING' as const,
      total: 2500, // $25.00 in cents
      customerEmail: 'test@example.com',
      customerName: 'John Doe',
    };

    const mockPaymentData = {
      orderId: 'order-1',
      amount: 2500,
      currency: 'USD',
      method: 'CARD' as const,
      customerEmail: 'test@example.com',
    };

    it('should create a Stripe payment intent successfully', async () => {
      // Mock database calls
      mockDb.order.findUnique.mockResolvedValue(mockOrder);
      mockDb.payment.create.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        amount: 2500,
        currency: 'USD',
        method: 'CARD',
        status: 'PENDING',
        transactionId: 'pi_test_123',
        reference: 'PAY_123456',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Stripe payment intent
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);

      const result = await paymentService.createStripePaymentIntent(mockPaymentData);

      expect(result).toEqual({
        clientSecret: 'pi_test_123_secret',
        paymentIntentId: 'pi_test_123',
        reference: expect.any(String),
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2500,
        currency: 'usd',
        customer_email: 'test@example.com',
        metadata: {
          orderId: 'order-1',
          reference: expect.any(String),
          customerName: 'John Doe',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      });
    });

    it('should throw error if order not found', async () => {
      mockDb.order.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.createStripePaymentIntent(mockPaymentData)
      ).rejects.toThrow('Order not found');
    });

    it('should throw error if order is not in PENDING status', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED' as const,
      });

      await expect(
        paymentService.createStripePaymentIntent(mockPaymentData)
      ).rejects.toThrow('Order is not in a payable state');
    });

    it('should throw error if payment amount does not match order total', async () => {
      mockDb.order.findUnique.mockResolvedValue(mockOrder);

      const invalidPaymentData = {
        ...mockPaymentData,
        amount: 3000, // Different from order total
      };

      await expect(
        paymentService.createStripePaymentIntent(invalidPaymentData)
      ).rejects.toThrow('Payment amount does not match order total');
    });
  });

  describe('verifyPayment', () => {
    const mockPayment = {
      id: 'payment-1',
      orderId: 'order-1',
      amount: 2500,
      currency: 'USD',
      method: 'CARD' as const,
      status: 'PENDING' as const,
      transactionId: 'pi_test_123',
      reference: 'PAY_123456',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      order: {
        id: 'order-1',
        status: 'PENDING' as const,
        orderNumber: 'ORD-001',
      },
    };

    it('should return payment if already completed', async () => {
      const completedPayment = {
        ...mockPayment,
        status: 'COMPLETED' as const,
      };
      mockDb.payment.findUnique.mockResolvedValue(completedPayment);

      const result = await paymentService.verifyPayment('PAY_123456');

      expect(result).toEqual(completedPayment);
      expect(mockStripe.paymentIntents.retrieve).not.toHaveBeenCalled();
    });

    it('should verify with Stripe and update status if payment succeeded', async () => {
      mockDb.payment.findUnique.mockResolvedValue(mockPayment);
      
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
      };
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any);

      const updatedPayment = {
        ...mockPayment,
        status: 'COMPLETED' as const,
      };
      mockDb.payment.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.verifyPayment('PAY_123456');

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test_123');
      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: {
          status: 'COMPLETED',
        },
      });
      expect(result).toEqual(updatedPayment);
    });

    it('should throw error if payment not found', async () => {
      mockDb.payment.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.verifyPayment('INVALID_REF')
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      const mockStats = [
        Promise.resolve(100), // totalPayments
        Promise.resolve(85),  // successfulPayments
        Promise.resolve(10),  // failedPayments
        Promise.resolve({ _sum: { amount: 250000 } }), // revenueResult
        Promise.resolve({ _sum: { amount: 5000 } }),   // refundResult
        Promise.resolve([
          { method: 'CARD', _count: { id: 60 } },
          { method: 'PAYPAL', _count: { id: 25 } },
          { method: 'APPLE_PAY', _count: { id: 15 } },
        ]), // methodDistribution
      ];

      mockDb.payment.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(85)   // successful
        .mockResolvedValueOnce(10);  // failed

      mockDb.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 250000 } }) // revenue
        .mockResolvedValueOnce({ _sum: { amount: 5000 } });  // refunds

      mockDb.payment.groupBy.mockResolvedValue([
        { method: 'CARD', _count: { id: 60 } },
        { method: 'PAYPAL', _count: { id: 25 } },
        { method: 'APPLE_PAY', _count: { id: 15 } },
      ] as any);

      const result = await paymentService.getPaymentStats();

      expect(result).toEqual({
        totalPayments: 100,
        totalRevenue: 250000,
        successfulPayments: 85,
        failedPayments: 10,
        refundedAmount: 5000,
        paymentMethodDistribution: {
          CARD: 60,
          PAYPAL: 25,
          APPLE_PAY: 15,
        },
      });
    });
  });

  describe('refundPayment', () => {
    const mockPayment = {
      id: 'payment-1',
      orderId: 'order-1',
      amount: 2500,
      currency: 'USD',
      method: 'CARD' as const,
      status: 'COMPLETED' as const,
      transactionId: 'pi_test_123',
      reference: 'PAY_123456',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      order: {
        id: 'order-1',
        status: 'CONFIRMED' as const,
      },
    };

    it('should create a refund successfully', async () => {
      mockDb.payment.findUnique.mockResolvedValue(mockPayment);

      const mockRefund = {
        id: 're_test_123',
        amount: 2500,
        status: 'succeeded',
      };
      mockStripe.refunds.create.mockResolvedValue(mockRefund as any);

      const refundedPayment = {
        ...mockPayment,
        status: 'REFUNDED' as const,
      };
      mockDb.payment.update.mockResolvedValue(refundedPayment);

      const result = await paymentService.refundPayment('payment-1');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 2500,
        metadata: {
          orderId: 'order-1',
          originalPaymentId: 'payment-1',
        },
      });

      expect(result).toEqual(refundedPayment);
    });

    it('should throw error if payment not found', async () => {
      mockDb.payment.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.refundPayment('invalid-id')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment is not completed', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: 'PENDING' as const,
      };
      mockDb.payment.findUnique.mockResolvedValue(pendingPayment);

      await expect(
        paymentService.refundPayment('payment-1')
      ).rejects.toThrow('Can only refund completed payments');
    });
  });
});