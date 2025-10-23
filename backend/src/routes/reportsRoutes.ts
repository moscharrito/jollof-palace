import { Router } from 'express';
import { reportsController } from '../controllers/ReportsController';
import { authenticateAdmin, requireManagerRole } from '../middleware/adminAuth';
import { validateBody, validateQuery } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const generateReportSchema = Joi.object({
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  type: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly', 'custom').optional(),
  format: Joi.string().valid('json', 'csv', 'excel').optional().default('json'),
});

const dailyReportSchema = Joi.object({
  date: Joi.string().isoDate().optional(),
  format: Joi.string().valid('json', 'csv', 'excel').optional().default('json'),
});

const reportHistorySchema = Joi.object({
  limit: Joi.string().pattern(/^\d+$/).optional(),
});

// All reports routes require manager role or higher
router.use(authenticateAdmin);
router.use(requireManagerRole);

// Report generation endpoints
router.post('/sales', validateBody(generateReportSchema), reportsController.generateSalesReport);
router.post('/sales/daily', validateBody(dailyReportSchema), reportsController.generateDailySalesReport);
router.post('/customers', validateBody(generateReportSchema), reportsController.generateCustomerReport);
router.post('/menu', validateBody(generateReportSchema), reportsController.generateMenuReport);

// Report management endpoints
router.get('/history', validateQuery(reportHistorySchema), reportsController.getReportHistory);

export default router;