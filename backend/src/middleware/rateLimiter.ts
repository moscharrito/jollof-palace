import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store for rate limiting (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const resetTime = windowStart + windowMs;

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);
      
      // Reset if window has passed
      if (!entry || entry.resetTime <= now) {
        entry = { count: 0, resetTime };
        rateLimitStore.set(key, entry);
      }

      if (entry.count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil((resetTime - now) / 1000),
          },
        });
        return;
      }

      // Increment counter
      entry.count++;

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      });

      // Handle response tracking
      if (!skipSuccessfulRequests || !skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          const shouldSkip = 
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip && entry) {
            // Decrement counter if we should skip this request
            entry.count = Math.max(0, entry.count - 1);
          }

          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue without rate limiting if there's an error
      next();
    }
  };
}

// Predefined rate limiters
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}:${req.body.email || 'unknown'}`,
});

export const orderLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 orders per minute
  keyGenerator: (req) => `order:${req.ip}`,
});