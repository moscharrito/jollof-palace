import { Request, Response, NextFunction } from 'express';
import { raw } from 'body-parser';

// Middleware to handle raw body for Stripe webhooks
export const stripeWebhookMiddleware = raw({ type: 'application/json' });

// Middleware to parse JSON for PayPal webhooks
export const paypalWebhookMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // PayPal sends JSON, so we can use regular JSON parsing
  next();
};

// Middleware to verify PayPal webhook signature (simplified)
export const verifyPayPalWebhook = (req: Request, res: Response, next: NextFunction) => {
  // In production, you should verify the webhook signature
  // For now, we'll just log the webhook and continue
  console.log('PayPal webhook received:', {
    headers: req.headers,
    body: req.body,
  });
  
  next();
};