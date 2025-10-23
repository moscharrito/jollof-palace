import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticateAdmin, requireAdminRole, requireManagerRole } from '../middleware/adminAuth';
import { validateBody } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
});

// Authentication routes (no auth required)
router.post('/login', validateBody(loginSchema), adminController.login);

// Token management routes (requires authentication)
router.post('/refresh-token', authenticateAdmin, adminController.refreshToken);

// Profile management routes (requires authentication)
router.get('/profile', authenticateAdmin, adminController.getProfile);
router.put('/profile', authenticateAdmin, validateBody(updateProfileSchema), adminController.updateProfile);

// Order management routes (requires authentication)
router.get('/orders', authenticateAdmin, adminController.getOrders);
router.put('/orders/:id/status', authenticateAdmin, adminController.updateOrderStatus);

export default router;