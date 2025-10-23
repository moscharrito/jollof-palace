export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // Price in cents
  category: 'main' | 'side' | 'combo';
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number; // Time in minutes
  ingredients: string[];
  
  // Nutritional information (optional)
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuItemData {
  name: string;
  description: string;
  price: number;
  category: 'main' | 'side' | 'combo';
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

export interface MenuItemAnalytics {
  itemId: string;
  name: string;
  category: string;
  totalOrders: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularityRank: number;
  lastOrderDate?: string;
  salesTrend: 'up' | 'down' | 'stable';
}

export interface PriceUpdateData {
  price: number;
  reason?: string;
}