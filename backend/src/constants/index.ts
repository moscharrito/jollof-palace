// Application constants for the backend

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  CARD: 'card',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  PAYPAL: 'paypal',
  CASH: 'cash',
} as const;

export const MENU_CATEGORIES = {
  MAIN: 'main',
  SIDE: 'side',
  COMBO: 'combo',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

// Business constants
export const BUSINESS_CONFIG = {
  TAX_RATE: 0.075, // 7.5% VAT (Nigerian rate)
  DELIVERY_FEE: 50000, // ₦500.00 delivery fee in kobo
  MINIMUM_ORDER_AMOUNT: 150000, // ₦1,500.00 minimum order in kobo
  PREPARATION_TIME_BUFFER: 5, // 5 minutes buffer
  ORDER_TIMEOUT: 30, // 30 minutes to complete payment
  CURRENCY: 'NGN',
  COUNTRY_CODE: 'NG',
} as const;

// Menu items configuration
export const MENU_ITEMS = {
  JOLLOF_RICE: {
    name: 'Jollof Rice',
    basePrice: 150000, // ₦1,500 in kobo
    preparationTime: 15,
    category: MENU_CATEGORIES.MAIN,
  },
  PEPPER_CHICKEN: {
    name: 'Pepper Chicken',
    basePrice: 250000, // ₦2,500 in kobo
    preparationTime: 20,
    category: MENU_CATEGORIES.MAIN,
  },
  PEPPER_BEEF: {
    name: 'Pepper Beef',
    basePrice: 300000, // ₦3,000 in kobo
    preparationTime: 25,
    category: MENU_CATEGORIES.MAIN,
  },
  PEPPER_GOAT: {
    name: 'Pepper Goat Meat',
    basePrice: 350000, // ₦3,500 in kobo
    preparationTime: 30,
    category: MENU_CATEGORIES.MAIN,
  },
  PEPPER_FISH: {
    name: 'Pepper Fish',
    basePrice: 280000, // ₦2,800 in kobo
    preparationTime: 18,
    category: MENU_CATEGORIES.MAIN,
  },
  DODO: {
    name: 'Dodo (Fried Plantain)',
    basePrice: 80000, // ₦800 in kobo
    preparationTime: 10,
    category: MENU_CATEGORIES.SIDE,
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Public endpoints
  MENU: '/api/menu',
  ORDERS: '/api/orders',
  PAYMENTS: '/api/payments',
  
  // Admin endpoints
  ADMIN_AUTH: '/api/admin/auth',
  ADMIN_ORDERS: '/api/admin/orders',
  ADMIN_MENU: '/api/admin/menu',
  ADMIN_ANALYTICS: '/api/admin/analytics',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

// Notification templates
export const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: 'Your order #{orderNumber} has been confirmed. Total: ${total}. Estimated ready time: {readyTime}.',
  ORDER_READY: 'Your order #{orderNumber} is ready for {orderType}! Please come to collect your delicious meal.',
  ORDER_DELAYED: 'Your order #{orderNumber} is taking a bit longer. New estimated time: {readyTime}. Sorry for the delay!',
} as const;