// Utility functions

import { OrderStatus, PaymentStatus } from '../types';

/**
 * Format currency amount to US Dollars
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100); // Convert cents to dollars
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
}

/**
 * Calculate estimated ready time based on items and current queue
 */
export function calculateEstimatedReadyTime(
  preparationTimes: number[],
  queueLength: number = 0
): Date {
  const maxPreparationTime = Math.max(...preparationTimes, 0);
  const bufferTime = 5; // 5 minutes buffer
  const queueDelay = queueLength * 3; // 3 minutes per order in queue
  
  const totalMinutes = maxPreparationTime + bufferTime + queueDelay;
  
  const readyTime = new Date();
  readyTime.setMinutes(readyTime.getMinutes() + totalMinutes);
  
  return readyTime;
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number = 0.0875): number {
  return Math.round(subtotal * taxRate);
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  subtotal: number,
  taxRate: number = 0.0875,
  deliveryFee: number = 0
): { tax: number; total: number } {
  const tax = calculateTax(subtotal, taxRate);
  const total = subtotal + tax + deliveryFee;
  
  return { tax, total };
}

/**
 * Validate phone number (US format)
 */
export function validatePhoneNumber(phone: string): boolean {
  // US phone number patterns
  const patterns = [
    /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/, // +1XXXXXXXXXX
    /^1[2-9]\d{2}[2-9]\d{2}\d{4}$/, // 1XXXXXXXXXX
    /^[2-9]\d{2}[2-9]\d{2}\d{4}$/, // XXXXXXXXXX
    /^\([2-9]\d{2}\)\s?[2-9]\d{2}-?\d{4}$/, // (XXX) XXX-XXXX
    /^[2-9]\d{2}-[2-9]\d{2}-\d{4}$/, // XXX-XXX-XXXX
  ];
  
  return patterns.some(pattern => pattern.test(phone.replace(/\s+/g, '')));
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  return `+1${cleaned}`;
}

/**
 * Get order status display text
 */
export function getOrderStatusText(status: OrderStatus): string {
  const statusTexts: Record<OrderStatus, string> = {
    pending: 'Pending Payment',
    confirmed: 'Order Confirmed',
    preparing: 'Being Prepared',
    ready: 'Ready for Pickup/Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  
  return statusTexts[status] || status;
}

/**
 * Get payment status display text
 */
export function getPaymentStatusText(status: PaymentStatus): string {
  const statusTexts: Record<PaymentStatus, string> = {
    pending: 'Payment Pending',
    processing: 'Processing Payment',
    completed: 'Payment Successful',
    failed: 'Payment Failed',
    refunded: 'Payment Refunded',
  };
  
  return statusTexts[status] || status;
}

/**
 * Check if order status can be updated to new status
 */
export function canUpdateOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed'],
    completed: [],
    cancelled: [],
  };
  
  return statusFlow[currentStatus]?.includes(newStatus) || false;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}