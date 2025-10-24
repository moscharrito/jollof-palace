// No-op Redis implementation - Redis functionality disabled
export const redis = null;

// No-op connect function
export async function connectRedis() {
  console.log('⚠️ Redis disabled - using in-memory cache fallback');
  return;
}

// In-memory cache fallback (simple implementation for development)
const memoryCache = new Map<string, { value: any; expires: number }>();

// Cache helper functions with in-memory fallback
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = memoryCache.get(key);
      if (!cached) return null;
      
      if (Date.now() > cached.expires) {
        memoryCache.delete(key);
        return null;
      }
      
      return cached.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const expires = Date.now() + (ttlSeconds * 1000);
      memoryCache.set(key, { value, expires });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const cached = memoryCache.get(key);
      if (!cached) return false;
      
      if (Date.now() > cached.expires) {
        memoryCache.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },
};