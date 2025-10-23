export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderType = 
  | 'PICKUP'
  | 'DELIVERY';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations: string[];
  menuItem: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    preparationTime: number;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: OrderType;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryLandmark?: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  estimatedReadyTime: string;
  actualReadyTime?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  customerPhone?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusDistribution: Record<OrderStatus, number>;
}