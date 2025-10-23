import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

// Connect to Redis
export async function connectRedis() {
  try {
    if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      console.log('⚠️ Redis not configured in production, skipping Redis connection');
      return;
    }
    await redis.connect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Redis connection failed in production, continuing without cache');
      return;
    }
    throw error;
  }
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redis.isReady) return null;
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (!redis.isReady) return;
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!redis.isReady) return;
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (!redis.isReady) return false;
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },
};