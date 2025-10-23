import { BaseService } from './BaseService';
import { Order, OrderStatus } from '@prisma/client';
import twilio from 'twilio';

export interface NotificationTemplate {
  orderConfirmed: (orderNumber: string, estimatedTime: string) => string;
  orderPreparing: (orderNumber: string) => string;
  orderReady: (orderNumber: string, orderType: string) => string;
  orderCompleted: (orderNumber: string) => string;
  orderDelayed: (orderNumber: string, newEstimatedTime: string) => string;
}

export class NotificationService extends BaseService {
  private twilioClient: twilio.Twilio | null = null;
  private fromNumber: string;

  constructor() {
    super();
    
    // Initialize Twilio if credentials are provided
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      console.log('✅ Twilio SMS service initialized');
    } else {
      console.warn('⚠️ Twilio credentials not found. SMS notifications disabled.');
    }
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
    if (!this.twilioClient || !order.customerPhone) {
      console.log('SMS notification skipped: Twilio not configured or no phone number');
      return false;
    }

    try {
      const templates = this.getNotificationTemplates();
      let message: string;

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      };

      switch (status) {
        case 'CONFIRMED':
          message = templates.orderConfirmed(
            order.orderNumber,
            formatTime(estimatedTime || order.estimatedReadyTime)
          );
          break;

        case 'PREPARING':
          message = templates.orderPreparing(order.orderNumber);
          break;

        case 'READY':
          message = templates.orderReady(order.orderNumber, order.orderType);
          break;

        case 'COMPLETED':
          message = templates.orderCompleted(order.orderNumber);
          break;

        default:
          console.log(`No SMS template for status: ${status}`);
          return false;
      }

      // Send SMS
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: this.formatPhoneNumber(order.customerPhone),
      });

      console.log(`SMS sent successfully: ${result.sid}`);
      
      // Log notification in database
      await this.logNotification({
        orderId: order.id,
        type: 'SMS',
        recipient: order.customerPhone,
        message,
        status: 'SENT',
        externalId: result.sid,
      });

      return true;
    } catch (error: any) {
      console.error('Failed to send SMS notification:', error);
      
      // Log failed notification
      await this.logNotification({
        orderId: order.id,
        type: 'SMS',
        recipient: order.customerPhone || '',
        message: 'Failed to send',
        status: 'FAILED',
        error: error.message,
      });

      return false;
    }
  }

  async sendDelayNotification(
    order: Order,
    newEstimatedTime: Date,
    reason?: string
  ): Promise<boolean> {
    if (!this.twilioClient || !order.customerPhone) {
      return false;
    }

    try {
      const templates = this.getNotificationTemplates();
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      };

      let message = templates.orderDelayed(order.orderNumber, formatTime(newEstimatedTime));
      
      if (reason) {
        message += `\n\nReason: ${reason}`;
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: this.formatPhoneNumber(order.customerPhone),
      });

      console.log(`Delay notification sent: ${result.sid}`);
      
      await this.logNotification({
        orderId: order.id,
        type: 'SMS',
        recipient: order.customerPhone,
        message,
        status: 'SENT',
        externalId: result.sid,
      });

      return true;
    } catch (error: any) {
      console.error('Failed to send delay notification:', error);
      return false;
    }
  }

  async sendBulkNotification(
    phoneNumbers: string[],
    message: string
  ): Promise<{ sent: number; failed: number }> {
    if (!this.twilioClient) {
      return { sent: 0, failed: phoneNumbers.length };
    }

    let sent = 0;
    let failed = 0;

    for (const phoneNumber of phoneNumbers) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: this.fromNumber,
          to: this.formatPhoneNumber(phoneNumber),
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send SMS to ${phoneNumber}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming US/Canada)
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    
    // Return as-is if it already looks like an international number
    return digitsOnly.startsWith('+') ? phone : `+${digitsOnly}`;
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
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: 'Test message from Jollof Palace ordering system. SMS notifications are working correctly!',
        from: this.fromNumber,
        to: this.formatPhoneNumber(phoneNumber),
      });

      console.log(`Test SMS sent successfully: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Test SMS failed:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.twilioClient !== null;
  }
}