import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticate, authorize } from '../lib/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { createOrderSchema, updateOrderStatusSchema } from '../lib/validation';
import { orderLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();
const orderController = new OrderController();

// Validation schemas
const orderIdSchema = Joi.object({
  id: Joi.string().required(),
});

const orderNumberSchema = Joi.object({
  orderNumber: Joi.string().required(),
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

const updateEstimatedTimeSchema = Joi.object({
  estimatedReadyTime: Joi.date().iso().required(),
});

const orderQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED').optional(),
  orderType: Joi.string().valid('PICKUP', 'DELIVERY').optional(),
  customerPhone: Joi.string().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Public routes

// POST /api/orders - Create new order
router.post(
  '/',
  orderLimiter, // Rate limit order creation
  validateBody(createOrderSchema),
  orderController.createOrder
);

// GET /api/orders/:id - Get order by ID
router.get(
  '/:id',
  validateParams(orderIdSchema),
  orderController.getOrderById
);

// GET /api/orders/number/:orderNumber - Get order by order number
router.get(
  '/number/:orderNumber',
  validateParams(orderNumberSchema),
  orderController.getOrderByNumber
);

// GET /api/orders/track/:orderNumber - Track order
router.get(
  '/track/:orderNumber',
  validateParams(orderNumberSchema),
  orderController.trackOrder
);

// POST /api/orders/:id/cancel - Cancel order
router.post(
  '/:id/cancel',
  validateParams(orderIdSchema),
  validateBody(cancelOrderSchema),
  orderController.cancelOrder
);

// Admin routes (authentication and authorization required)

// GET /api/admin/orders - Get all orders with filters
router.get(
  '/admin',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateQuery(orderQuerySchema),
  orderController.getOrders
);

// PUT /api/admin/orders/:id/status - Update order status
router.put(
  '/admin/:id/status',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateParams(orderIdSchema),
  validateBody(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// PUT /api/admin/orders/:id/estimated-time - Update estimated ready time
router.put(
  '/admin/:id/estimated-time',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateParams(orderIdSchema),
  validateBody(updateEstimatedTimeSchema),
  orderController.updateEstimatedReadyTime
);

// GET /api/admin/orders/stats - Get order statistics
router.get(
  '/admin/stats',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  orderController.getOrderStats
);

// GET /api/admin/orders/queue - Get current order queue
router.get(
  '/admin/queue',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  orderController.getOrderQueue
);

// GET /api/admin/orders/preparing - Get orders currently being prepared
router.get(
  '/admin/preparing',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  orderController.getPreparingOrders
);

// GET /api/admin/orders/ready - Get orders ready for pickup/delivery
router.get(
  '/admin/ready',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  orderController.getReadyOrders
);

export default router;