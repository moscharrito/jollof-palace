import Joi from 'joi';
import { OrderType, PaymentMethod } from '@prisma/client';

// Menu item validation
export const menuItemSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  price: Joi.number().integer().min(1).required(),
  category: Joi.string().valid('MAIN', 'SIDE', 'COMBO').required(),
  imageUrl: Joi.string().uri().required(),
  preparationTime: Joi.number().integer().min(1).max(120).required(),
  ingredients: Joi.array().items(Joi.string().min(1).max(50)).min(1).required(),
  calories: Joi.number().integer().min(0).optional(),
  protein: Joi.number().min(0).optional(),
  carbs: Joi.number().min(0).optional(),
  fat: Joi.number().min(0).optional(),
  fiber: Joi.number().min(0).optional(),
  sodium: Joi.number().min(0).optional(),
});

// Order validation
export const createOrderSchema = Joi.object({
  customerInfo: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/).required(), // US phone format
    email: Joi.string().email().optional(),
    deliveryAddress: Joi.when('$orderType', {
      is: 'DELIVERY',
      then: Joi.object({
        street: Joi.string().min(5).max(200).required(),
        city: Joi.string().min(2).max(50).required(),
        state: Joi.string().min(2).max(50).required(),
        postalCode: Joi.string().max(10).optional(),
        landmark: Joi.string().max(100).optional(),
      }).required(),
      otherwise: Joi.optional(),
    }),
  }).required(),
  orderType: Joi.string().valid('PICKUP', 'DELIVERY').required(),
  items: Joi.array().items(
    Joi.object({
      menuItemId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).max(10).required(),
      customizations: Joi.array().items(Joi.string().max(100)).optional(),
    })
  ).min(1).required(),
  specialInstructions: Joi.string().max(500).optional(),
});

// Payment validation
export const paymentSchema = Joi.object({
  orderId: Joi.string().required(),
  method: Joi.string().valid('CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'ZELLE', 'CASH').required(),
  amount: Joi.number().integer().min(1).required(),
  currency: Joi.string().valid('USD').default('USD'), // US Dollar as default
  metadata: Joi.object().optional(),
});

export const initializePaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  method: Joi.string().valid('CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY').required(),
  customerEmail: Joi.string().email().optional(),
});

export const refundPaymentSchema = Joi.object({
  amount: Joi.number().integer().min(1).optional(),
  reason: Joi.string().max(500).optional(),
});

export const applePayValidationSchema = Joi.object({
  validationURL: Joi.string().uri().required(),
});

// Admin user validation
export const adminUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('ADMIN', 'STAFF').default('STAFF'),
});

// Login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Order status update validation
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED').required(),
  actualReadyTime: Joi.date().optional(),
});

// Query parameters validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const orderFilterSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED').optional(),
  orderType: Joi.string().valid('PICKUP', 'DELIVERY').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  customerPhone: Joi.string().optional(),
}).concat(paginationSchema);

// Data model validation functions
export function validateMenuItem(data: any): { isValid: boolean; errors: string[] } {
  const { error } = validateSchema(menuItemSchema, data);
  return {
    isValid: !error,
    errors: error ? [error] : [],
  };
}

export function validateOrder(data: any): { isValid: boolean; errors: string[] } {
  const { error } = validateSchema(createOrderSchema, data);
  return {
    isValid: !error,
    errors: error ? [error] : [],
  };
}

export function validateCustomerInfo(data: any): { isValid: boolean; errors: string[] } {
  const customerInfoSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/).required(),
    email: Joi.string().email().optional(),
    deliveryAddress: Joi.object({
      street: Joi.string().min(5).max(200).required(),
      city: Joi.string().min(2).max(50).required(),
      state: Joi.string().min(2).max(50).required(),
      postalCode: Joi.string().max(10).optional(),
      landmark: Joi.string().max(100).optional(),
    }).optional(),
  });

  const { error } = validateSchema(customerInfoSchema, data);
  return {
    isValid: !error,
    errors: error ? [error] : [],
  };
}

export function validateOrderItem(data: any): { isValid: boolean; errors: string[] } {
  const orderItemSchema = Joi.object({
    menuItemId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).max(10).required(),
    unitPrice: Joi.number().integer().min(1).required(),
    customizations: Joi.array().items(Joi.string().max(100)).optional(),
  });

  const { error } = validateSchema(orderItemSchema, data);
  return {
    isValid: !error,
    errors: error ? [error] : [],
  };
}

// US phone number validation helper
export function isValidUSPhone(phone: string): boolean {
  const phoneRegex = /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  return phoneRegex.test(phone);
}

// Price validation helper (ensures price is in cents - smallest US currency unit)
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price > 0;
}

// Validation helper function
export function validateSchema<T>(schema: Joi.ObjectSchema<T>, data: any): {
  error?: string;
  value?: T;
} {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: errorMessage };
  }

  return { value };
}