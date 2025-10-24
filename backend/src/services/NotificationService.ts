import { BaseService } from './BaseService';
import { Order, OrderStatus } from '@prisma/client';

export interface NotificationTemplate {
  orderConfirmed: (orderNumber: string, estimatedTime: string) => string;
  orderPreparing: (orderNumber: string) => string;
  orderReady: (orderNumber: string, orderType: string) => string;
  orderCompleted: (orderNumber: string) => string;
  orderDelayed: (orderNumber: string, newEstimatedTime: string) => string;
}

export class NotificationService extends BaseService {
  constructor() {
    super();
    console.log('📧 NotificationService initialized (SMS disabled)');
  }

  private getNotificationTemplates(): NotificationTemplate {
    return {
      orderConfirmed: (orderNumber: string, estimatedTime: string) =>
        `🍽️ Order Confirmed!\n\nYour order #${orderNumber} has been confirmed and is being prepared.\n\nEstimated ready time: ${estimatedTime}\n\nTrack your order: ${process.env.FRONTEND_URL}/order/${orderNumber}\n\n- Jollof Palace`,

      orderPreparing: (orderNumber: string) =>
        `👨‍🍳 Order in Progress!\n\nYour order #${orderNumber} is now being prepared by our kitchen team.\n\nWe'll notify you when it's ready!\n\n- Jollof Palace`,

      orderReady: (orderNumber: string, orderType: string) =>
        `✅ Order Ready!\n\nYour order #${orderNumber} is ready for ${orderType.toLowerCase()}!\n\n${orderType === 'PICKUP' 
          ? 'Please come to the restaurant to collect your order.' 
          : 'Our delivery driver is on the way to your location.'}\n\n- Jollof Palace`,

      orderCompleted: (orderNumber: string) =>
        `🎉 Order Completed!\n\nThank you for choosing Jollof Palace! Your order #${orderNumber} has been completed.\n\nWe hope you enjoyed your meal. Please rate your experience and order again soon!\n\n- Jollof Palace`,

      orderDelayed: (orderNumber: string, newEstimatedTime: string) =>
        `⏰ Order Update\n\nYour order #${orderNumber} is taking a bit longer than expected.\n\nNew estimated time: ${newEstimatedTime}\n\nWe apologize for the delay and appreciate your patience!\n\n- Jollof Palace`,
    };
  }

  async sendOrderStatusNotification(
    order: Order,
    status: OrderStatus,
    estimatedTime?: Date
  ): Promise<boolean> {
    // Log notification instead of sending SMS
    console.log(`📧 Notification (${status}): Order ${order.orderNumber} for ${order.customerPhone}`);
    
    await this.logNotification({
      orderId: order.id,
      type: 'LOG',
      recipient: order.customerPhone || '',
      message: `Order status updated to ${status}`,
      status: 'LOGGED',
    });

    return true;
  }

  async sendDelayNotification(
    order: Order,
    newEstimatedTime: Date,
    reason?: string
  ): Promise<boolean> {
    console.log(`📧 Delay notification: Order ${order.orderNumber} delayed until ${newEstimatedTime}`);
    if (reason) {
      console.log(`📧 Reason: ${reason}`);
    }
    
    await this.logNotification({
      orderId: order.id,
      type: 'LOG',
      recipient: order.customerPhone || '',
      message: `Order delayed until ${newEstimatedTime}${reason ? ` - ${reason}` : ''}`,
      status: 'LOGGED',
    });

    return true;
  }

  async sendBulkNotification(
    phoneNumbers: string[],
    message: string
  ): Promise<{ sent: number; failed: number }> {
    console.log(`📧 Bulk notification to ${phoneNumbers.length} recipients: ${message}`);
    
    // Log each notification
    for (const phoneNumber of phoneNumbers) {
      console.log(`📧 Would send to: ${phoneNumber}`);
    }

    return { sent: phoneNumbers.length, failed: 0 };
  }

  private formatPhoneNumber(phone: string): string {
    // Simple phone number formatting for logging
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    return phone;
  }

  private async logNotification(data: {
    orderId: string;
    type: string;
    recipient: string;
    message: string;
    status: string;
    externalId?: string;
    error?: string;
  }): Promise<void> {
    try {
      // In a real implementation, you might want to create a notifications table
      // For now, we'll just log to console
      console.log('Notification log:', {
        timestamp: new Date().toISOString(),
        ...data,
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  async testSMSService(phoneNumber: string): Promise<boolean> {
    console.log(`📧 Test notification would be sent to: ${this.formatPhoneNumber(phoneNumber)}`);
    console.log('📧 SMS service is disabled - notifications are logged only');
    return true;
  }

  isConfigured(): boolean {
    return true; // Always return true since logging is always available
  }
}