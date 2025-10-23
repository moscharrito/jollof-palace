import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import { BaseService } from './BaseService';
import { NotFoundError, BusinessLogicError } from '../middleware/errorHandler';
// Temporary local implementation until shared package is properly linked
function generatePaymentReference(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
}
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface CreatePaymentData {
  orderId: string;
  amount: number; // Amount in cents
  currency: string;
  method: PaymentMethod;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  reference: string;
}

export interface PayPalOrderResult {
  orderId: string;
  approvalUrl: string;
  reference: string;
}

export class PaymentService extends BaseService {
  async createStripePaymentIntent(data: CreatePaymentData): Promise<PaymentIntentResult> {
    try {
      // Verify order exists and is in correct status
      const order = await this.db.order.findUnique({
        where: { id: data.orderId },
        select: { id: true, status: true, total: true, customerEmail: true, customerName: true },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new BusinessLogicError('Order is not in a payable state');
      }

      // Verify amount matches order total
      if (data.amount !== order.total) {
        throw new BusinessLogicError('Payment amount does not match order total');
      }

      const reference = generatePaymentReference();

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        receipt_email: data.customerEmail || order.customerEmail || undefined,
        metadata: {
          orderId: data.orderId,
          reference,
          customerName: order.customerName,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Enable Apple Pay and Google Pay
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      });

      // Create payment record
      await this.db.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: data.method,
          status: 'PENDING',
          transactionId: paymentIntent.id,
          reference,
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          },
        },
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        reference,
      };
    } catch (error) {
      this.handleError(error, 'PaymentService.createStripePaymentIntent');
    }
  }

  async createPayPalOrder(data: CreatePaymentData): Promise<PayPalOrderResult> {
    try {
      // Verify order exists and is in correct status
      const order = await this.db.order.findUnique({
        where: { id: data.orderId },
        select: { id: true, status: true, total: true, orderNumber: true },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new BusinessLogicError('Order is not in a payable state');
      }

      if (data.amount !== order.total) {
        throw new BusinessLogicError('Payment amount does not match order total');
      }

      const reference = generatePaymentReference();
      const amountInDollars = (data.amount / 100).toFixed(2); // Convert cents to dollars

      // Create PayPal order using their REST API
      const paypalOrder = await this.createPayPalOrderRequest({
        amount: amountInDollars,
        currency: data.currency,
        orderId: data.orderId,
        orderNumber: order.orderNumber,
        reference,
      });

      // Create payment record
      await this.db.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: 'PAYPAL',
          status: 'PENDING',
          transactionId: paypalOrder.id,
          reference,
          metadata: {
            paypalOrderId: paypalOrder.id,
            approvalUrl: paypalOrder.links.find((link: any) => link.rel === 'approve')?.href,
          },
        },
      });

      return {
        orderId: paypalOrder.id,
        approvalUrl: paypalOrder.links.find((link: any) => link.rel === 'approve')?.href || '',
        reference,
      };
    } catch (error) {
      this.handleError(error, 'PaymentService.createPayPalOrder');
    }
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCancellation(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      this.handleError(error, 'PaymentService.handleStripeWebhook');
    }
  }

  async handlePayPalWebhook(eventData: any): Promise<void> {
    try {
      switch (eventData.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handlePayPalOrderApproved(eventData.resource);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(eventData.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalPaymentDenied(eventData.resource);
          break;
        default:
          console.log(`Unhandled PayPal event type: ${eventData.event_type}`);
      }
    } catch (error) {
      this.handleError(error, 'PaymentService.handlePayPalWebhook');
    }
  }

  async verifyPayment(reference: string): Promise<Payment> {
    try {
      const payment = await this.db.payment.findUnique({
        where: { reference },
        include: {
          order: {
            select: { id: true, status: true, orderNumber: true },
          },
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // If payment is already completed, return it
      if (payment.status === 'COMPLETED') {
        return payment;
      }

      // Verify with payment provider
      if (payment.method === 'CARD' && payment.transactionId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);
        
        if (paymentIntent.status === 'succeeded') {
          return await this.updatePaymentStatus(payment.id, 'COMPLETED');
        } else if (paymentIntent.status === 'canceled') {
          return await this.updatePaymentStatus(payment.id, 'FAILED');
        }
      }

      return payment;
    } catch (error) {
      this.handleError(error, 'PaymentService.verifyPayment');
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    try {
      const payment = await this.db.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            select: { id: true, status: true },
          },
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new BusinessLogicError('Can only refund completed payments');
      }

      const refundAmount = amount || payment.amount;

      if (payment.method === 'CARD' && payment.transactionId) {
        // Create Stripe refund
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: refundAmount,
          metadata: {
            orderId: payment.orderId,
            originalPaymentId: payment.id,
          },
        });

        // Update payment status
        const updatedPayment = await this.updatePaymentStatus(
          payment.id,
          refundAmount === payment.amount ? 'REFUNDED' : 'COMPLETED',
          {
            refundId: refund.id,
            refundAmount,
            refundedAt: new Date(),
          }
        );

        return updatedPayment;
      }

      throw new BusinessLogicError('Refund not supported for this payment method');
    } catch (error) {
      this.handleError(error, 'PaymentService.refundPayment');
    }
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    try {
      return await this.db.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleError(error, 'PaymentService.getPaymentsByOrder');
    }
  }

  async getPaymentStats(): Promise<{
    totalPayments: number;
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    refundedAmount: number;
    paymentMethodDistribution: Record<PaymentMethod, number>;
  }> {
    try {
      const [
        totalPayments,
        successfulPayments,
        failedPayments,
        revenueResult,
        refundResult,
        methodDistribution,
      ] = await Promise.all([
        this.db.payment.count(),
        this.db.payment.count({ where: { status: 'COMPLETED' } }),
        this.db.payment.count({ where: { status: 'FAILED' } }),
        this.db.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        this.db.payment.aggregate({
          where: { status: 'REFUNDED' },
          _sum: { amount: true },
        }),
        this.db.payment.groupBy({
          by: ['method'],
          _count: { id: true },
        }),
      ]);

      const totalRevenue = revenueResult._sum.amount || 0;
      const refundedAmount = refundResult._sum.amount || 0;

      const methodStats = methodDistribution.reduce((acc, item) => {
        acc[item.method] = item._count.id;
        return acc;
      }, {} as Record<PaymentMethod, number>);

      return {
        totalPayments,
        totalRevenue,
        successfulPayments,
        failedPayments,
        refundedAmount,
        paymentMethodDistribution: methodStats,
      };
    } catch (error) {
      this.handleError(error, 'PaymentService.getPaymentStats');
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    await this.executeTransaction(async (tx) => {
      // Update payment status
      await tx.payment.updateMany({
        where: {
          transactionId: paymentIntent.id,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            completedAt: new Date(),
          },
        },
      });

      // Update order status to confirmed
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });
    });
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await this.db.payment.updateMany({
      where: {
        transactionId: paymentIntent.id,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message,
          failedAt: new Date(),
        },
      },
    });
  }

  private async handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await this.db.payment.updateMany({
      where: {
        transactionId: paymentIntent.id,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          cancelledAt: new Date(),
        },
      },
    });
  }

  private async handlePayPalOrderApproved(resource: any): Promise<void> {
    // PayPal order approved, but not yet captured
    await this.db.payment.updateMany({
      where: {
        transactionId: resource.id,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        metadata: {
          paypalOrderId: resource.id,
          approvedAt: new Date(),
        },
      },
    });
  }

  private async handlePayPalPaymentCompleted(resource: any): Promise<void> {
    const orderId = resource.custom_id; // We'll store orderId in custom_id
    
    await this.executeTransaction(async (tx) => {
      // Update payment status
      await tx.payment.updateMany({
        where: {
          orderId,
          status: 'PROCESSING',
        },
        data: {
          status: 'COMPLETED',
          metadata: {
            paypalCaptureId: resource.id,
            completedAt: new Date(),
          },
        },
      });

      // Update order status to confirmed
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });
    });
  }

  private async handlePayPalPaymentDenied(resource: any): Promise<void> {
    const orderId = resource.custom_id;
    
    await this.db.payment.updateMany({
      where: {
        orderId,
        status: 'PROCESSING',
      },
      data: {
        status: 'FAILED',
        metadata: {
          paypalCaptureId: resource.id,
          deniedAt: new Date(),
          denialReason: resource.status_details?.reason,
        },
      },
    });
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    additionalMetadata?: Record<string, any>
  ): Promise<Payment> {
    return await this.db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        ...(additionalMetadata && {
          metadata: additionalMetadata,
        }),
      },
    });
  }

  private async createPayPalOrderRequest(data: {
    amount: string;
    currency: string;
    orderId: string;
    orderNumber: string;
    reference: string;
  }): Promise<any> {
    // This would integrate with PayPal SDK
    // For now, returning a mock response
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';

    // Get access token
    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
    
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // Create order
    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: data.orderId,
          reference_id: data.reference,
          description: `Jollof Palace Order ${data.orderNumber}`,
          amount: {
            currency_code: data.currency,
            value: data.amount,
          },
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          brand_name: 'Jollof Palace',
          user_action: 'PAY_NOW',
        },
      }),
    });

    return await orderResponse.json();
  }
}