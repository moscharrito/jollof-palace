import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { OrderService } from '../services/OrderService';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateBody } from '../middleware/validation';
import Joi from 'joi';

const router = Router();
const notificationService = new NotificationService();
const orderService = new OrderService();

// Validation schemas
const testSMSSchema = Joi.object({
  phoneNumber: Joi.string().required().pattern(/^\+?[\d\s\-\(\)]+$/).messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
});

const bulkSMSSchema = Joi.object({
  phoneNumbers: Joi.array().items(
    Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/)
  ).min(1).max(100).required(),
  message: Joi.string().min(1).max(1600).required(), // SMS character limit
});

const orderNotificationSchema = Joi.object({
  orderId: Joi.string().required(),
  status: Joi.string().valid('CONFIRMED', 'PREPARING', 'READY', 'COMPLETED').required(),
});

/**
 * @route POST /api/notifications/test-sms
 * @desc Test SMS service connectivity
 * @access Admin only
 */
router.post('/test-sms', 
  authenticateAdmin,
  validateBody(testSMSSchema),
  async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;

      if (!notificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'SMS service is not configured. Please check Twilio credentials.',
        });
      }

      const result = await notificationService.testSMSService(phoneNumber);

      if (result) {
        res.json({
          success: true,
          message: 'Test SMS sent successfully',
          phoneNumber,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test SMS',
        });
      }
    } catch (error: any) {
      console.error('Test SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'SMS test failed',
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/notifications/bulk-sms
 * @desc Send bulk SMS notifications
 * @access Admin only
 */
router.post('/bulk-sms',
  authenticateAdmin,
  validateBody(bulkSMSSchema),
  async (req: Request, res: Response) => {
    try {
      const { phoneNumbers, message } = req.body;

      if (!notificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'SMS service is not configured. Please check Twilio credentials.',
        });
      }

      const result = await notificationService.sendBulkNotification(phoneNumbers, message);

      res.json({
        success: true,
        message: 'Bulk SMS processing completed',
        results: {
          sent: result.sent,
          failed: result.failed,
          total: phoneNumbers.length,
        },
      });
    } catch (error: any) {
      console.error('Bulk SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk SMS failed',
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/notifications/order-notification
 * @desc Manually trigger order status notification
 * @access Admin only
 */
router.post('/order-notification',
  authenticateAdmin,
  validateBody(orderNotificationSchema),
  async (req: Request, res: Response) => {
    try {
      const { orderId, status } = req.body;

      if (!notificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'SMS service is not configured. Please check Twilio credentials.',
        });
      }

      // Get the order
      const order = await orderService.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Send notification
      const result = await notificationService.sendOrderStatusNotification(
        order,
        status as any,
        order.estimatedReadyTime
      );

      if (result) {
        res.json({
          success: true,
          message: `${status} notification sent successfully`,
          orderNumber: order.orderNumber,
          customerPhone: order.customerPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send order notification',
        });
      }
    } catch (error: any) {
      console.error('Order notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Order notification failed',
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/notifications/status
 * @desc Get SMS service configuration status
 * @access Admin only
 */
router.get('/status',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const isConfigured = notificationService.isConfigured();
      
      res.json({
        success: true,
        smsService: {
          configured: isConfigured,
          provider: 'Twilio',
          fromNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured',
        },
      });
    } catch (error: any) {
      console.error('SMS status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check SMS service status',
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/notifications/delay-notification
 * @desc Send delay notification for an order
 * @access Admin only
 */
router.post('/delay-notification',
  authenticateAdmin,
  validateBody(Joi.object({
    orderId: Joi.string().required(),
    newEstimatedTime: Joi.date().iso().required(),
    reason: Joi.string().optional().max(200),
  })),
  async (req: Request, res: Response) => {
    try {
      const { orderId, newEstimatedTime, reason } = req.body;

      if (!notificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'SMS service is not configured. Please check Twilio credentials.',
        });
      }

      // Get the order
      const order = await orderService.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Send delay notification
      const result = await notificationService.sendDelayNotification(
        order,
        new Date(newEstimatedTime),
        reason
      );

      if (result) {
        // Also update the order's estimated time
        await orderService.updateEstimatedReadyTime(orderId, new Date(newEstimatedTime));

        res.json({
          success: true,
          message: 'Delay notification sent successfully',
          orderNumber: order.orderNumber,
          newEstimatedTime,
          reason,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send delay notification',
        });
      }
    } catch (error: any) {
      console.error('Delay notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Delay notification failed',
        error: error.message,
      });
    }
  }
);

export default router;