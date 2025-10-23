import { ApiResponse } from '../types';
import { MenuItem } from '../types/menu';
import api from './api';
import { 
  CreateMenuItemData, 
  UpdateMenuItemData, 
  MenuItemAnalytics, 
  PriceUpdateData 
} from '../types/menu';

export interface MenuFilters {
  category?: 'main' | 'side' | 'combo';
  search?: string;
  available?: boolean;
}

export class MenuService {
  /**
   * Get all menu items with optional filters
   */
  static async getMenuItems(filters?: MenuFilters): Promise<MenuItem[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.category) {
        params.append('category', filters.category.toUpperCase());
      }
      
      if (filters?.search) {
        params.append('search', filters.search);
      }
      
      if (filters?.available !== undefined) {
        params.append('available', filters.available.toString());
      }

      const response = await api.get<ApiResponse<MenuItem[]>>(`/menu?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch menu items');
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch menu items');
    }
  }

  /**
   * Get only available menu items
   */
  static async getAvailableMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await api.get<ApiResponse<MenuItem[]>>('/menu/available');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch available menu items');
    } catch (error: any) {
      console.error('Error fetching available menu items:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch available menu items');
    }
  }

  /**
   * Get menu item by ID
   */
  static async getMenuItemById(id: string): Promise<MenuItem> {
    try {
      const response = await api.get<ApiResponse<MenuItem>>(`/menu/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch menu item');
    } catch (error: any) {
      console.error('Error fetching menu item:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch menu item');
    }
  }

  /**
   * Get menu items by category
   */
  static async getMenuItemsByCategory(category: 'main' | 'side' | 'combo'): Promise<MenuItem[]> {
    try {
      const response = await api.get<ApiResponse<MenuItem[]>>(`/menu/category/${category.toUpperCase()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch menu items by category');
    } catch (error: any) {
      console.error('Error fetching menu items by category:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch menu items by category');
    }
  }

  /**
   * Search menu items
   */
  static async searchMenuItems(query: string): Promise<MenuItem[]> {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      const response = await api.get<ApiResponse<MenuItem[]>>(`/menu/search/${encodeURIComponent(query.trim())}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to search menu items');
    } catch (error: any) {
      console.error('Error searching menu items:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to search menu items');
    }
  }

  // Admin Methods

  /**
   * Create a new menu item (admin only)
   */
  static async createMenuItem(data: CreateMenuItemData): Promise<MenuItem> {
    try {
      const response = await api.post<ApiResponse<MenuItem>>('/menu/admin', data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to create menu item');
    } catch (error: any) {
      console.error('Error creating menu item:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create menu item');
    }
  }

  /**
   * Update a menu item (admin only)
   */
  static async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<MenuItem> {
    try {
      const response = await api.put<ApiResponse<MenuItem>>(`/menu/admin/${id}`, data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to update menu item');
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update menu item');
    }
  }

  /**
   * Delete a menu item (admin only)
   */
  static async deleteMenuItem(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<null>>(`/menu/admin/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete menu item');
      }
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete menu item');
    }
  }

  /**
   * Toggle menu item availability (admin only)
   */
  static async toggleMenuItemAvailability(id: string): Promise<MenuItem> {
    try {
      const response = await api.patch<ApiResponse<MenuItem>>(`/menu/admin/${id}/toggle`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to toggle menu item availability');
    } catch (error: any) {
      console.error('Error toggling menu item availability:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to toggle menu item availability');
    }
  }

  /**
   * Get menu analytics (admin only)
   */
  static async getMenuAnalytics(startDate?: string, endDate?: string): Promise<MenuItemAnalytics[]> {
    try {
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await api.get<ApiResponse<MenuItemAnalytics[]>>(`/menu/admin/analytics?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch menu analytics');
    } catch (error: any) {
      console.error('Error fetching menu analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch menu analytics');
    }
  }

  /**
   * Update menu item price with history tracking (admin only)
   */
  static async updateMenuItemPrice(id: string, data: PriceUpdateData): Promise<MenuItem> {
    try {
      const response = await api.put<ApiResponse<MenuItem>>(`/menu/admin/${id}/price`, data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to update menu item price');
    } catch (error: any) {
      console.error('Error updating menu item price:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update menu item price');
    }
  }

  /**
   * Get price history for a menu item (admin only)
   */
  static async getPriceHistory(id: string): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse<any[]>>(`/menu/admin/${id}/price-history`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch price history');
    } catch (error: any) {
      console.error('Error fetching price history:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch price history');
    }
  }

  /**
   * Get menu statistics (admin only)
   */
  static async getMenuStats(): Promise<{
    totalItems: number;
    availableItems: number;
    itemsByCategory: Record<string, number>;
  }> {
    try {
      const response = await api.get<ApiResponse<any>>('/menu/admin/stats');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch menu statistics');
    } catch (error: any) {
      console.error('Error fetching menu statistics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch menu statistics');
    }
  }
}

// Export a default instance for easier usage
export const menuService = {
  getMenuItems: MenuService.getMenuItems,
  getAvailableMenuItems: MenuService.getAvailableMenuItems,
  getMenuItemById: MenuService.getMenuItemById,
  getMenuItemsByCategory: MenuService.getMenuItemsByCategory,
  searchMenuItems: MenuService.searchMenuItems,
  createMenuItem: MenuService.createMenuItem,
  updateMenuItem: MenuService.updateMenuItem,
  deleteMenuItem: MenuService.deleteMenuItem,
  toggleMenuItemAvailability: MenuService.toggleMenuItemAvailability,
  getMenuAnalytics: MenuService.getMenuAnalytics,
  updateMenuItemPrice: MenuService.updateMenuItemPrice,
  getPriceHistory: MenuService.getPriceHistory,
  getMenuStats: MenuService.getMenuStats,
};