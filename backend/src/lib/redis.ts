let redis: any = null;

function createRedisClient() {
  if (!redis && process.env.REDIS_URL) {
    const { createClient } = require('redis');
    const redisUrl = process.env.REDIS_URL;
    redis = createClient({
      url: redisUrl,
    });

    redis.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  }
  return redis;
}

export { redis };

// Connect to Redis
export async function connectRedis() {
  try {
    if (!process.env.REDIS_URL) {
      console.log('⚠️ Redis not configured, skipping Redis connection');
      return;
    }
    
    const redisClient = createRedisClient();
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    console.log('⚠️ Redis connection failed, continuing without cache');
    return;
  }
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redis || !redis.isReady) return null;
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (!redis || !redis.isReady) return;
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!redis || !redis.isReady) return;
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (!redis || !redis.isReady) return false;
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },
};