import { Router } from 'express';
import { MenuController } from '../controllers/MenuController';
import { authenticate, authorize } from '../lib/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { menuItemSchema } from '../lib/validation';
import Joi from 'joi';

const router = Router();
const menuController = new MenuController();

// Validation schemas
const menuItemIdSchema = Joi.object({
  id: Joi.string().required(),
});

const categorySchema = Joi.object({
  category: Joi.string().valid('MAIN', 'SIDE', 'COMBO').required(),
});

const searchQuerySchema = Joi.object({
  query: Joi.string().min(2).required(),
});

const menuQuerySchema = Joi.object({
  category: Joi.string().valid('MAIN', 'SIDE', 'COMBO').optional(),
  search: Joi.string().min(2).optional(),
  available: Joi.string().valid('true', 'false').optional(),
});

const updateMenuItemSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().min(10).max(500).optional(),
  price: Joi.number().integer().min(1).optional(),
  category: Joi.string().valid('MAIN', 'SIDE', 'COMBO').optional(),
  imageUrl: Joi.string().uri().optional(),
  preparationTime: Joi.number().integer().min(1).max(120).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(50)).min(1).optional(),
  isAvailable: Joi.boolean().optional(),
  calories: Joi.number().integer().min(0).optional(),
  protein: Joi.number().min(0).optional(),
  carbs: Joi.number().min(0).optional(),
  fat: Joi.number().min(0).optional(),
  fiber: Joi.number().min(0).optional(),
  sodium: Joi.number().min(0).optional(),
});

// Public routes (no authentication required)

// GET /api/menu - Get all menu items with optional filters
router.get(
  '/',
  validateQuery(menuQuerySchema),
  menuController.getMenuItems
);

// GET /api/menu/available - Get only available menu items
router.get(
  '/available',
  menuController.getAvailableMenuItems
);

// GET /api/menu/category/:category - Get menu items by category
router.get(
  '/category/:category',
  validateParams(categorySchema),
  menuController.getMenuItemsByCategory
);

// GET /api/menu/search/:query - Search menu items
router.get(
  '/search/:query',
  validateParams(searchQuerySchema),
  menuController.searchMenuItems
);

// GET /api/menu/:id - Get menu item by ID
router.get(
  '/:id',
  validateParams(menuItemIdSchema),
  menuController.getMenuItemById
);

// Admin routes (authentication and authorization required)

// POST /api/admin/menu - Create new menu item
router.post(
  '/admin',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateBody(menuItemSchema),
  menuController.createMenuItem
);

// PUT /api/admin/menu/:id - Update menu item
router.put(
  '/admin/:id',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateParams(menuItemIdSchema),
  validateBody(updateMenuItemSchema),
  menuController.updateMenuItem
);

// DELETE /api/admin/menu/:id - Delete menu item
router.delete(
  '/admin/:id',
  authenticate,
  authorize(['ADMIN']), // Only admins can delete
  validateParams(menuItemIdSchema),
  menuController.deleteMenuItem
);

// PATCH /api/admin/menu/:id/toggle - Toggle menu item availability
router.patch(
  '/admin/:id/toggle',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateParams(menuItemIdSchema),
  menuController.toggleMenuItemAvailability
);

// GET /api/admin/menu/stats - Get menu statistics
router.get(
  '/admin/stats',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  menuController.getMenuStats
);

// GET /api/admin/menu/analytics - Get menu analytics
router.get(
  '/admin/analytics',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  menuController.getMenuAnalytics
);

// PUT /api/admin/menu/:id/price - Update menu item price
router.put(
  '/admin/:id/price',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateParams(menuItemIdSchema),
  validateBody(Joi.object({
    price: Joi.number().integer().min(1).required(),
    reason: Joi.string().optional(),
  })),
  menuController.updateMenuItemPrice
);

// GET /api/admin/menu/:id/price-history - Get price history
router.get(
  '/admin/:id/price-history',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateParams(menuItemIdSchema),
  menuController.getPriceHistory
);

export default router;