// Shared types for the food ordering application

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  imageUrl?: string;
  available: boolean;
  isAvailable?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  createdAt?: string;
  updatedAt?: string;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  postalCode?: string;
  country: string;
  apartment?: string;
  landmark?: string;
  instructions?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  deliveryAddress?: Address;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  PENDING = 'pending',
  CARD = 'card',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  CASH = 'cash'
}

export interface OrderItem {
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  specialInstructions?: string;
  customizations?: string[];
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: 'delivery' | 'pickup';
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  estimatedReadyTime?: string;
  actualReadyTime?: string;
  trackingNumber?: string;
}

export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  items: OrderItem[];
  orderType: 'delivery' | 'pickup';
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}