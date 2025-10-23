// Core data types shared between frontend and backend

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'side' | 'combo';
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number; // minutes
  ingredients: string[];
  nutritionalInfo?: NutritionalInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  orderType: 'pickup' | 'delivery';
  estimatedReadyTime: Date;
  actualReadyTime?: Date;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  customizations?: string[];
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  deliveryAddress?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode?: string;
  landmark?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  reference: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'paypal'
  | 'cash';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: string[];
  }>;
  orderType: 'pickup' | 'delivery';
  specialInstructions?: string;
}

export interface PaymentRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reference: string;
  authorizationUrl?: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics types
export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  popularItems: Array<{
    menuItem: MenuItem;
    orderCount: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
}

export interface OrderAnalytics {
  statusDistribution: Record<OrderStatus, number>;
  averagePreparationTime: number;
  peakHours: Array<{
    hour: number;
    orderCount: number;
  }>;
}

// Validation schemas (to be used with Joi or similar)
export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
    timestamp: string;
    requestId: string;
  };
}