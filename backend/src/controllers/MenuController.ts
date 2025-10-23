import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MenuService } from '../services/MenuService';
import { asyncHandler } from '../middleware/errorHandler';
import { Category } from '@prisma/client';

export class MenuController extends BaseController {
  private menuService: MenuService;

  constructor() {
    super();
    this.menuService = new MenuService();
  }

  // GET /api/menu - Get all menu items (public)
  getMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const { category, search, available } = req.query;

    const filters: any = {};

    if (category && Object.values(Category).includes(category as Category)) {
      filters.category = category as Category;
    }

    if (search) {
      filters.search = search as string;
    }

    if (available !== undefined) {
      filters.isAvailable = available === 'true';
    }

    const menuItems = await this.menuService.getAllMenuItems(filters);

    this.sendSuccess(res, menuItems, 'Menu items retrieved successfully');
  });

  // GET /api/menu/:id - Get menu item by ID (public)
  getMenuItemById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const menuItem = await this.menuService.getMenuItemById(id);

    this.sendSuccess(res, menuItem, 'Menu item retrieved successfully');
  });

  // GET /api/menu/category/:category - Get menu items by category (public)
  getMenuItemsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;

    if (!Object.values(Category).includes(category as Category)) {
      this.sendError(res, 'Invalid category', 400);
      return;
    }

    const menuItems = await this.menuService.getMenuItemsByCategory(category as Category);

    this.sendSuccess(res, menuItems, `${category} items retrieved successfully`);
  });

  // GET /api/menu/search/:query - Search menu items (public)
  searchMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.params;

    if (!query || query.trim().length < 2) {
      this.sendError(res, 'Search query must be at least 2 characters', 400);
      return;
    }

    const menuItems = await this.menuService.searchMenuItems(query.trim());

    this.sendSuccess(res, menuItems, 'Search results retrieved successfully');
  });

  // POST /api/admin/menu - Create menu item (admin only)
  createMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const menuItemData = req.body;

    const menuItem = await this.menuService.createMenuItem(menuItemData);

    this.sendSuccess(res, menuItem, 'Menu item created successfully', 201);
  });

  // PUT /api/admin/menu/:id - Update menu item (admin only)
  updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const menuItem = await this.menuService.updateMenuItem(id, updateData);

    this.sendSuccess(res, menuItem, 'Menu item updated successfully');
  });

  // DELETE /api/admin/menu/:id - Delete menu item (admin only)
  deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.menuService.deleteMenuItem(id);

    this.sendSuccess(res, null, 'Menu item deleted successfully');
  });

  // PATCH /api/admin/menu/:id/toggle - Toggle menu item availability (admin only)
  toggleMenuItemAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const menuItem = await this.menuService.toggleAvailability(id);

    this.sendSuccess(
      res, 
      menuItem, 
      `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`
    );
  });

  // GET /api/admin/menu/stats - Get menu statistics (admin only)
  getMenuStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.menuService.getMenuStats();

    this.sendSuccess(res, stats, 'Menu statistics retrieved successfully');
  });

  // GET /api/admin/menu/analytics - Get menu item analytics (admin only)
  getMenuAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analytics = await this.menuService.getMenuItemAnalytics(start, end);

    this.sendSuccess(res, analytics, 'Menu analytics retrieved successfully');
  });

  // PUT /api/admin/menu/:id/price - Update menu item price with history (admin only)
  updateMenuItemPrice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { price, reason } = req.body;
    const adminId = (req as any).user?.id; // Assuming admin ID is available in request

    if (!price || typeof price !== 'number' || price <= 0) {
      this.sendError(res, 'Valid price is required', 400);
      return;
    }

    const menuItem = await this.menuService.updateMenuItemPrice(id, price, adminId, reason);

    this.sendSuccess(res, menuItem, 'Menu item price updated successfully');
  });

  // GET /api/admin/menu/:id/price-history - Get price history for menu item (admin only)
  getPriceHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const history = await this.menuService.getPriceHistory(id);

    this.sendSuccess(res, history, 'Price history retrieved successfully');
  });

  // GET /api/menu/available - Get only available menu items (public)
  getAvailableMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const menuItems = await this.menuService.getAvailableMenuItems();

    this.sendSuccess(res, menuItems, 'Available menu items retrieved successfully');
  });
}