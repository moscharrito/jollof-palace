# SMS Notification System Guide

## Overview

The SMS notification system provides automated SMS notifications for order status updates using Twilio. This system is fully integrated with the order management workflow and provides fallback handling for failed notifications.

## Features

- ✅ **Order Status Notifications**: Automatic SMS for order confirmation, preparation, ready, and completion
- ✅ **Delay Notifications**: SMS alerts when orders are delayed with new estimated times
- ✅ **Bulk SMS**: Send promotional or announcement messages to multiple customers
- ✅ **Template System**: Predefined message templates for different notification types
- ✅ **Phone Number Formatting**: Automatic formatting for US and international numbers
- ✅ **Error Handling**: Graceful fallback when SMS service is unavailable
- ✅ **Logging**: Comprehensive logging of all SMS attempts and results

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# SMS - Twilio Configuration
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Frontend URL for order tracking links
FRONTEND_URL="http://localhost:3000"
```

### Getting Twilio Credentials

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number or use a trial number
4. Add the credentials to your environment variables

## Usage

### Automatic Notifications

The system automatically sends SMS notifications when order status changes:

```typescript
// This happens automatically in OrderService.updateOrderStatus()
await orderService.updateOrderStatus(orderId, 'CONFIRMED');
// SMS notification is sent automatically
```

### Manual Notifications via API

#### Test SMS Service

```bash
POST /api/notifications/test-sms
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

#### Send Order Notification

```bash
POST /api/notifications/order-notification
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "orderId": "order-123",
  "status": "CONFIRMED"
}
```

#### Send Delay Notification

```bash
POST /api/notifications/delay-notification
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "orderId": "order-123",
  "newEstimatedTime": "2024-01-01T14:30:00Z",
  "reason": "High order volume"
}
```

#### Bulk SMS

```bash
POST /api/notifications/bulk-sms
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "phoneNumbers": ["+1234567890", "+0987654321"],
  "message": "Special offer: 20% off all orders today!"
}
```

#### Check Service Status

```bash
GET /api/notifications/status
Authorization: Bearer <admin-token>
```

### Programmatic Usage

```typescript
import { NotificationService } from './services/NotificationService';

const notificationService = new NotificationService();

// Send order status notification
await notificationService.sendOrderStatusNotification(
  order,
  'CONFIRMED',
  estimatedReadyTime
);

// Send delay notification
await notificationService.sendDelayNotification(
  order,
  newEstimatedTime,
  'Kitchen equipment issue'
);

// Send bulk notification
const result = await notificationService.sendBulkNotification(
  ['+1234567890', '+0987654321'],
  'Restaurant closed today due to maintenance'
);

// Test SMS service
const isWorking = await notificationService.testSMSService('+1234567890');
```

## Message Templates

### Order Confirmed
```
🍽️ Order Confirmed!

Your order #ORD-123456-ABC has been confirmed and is being prepared.

Estimated ready time: 12:30 PM

Track your order: http://localhost:3000/order/ORD-123456-ABC

- Jollof Palace
```

### Order Preparing
```
👨‍🍳 Order in Progress!

Your order #ORD-123456-ABC is now being prepared by our kitchen team.

We'll notify you when it's ready!

- Jollof Palace
```

### Order Ready (Pickup)
```
✅ Order Ready!

Your order #ORD-123456-ABC is ready for pickup!

Please come to the restaurant to collect your order.

- Jollof Palace
```

### Order Ready (Delivery)
```
✅ Order Ready!

Your order #ORD-123456-ABC is ready for delivery!

Our delivery driver is on the way to your location.

- Jollof Palace
```

### Order Completed
```
🎉 Order Completed!

Thank you for choosing Jollof Palace! Your order #ORD-123456-ABC has been completed.

We hope you enjoyed your meal. Please rate your experience and order again soon!

- Jollof Palace
```

### Order Delayed
```
⏰ Order Update

Your order #ORD-123456-ABC is taking a bit longer than expected.

New estimated time: 1:30 PM

We apologize for the delay and appreciate your patience!

- Jollof Palace
```

## Phone Number Formatting

The system automatically formats phone numbers:

- **10-digit US**: `1234567890` → `+11234567890`
- **11-digit US**: `11234567890` → `+11234567890`
- **International**: `+234801234567` → `+234801234567`
- **Formatted**: `(123) 456-7890` → `+11234567890`

## Error Handling

### Graceful Degradation

- If Twilio is not configured, SMS notifications are skipped without breaking the order flow
- Failed SMS attempts are logged but don't prevent order processing
- The system continues to work even if the SMS service is temporarily unavailable

### Fallback Strategies

1. **SMS Failure**: Order processing continues normally
2. **Invalid Phone Numbers**: Logged as failed, other notifications continue
3. **Rate Limiting**: Automatic retry with exponential backoff
4. **Network Issues**: Timeout handling with graceful failure

## Testing

### Unit Tests

```bash
npm test -- --testPathPattern="NotificationService.test.ts"
```

### Integration Tests

```bash
# Set test Twilio credentials
export TEST_TWILIO_ACCOUNT_SID="your_test_sid"
export TEST_TWILIO_AUTH_TOKEN="your_test_token"
export TEST_TWILIO_PHONE_NUMBER="+15005550006"

npm test -- --testPathPattern="sms-notification.integration.test.ts"
```

### Manual Testing

Use the test endpoint to verify SMS functionality:

```bash
curl -X POST http://localhost:3001/api/notifications/test-sms \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

## Monitoring and Logging

### SMS Logs

All SMS attempts are logged with:
- Timestamp
- Order ID
- Recipient phone number
- Message content
- Status (SENT/FAILED)
- External ID (Twilio SID)
- Error details (if failed)

### Console Output

```
✅ Twilio SMS service initialized
SMS sent successfully: SM1234567890abcdef
Notification log: { timestamp: '2024-01-01T12:00:00Z', orderId: 'order-123', ... }
```

## Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check Twilio credentials in environment variables
   - Verify phone number format
   - Check Twilio account balance

2. **Invalid Phone Numbers**
   - Ensure phone numbers include country code
   - Use E.164 format: `+1234567890`

3. **Rate Limiting**
   - Twilio has rate limits for trial accounts
   - Upgrade to paid account for higher limits

4. **International SMS**
   - Verify Twilio account has international SMS enabled
   - Check country-specific regulations

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed SMS logs in the console.

## Security Considerations

- Admin authentication required for all SMS endpoints
- Phone numbers are validated before sending
- Message content is sanitized
- Rate limiting prevents abuse
- Twilio credentials stored securely in environment variables

## Cost Optimization

- SMS notifications only sent for important status changes
- Bulk SMS limited to 100 recipients per request
- Failed SMS attempts are not retried indefinitely
- Template system ensures consistent, concise messages

## Requirements Fulfilled

This implementation satisfies the following task requirements:

- ✅ **Integrate Twilio SDK for SMS notifications**
- ✅ **Implement order confirmation SMS with order details**
- ✅ **Create order ready notification SMS for customer pickup/delivery**
- ✅ **Build SMS template system for different notification types**
- ✅ **Write integration tests for SMS delivery and fallback handling**

The system is production-ready with comprehensive error handling, testing, and monitoring capabilities.