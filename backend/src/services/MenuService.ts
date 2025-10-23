import { MenuItem, Category } from '@prisma/client';
import { BaseService } from './BaseService';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { cache } from '../lib/redis';

export interface CreateMenuItemData {
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  preparationTime: number;
  ingredients: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {
  isAvailable?: boolean;
}

export interface MenuFilters {
  category?: Category;
  isAvailable?: boolean;
  search?: string;
}

export interface MenuItemAnalytics {
  itemId: string;
  name: string;
  category: Category;
  totalOrders: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularityRank: number;
  lastOrderDate?: Date;
  salesTrend: 'up' | 'down' | 'stable';
}

export interface PriceHistoryEntry {
  id: string;
  menuItemId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  reason?: string;
  createdAt: Date;
}

export class MenuService extends BaseService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_KEY_PREFIX = 'menu:';

  async getAllMenuItems(filters: MenuFilters = {}): Promise<MenuItem[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all:${JSON.stringify(filters)}`;
      
      // Try to get from cache first
      const cached = await cache.get<MenuItem[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const where: any = {};

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { ingredients: { has: filters.search } },
        ];
      }

      const menuItems = await this.db.menuItem.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });

      // Cache the result
      await cache.set(cacheKey, menuItems, this.CACHE_TTL);

      return menuItems;
    } catch (error) {
      this.handleError(error, 'MenuService.getAllMenuItems');
    }
  }

  async getMenuItemById(id: string): Promise<MenuItem> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}item:${id}`;
      
      // Try to get from cache first
      const cached = await cache.get<MenuItem>(cacheKey);
      if (cached) {
        return cached;
      }

      const menuItem = await this.db.menuItem.findUnique({
        where: { id },
      });

      if (!menuItem) {
        throw new NotFoundError('Menu item not found');
      }

      // Cache the result
      await cache.set(cacheKey, menuItem, this.CACHE_TTL);

      return menuItem;
    } catch (error) {
      this.handleError(error, 'MenuService.getMenuItemById');
    }
  }

  async createMenuItem(data: CreateMenuItemData): Promise<MenuItem> {
    try {
      // Check if menu item with same name already exists
      const existingItem = await this.db.menuItem.findFirst({
        where: { name: data.name },
      });

      if (existingItem) {
        throw new ConflictError('Menu item with this name already exists');
      }

      const menuItem = await this.db.menuItem.create({
        data: {
          ...data,
          isAvailable: true,
        },
      });

      // Clear cache
      await this.clearMenuCache();

      return menuItem;
    } catch (error) {
      this.handleError(error, 'MenuService.createMenuItem');
    }
  }

  async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<MenuItem> {
    try {
      // Check if menu item exists
      const existingItem = await this.getMenuItemById(id);

      // Check if name is being updated and conflicts with another item
      if (data.name && data.name !== existingItem.name) {
        const conflictingItem = await this.db.menuItem.findFirst({
          where: { 
            name: data.name,
            id: { not: id },
          },
        });

        if (conflictingItem) {
          throw new ConflictError('Menu item with this name already exists');
        }
      }

      const updatedMenuItem = await this.db.menuItem.update({
        where: { id },
        data,
      });

      // Clear cache
      await this.clearMenuCache();
      await cache.del(`${this.CACHE_KEY_PREFIX}item:${id}`);

      return updatedMenuItem;
    } catch (error) {
      this.handleError(error, 'MenuService.updateMenuItem');
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      // Check if menu item exists
      await this.getMenuItemById(id);

      // Check if menu item is used in any orders
      const orderItemsCount = await this.db.orderItem.count({
        where: { menuItemId: id },
      });

      if (orderItemsCount > 0) {
        throw new ConflictError('Cannot delete menu item that has been ordered');
      }

      await this.db.menuItem.delete({
        where: { id },
      });

      // Clear cache
      await this.clearMenuCache();
      await cache.del(`${this.CACHE_KEY_PREFIX}item:${id}`);
    } catch (error) {
      this.handleError(error, 'MenuService.deleteMenuItem');
    }
  }

  async toggleAvailability(id: string): Promise<MenuItem> {
    try {
      const menuItem = await this.getMenuItemById(id);

      const updatedMenuItem = await this.db.menuItem.update({
        where: { id },
        data: { isAvailable: !menuItem.isAvailable },
      });

      // Clear cache
      await this.clearMenuCache();
      await cache.del(`${this.CACHE_KEY_PREFIX}item:${id}`);

      return updatedMenuItem;
    } catch (error) {
      this.handleError(error, 'MenuService.toggleAvailability');
    }
  }

  async getMenuItemsByCategory(category: Category): Promise<MenuItem[]> {
    try {
      return this.getAllMenuItems({ category, isAvailable: true });
    } catch (error) {
      this.handleError(error, 'MenuService.getMenuItemsByCategory');
    }
  }

  async getAvailableMenuItems(): Promise<MenuItem[]> {
    try {
      return this.getAllMenuItems({ isAvailable: true });
    } catch (error) {
      this.handleError(error, 'MenuService.getAvailableMenuItems');
    }
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    try {
      return this.getAllMenuItems({ search: query, isAvailable: true });
    } catch (error) {
      this.handleError(error, 'MenuService.searchMenuItems');
    }
  }

  async getMenuStats(): Promise<{
    totalItems: number;
    availableItems: number;
    itemsByCategory: Record<Category, number>;
  }> {
    try {
      const [totalItems, availableItems, itemsByCategory] = await Promise.all([
        this.db.menuItem.count(),
        this.db.menuItem.count({ where: { isAvailable: true } }),
        this.db.menuItem.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
      ]);

      const categoryStats = itemsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<Category, number>);

      return {
        totalItems,
        availableItems,
        itemsByCategory: categoryStats,
      };
    } catch (error) {
      this.handleError(error, 'MenuService.getMenuStats');
    }
  }

  async getMenuItemAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<MenuItemAnalytics[]> {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      // Get all menu items with their order statistics
      const menuItems = await this.db.menuItem.findMany({
        include: {
          orderItems: {
            where: {
              order: {
                status: 'COMPLETED',
                ...dateFilter,
              },
            },
            include: {
              order: true,
            },
          },
        },
      });

      const analytics: MenuItemAnalytics[] = menuItems.map(item => {
        const orderItems = item.orderItems;
        const totalQuantitySold = orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
        const totalRevenue = orderItems.reduce((sum, oi) => sum + oi.totalPrice, 0);
        const totalOrders = orderItems.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Get last order date
        const lastOrderDate = orderItems.length > 0 
          ? new Date(Math.max(...orderItems.map(oi => oi.order.createdAt.getTime())))
          : undefined;

        return {
          itemId: item.id,
          name: item.name,
          category: item.category,
          totalOrders,
          totalQuantitySold,
          totalRevenue,
          averageOrderValue,
          popularityRank: 0, // Will be calculated after sorting
          lastOrderDate,
          salesTrend: 'stable' as const, // Simplified for now
        };
      });

      // Sort by total revenue and assign popularity ranks
      analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      analytics.forEach((item, index) => {
        item.popularityRank = index + 1;
      });

      return analytics;
    } catch (error) {
      this.handleError(error, 'MenuService.getMenuItemAnalytics');
    }
  }

  async updateMenuItemPrice(
    id: string,
    newPrice: number,
    adminId: string,
    reason?: string
  ): Promise<MenuItem> {
    try {
      const existingItem = await this.getMenuItemById(id);
      
      // Create price history entry
      await this.db.$executeRaw`
        INSERT INTO price_history (id, menu_item_id, old_price, new_price, changed_by, reason, created_at)
        VALUES (${this.generateId()}, ${id}, ${existingItem.price}, ${newPrice}, ${adminId}, ${reason || ''}, ${new Date()})
      `;

      // Update the menu item price
      const updatedMenuItem = await this.db.menuItem.update({
        where: { id },
        data: { price: newPrice },
      });

      // Clear cache
      await this.clearMenuCache();
      await cache.del(`${this.CACHE_KEY_PREFIX}item:${id}`);

      return updatedMenuItem;
    } catch (error) {
      this.handleError(error, 'MenuService.updateMenuItemPrice');
    }
  }

  async getPriceHistory(menuItemId: string): Promise<PriceHistoryEntry[]> {
    try {
      // Note: This would require a price_history table in production
      // For now, return empty array as price history tracking would need database schema changes
      return [];
    } catch (error) {
      this.handleError(error, 'MenuService.getPriceHistory');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async clearMenuCache(): Promise<void> {
    try {
      // Clear all menu-related cache keys
      // In a production environment, you might want to use a more sophisticated cache invalidation strategy
      const keys = await cache.exists(`${this.CACHE_KEY_PREFIX}all:*`);
      if (keys) {
        // This is a simplified approach - in production, you'd want to scan for keys
        await cache.del(`${this.CACHE_KEY_PREFIX}all:${JSON.stringify({})}`);
        await cache.del(`${this.CACHE_KEY_PREFIX}all:${JSON.stringify({ isAvailable: true })}`);
      }
    } catch (error) {
      console.error('Error clearing menu cache:', error);
      // Don't throw error for cache clearing failures
    }
  }
}