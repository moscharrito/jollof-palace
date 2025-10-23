import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { PaymentService, CreatePaymentData } from '../services/PaymentService';
import { asyncHandler } from '../middleware/errorHandler';
import { PaymentMethod } from '@prisma/client';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class PaymentController extends BaseController {
  private paymentService: PaymentService;

  constructor() {
    super();
    this.paymentService = new PaymentService();
  }

  // POST /api/payments/initialize - Initialize payment (public)
  initializePayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, method, customerEmail } = req.body;

    if (!orderId || !method) {
      this.sendError(res, 'Order ID and payment method are required', 400);
      return;
    }

    if (!Object.values(PaymentMethod).includes(method)) {
      this.sendError(res, 'Invalid payment method', 400);
      return;
    }

    // Get order details to determine amount
    const order = await this.paymentService['db'].order.findUnique({
      where: { id: orderId },
      select: { id: true, total: true, status: true },
    });

    if (!order) {
      this.sendError(res, 'Order not found', 404);
      return;
    }

    if (order.status !== 'PENDING') {
      this.sendError(res, 'Order is not in a payable state', 400);
      return;
    }

    const paymentData: CreatePaymentData = {
      orderId,
      amount: order.total,
      currency: 'USD',
      method,
      customerEmail,
    };

    try {
      let result;

      switch (method) {
        case 'CARD':
          result = await this.paymentService.createStripePaymentIntent(paymentData);
          this.sendSuccess(res, {
            type: 'stripe',
            clientSecret: result.clientSecret,
            paymentIntentId: result.paymentIntentId,
            reference: result.reference,
          }, 'Payment initialized successfully');
          break;

        case 'PAYPAL':
          result = await this.paymentService.createPayPalOrder(paymentData);
          this.sendSuccess(res, {
            type: 'paypal',
            orderId: result.orderId,
            approvalUrl: result.approvalUrl,
            reference: result.reference,
          }, 'PayPal order created successfully');
          break;

        case 'APPLE_PAY':
          // Apple Pay uses Stripe's payment intents
          result = await this.paymentService.createStripePaymentIntent({
            ...paymentData,
            method: 'CARD', // Store as CARD in DB, but enable Apple Pay in Stripe
          });
          this.sendSuccess(res, {
            type: 'apple_pay',
            clientSecret: result.clientSecret,
            paymentIntentId: result.paymentIntentId,
            reference: result.reference,
          }, 'Apple Pay initialized successfully');
          break;

        case 'GOOGLE_PAY':
          // Google Pay also uses Stripe's payment intents
          result = await this.paymentService.createStripePaymentIntent({
            ...paymentData,
            method: 'CARD', // Store as CARD in DB, but enable Google Pay in Stripe
          });
          this.sendSuccess(res, {
            type: 'google_pay',
            clientSecret: result.clientSecret,
            paymentIntentId: result.paymentIntentId,
            reference: result.reference,
          }, 'Google Pay initialized successfully');
          break;

        default:
          this.sendError(res, 'Payment method not yet supported', 400);
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      this.sendError(res, error.message || 'Failed to initialize payment', 500);
    }
  });

  // POST /api/payments/webhooks/stripe - Stripe webhook handler
  handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      this.sendError(res, 'Webhook secret not configured', 500);
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      this.sendError(res, 'Invalid signature', 400);
      return;
    }

    try {
      await this.paymentService.handleStripeWebhook(event);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      this.sendError(res, 'Webhook processing failed', 500);
    }
  });

  // POST /api/payments/webhooks/paypal - PayPal webhook handler
  handlePayPalWebhook = asyncHandler(async (req: Request, res: Response) => {
    const eventData = req.body;

    // In production, you should verify the webhook signature
    // For now, we'll process the event directly
    try {
      await this.paymentService.handlePayPalWebhook(eventData);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('PayPal webhook processing error:', error);
      this.sendError(res, 'Webhook processing failed', 500);
    }
  });

  // GET /api/payments/verify/:reference - Verify payment status (public)
  verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;

    if (!reference) {
      this.sendError(res, 'Payment reference is required', 400);
      return;
    }

    const payment = await this.paymentService.verifyPayment(reference);

    this.sendSuccess(res, {
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }, 'Payment status retrieved successfully');
  });

  // GET /api/payments/order/:orderId - Get payments for an order (public)
  getOrderPayments = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const payments = await this.paymentService.getPaymentsByOrder(orderId);

    const sanitizedPayments = payments.map(payment => ({
      id: payment.id,
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    this.sendSuccess(res, sanitizedPayments, 'Order payments retrieved successfully');
  });

  // POST /api/admin/payments/:id/refund - Refund payment (admin only)
  refundPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await this.paymentService.refundPayment(id, amount);

    this.sendSuccess(res, {
      id: payment.id,
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      updatedAt: payment.updatedAt,
    }, 'Payment refunded successfully');
  });

  // GET /api/admin/payments/stats - Get payment statistics (admin only)
  getPaymentStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await this.paymentService.getPaymentStats();

    // Convert amounts from cents to dollars for display
    const formattedStats = {
      ...stats,
      totalRevenue: stats.totalRevenue / 100,
      refundedAmount: stats.refundedAmount / 100,
    };

    this.sendSuccess(res, formattedStats, 'Payment statistics retrieved successfully');
  });

  // GET /api/payments/methods - Get available payment methods (public)
  getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
    const paymentMethods = [
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
    ];

    this.sendSuccess(res, paymentMethods, 'Payment methods retrieved successfully');
  });

  // GET /api/payments/config - Get payment configuration (public)
  getPaymentConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      currency: 'USD',
      country: 'US',
      supportedMethods: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL'],
    };

    this.sendSuccess(res, config, 'Payment configuration retrieved successfully');
  });

  // POST /api/payments/apple-pay/validate - Validate Apple Pay merchant (public)
  validateApplePayMerchant = asyncHandler(async (req: Request, res: Response) => {
    const { validationURL } = req.body;

    if (!validationURL) {
      this.sendError(res, 'Validation URL is required', 400);
      return;
    }

    try {
      // In production, you would validate the merchant with Apple
      // This is a simplified implementation
      const merchantSession = {
        epochTimestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
        merchantSessionIdentifier: 'merchant-session-' + Date.now(),
        nonce: Math.random().toString(36).substring(2),
        merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID,
        domainName: process.env.FRONTEND_DOMAIN,
        displayName: 'Jollof Palace',
      };

      this.sendSuccess(res, merchantSession, 'Apple Pay merchant validated successfully');
    } catch (error: any) {
      console.error('Apple Pay validation error:', error);
      this.sendError(res, 'Apple Pay validation failed', 500);
    }
  });
}