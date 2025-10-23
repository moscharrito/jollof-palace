import { Router } from 'express';
import { analyticsController } from '../controllers/AnalyticsController';
import { authenticateAdmin, requireManagerRole } from '../middleware/adminAuth';
import { validateQuery } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const salesAnalyticsSchema = Joi.object({
  days: Joi.string().pattern(/^\d+$/).optional(),
});

// All analytics routes require manager role or higher
router.use(authenticateAdmin);
router.use(requireManagerRole);

// Dashboard metrics
router.get('/dashboard', analyticsController.getDashboardStats);

// Sales analytics
router.get('/sales', validateQuery(salesAnalyticsSchema), analyticsController.getSalesAnalytics);

// Customer analytics
router.get('/customers', analyticsController.getCustomerAnalytics);

// Menu analytics
router.get('/menu', analyticsController.getMenuAnalytics);

export default router;