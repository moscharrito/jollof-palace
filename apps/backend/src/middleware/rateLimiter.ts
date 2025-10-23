import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

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
      const window = Math.floor(Date.now() / windowMs);
      const redisKey = `${key}:${window}`;

      // Get current count
      const current = await redis.get(redisKey);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil(windowMs / 1000),
          },
        });
        return;
      }

      // Increment counter
      await redis.multi()
        .incr(redisKey)
        .expire(redisKey, Math.ceil(windowMs / 1000))
        .exec();

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - count - 1).toString(),
        'X-RateLimit-Reset': (Date.now() + windowMs).toString(),
      });

      // Handle response tracking
      if (!skipSuccessfulRequests || !skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          const shouldSkip = 
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip) {
            // Decrement counter if we should skip this request
            redis.decr(redisKey).catch(console.error);
          }

          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue without rate limiting if Redis is down
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