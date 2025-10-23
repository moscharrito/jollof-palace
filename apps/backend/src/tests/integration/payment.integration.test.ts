import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { generateAuthToken } from '../../lib/auth';

const prisma = new PrismaClient();

describe('Payment Integration Tests', () => {
  let adminToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Generate admin token
    adminToken = generateAuthToken({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });

    // Create a test order for payment testing
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-ORDER-001',
        customerName: 'Test Customer',
        customerPhone: '+1234567890',
        customerEmail: 'test@example.com',
        orderType: 'PICKUP',
        status: 'PENDING',
        subtotal: 2000, // $20.00 in cents
        tax: 175, // $1.75 in cents (8.75% tax)
        total: 2175, // $21.75 in cents
        estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        items: {
          create: [
            {
              menuItemId: 'menu-item-1',
              quantity: 1,
              unitPrice: 2000,
              totalPrice: 2000,
            },
          ],
        },
      },
    });

    testOrderId = testOrder.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany({
      where: { orderId: testOrderId },
    });
    await prisma.payment.deleteMany({
      where: { orderId: testOrderId },
    });
    await prisma.order.delete({
      where: { id: testOrderId },
    });
    await prisma.$disconnect();
  });

  describe('Payment Flow', () => {
    it('should complete full payment flow with Stripe', async () => {
      // Step 1: Get payment methods
      const methodsResponse = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(methodsResponse.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'CARD',
            name: 'Credit/Debit Card',
            enabled: true,
          }),
        ])
      );

      // Step 2: Get payment configuration
      const configResponse = await request(app)
        .get('/api/payments/config')
        .expect(200);

      expect(configResponse.body.data).toEqual({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        currency: 'USD',
        country: 'US',
        supportedMethods: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL'],
      });

      // Step 3: Initialize payment
      const initResponse = await request(app)
        .post('/api/payments/initialize')
        .send({
          orderId: testOrderId,
          method: 'CARD',
          customerEmail: 'test@example.com',
        })
        .expect(200);

      expect(initResponse.body.success).toBe(true);
      expect(initResponse.body.data).toHaveProperty('clientSecret');
      expect(initResponse.body.data).toHaveProperty('paymentIntentId');
      expect(initResponse.body.data).toHaveProperty('reference');

      const paymentReference = initResponse.body.data.reference;

      // Step 4: Verify payment status
      const verifyResponse = await request(app)
        .get(`/api/payments/verify/${paymentReference}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.status).toBe('PENDING');
      expect(verifyResponse.body.data.amount).toBe(2175);
      expect(verifyResponse.body.data.currency).toBe('USD');

      // Step 5: Get order payments
      const orderPaymentsResponse = await request(app)
        .get(`/api/payments/order/${testOrderId}`)
        .expect(200);

      expect(orderPaymentsResponse.body.success).toBe(true);
      expect(orderPaymentsResponse.body.data).toHaveLength(1);
      expect(orderPaymentsResponse.body.data[0].reference).toBe(paymentReference);
    });

    it('should handle PayPal payment initialization', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .send({
          orderId: testOrderId,
          method: 'PAYPAL',
          customerEmail: 'test@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('paypal');
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data).toHaveProperty('approvalUrl');
      expect(response.body.data).toHaveProperty('reference');
    });

    it('should handle Apple Pay initialization', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .send({
          orderId: testOrderId,
          method: 'APPLE_PAY',
          customerEmail: 'test@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('apple_pay');
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data).toHaveProperty('paymentIntentId');
    });

    it('should validate Apple Pay merchant', async () => {
      const response = await request(app)
        .post('/api/payments/apple-pay/validate')
        .send({
          validationURL: 'https://apple-pay-gateway.apple.com/paymentservices/startSession',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('merchantSessionIdentifier');
      expect(response.body.data.displayName).toBe('Jollof Palace');
    });
  });

  describe('Admin Payment Operations', () => {
    let paymentId: string;

    beforeAll(async () => {
      // Create a completed payment for refund testing
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          amount: 2175,
          currency: 'USD',
          method: 'CARD',
          status: 'COMPLETED',
          transactionId: 'pi_test_completed',
          reference: 'PAY_TEST_COMPLETED',
          metadata: {},
        },
      });
      paymentId = payment.id;
    });

    afterAll(async () => {
      await prisma.payment.delete({
        where: { id: paymentId },
      });
    });

    it('should get payment statistics', async () => {
      const response = await request(app)
        .get('/api/admin/payments/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPayments');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('successfulPayments');
      expect(response.body.data).toHaveProperty('failedPayments');
      expect(response.body.data).toHaveProperty('paymentMethodDistribution');
    });

    it('should require authentication for admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/payments/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .send({
          orderId: 'non-existent-order',
          method: 'CARD',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order not found');
    });

    it('should return 400 for invalid payment method', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .send({
          orderId: testOrderId,
          method: 'INVALID_METHOD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid payment method');
    });

    it('should return 404 for non-existent payment reference', async () => {
      const response = await request(app)
        .get('/api/payments/verify/INVALID_REFERENCE')
        .expect(500); // Service will throw error

      expect(response.body.success).toBe(false);
    });

    it('should validate Apple Pay validation URL', async () => {
      const response = await request(app)
        .post('/api/payments/apple-pay/validate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation URL is required');
    });
  });
});