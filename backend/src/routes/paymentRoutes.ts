import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate, authorize } from '../lib/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { initializePaymentSchema, refundPaymentSchema, applePayValidationSchema } from '../lib/validation';
import { stripeWebhookMiddleware, verifyPayPalWebhook } from '../middleware/webhookMiddleware';
import Joi from 'joi';

const router = Router();
const paymentController = new PaymentController();

// Validation schemas
const paymentIdSchema = Joi.object({
  id: Joi.string().required(),
});

const orderIdSchema = Joi.object({
  orderId: Joi.string().required(),
});

const referenceSchema = Joi.object({
  reference: Joi.string().required(),
});

// Public routes

// POST /api/payments/initialize - Initialize payment
router.post(
  '/initialize',
  validateBody(initializePaymentSchema),
  paymentController.initializePayment
);

// GET /api/payments/methods - Get available payment methods
router.get(
  '/methods',
  paymentController.getPaymentMethods
);

// GET /api/payments/config - Get payment configuration
router.get(
  '/config',
  paymentController.getPaymentConfig
);

// GET /api/payments/verify/:reference - Verify payment status
router.get(
  '/verify/:reference',
  validateParams(referenceSchema),
  paymentController.verifyPayment
);

// GET /api/payments/order/:orderId - Get payments for an order
router.get(
  '/order/:orderId',
  validateParams(orderIdSchema),
  paymentController.getOrderPayments
);

// POST /api/payments/apple-pay/validate - Validate Apple Pay merchant
router.post(
  '/apple-pay/validate',
  validateBody(applePayValidationSchema),
  paymentController.validateApplePayMerchant
);

// Webhook routes (no authentication required)

// POST /api/payments/webhooks/stripe - Stripe webhook
router.post(
  '/webhooks/stripe',
  stripeWebhookMiddleware,
  paymentController.handleStripeWebhook
);

// POST /api/payments/webhooks/paypal - PayPal webhook
router.post(
  '/webhooks/paypal',
  verifyPayPalWebhook,
  paymentController.handlePayPalWebhook
);

// Admin routes (authentication and authorization required)

// POST /api/admin/payments/:id/refund - Refund payment
router.post(
  '/admin/:id/refund',
  authenticate,
  authorize(['ADMIN']), // Only admins can process refunds
  validateParams(paymentIdSchema),
  validateBody(refundPaymentSchema),
  paymentController.refundPayment
);

// GET /api/admin/payments/stats - Get payment statistics
router.get(
  '/admin/stats',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  paymentController.getPaymentStats
);

export default router;