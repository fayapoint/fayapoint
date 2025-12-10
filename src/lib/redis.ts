import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
// Set these in Netlify env vars:
// UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
// UPSTASH_REDIS_REST_TOKEN=xxx
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Cache TTL values in seconds
export const CACHE_TTL = {
  LEADERBOARD: 300,      // 5 minutes - shared, changes slowly
  COMMUNITY_STATS: 300,  // 5 minutes - shared, aggregate data
  GALLERY: 120,          // 2 minutes - public gallery pages
  PRODUCTS: 600,         // 10 minutes - product list rarely changes
  COURSE_CONTENT: 3600,  // 1 hour - course content rarely changes
  USER_SESSION: 60,      // 1 minute - user-specific but cacheable
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  LEADERBOARD: 'leaderboard:weekly',
  COMMUNITY_STATS: 'community:stats',
  GALLERY: (page: number, limit: number) => `gallery:p${page}:l${limit}`,
  PRODUCTS: 'products:list',
  PRODUCT: (slug: string) => `product:${slug}`,
  COURSE_CONTENT: (slug: string) => `course:${slug}`,
  USER_DASHBOARD_STATIC: (userId: string) => `user:${userId}:dashboard:static`,
} as const;

/**
 * Get cached value or fetch from source
 * @param key Cache key
 * @param fetcher Function to fetch data if cache miss
 * @param ttl Time to live in seconds
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  try {
    // Skip cache if Redis not configured
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return await fetcher();
    }

    // Try to get from cache
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache (fire and forget)
    redis.set(key, data, { ex: ttl }).catch(err => {
      console.error('Redis set error:', err);
    });

    return data;
  } catch (error) {
    console.error('Redis getOrSet error:', error);
    // Fall back to fetcher on any Redis error
    return await fetcher();
  }
}

/**
 * Invalidate a cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;
    await redis.del(key);
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}

/**
 * Invalidate multiple cache keys by pattern (use with caution)
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;
    
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis invalidate pattern error:', error);
  }
}

/**
 * Set cache directly
 */
export async function setCache<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;
    await redis.set(key, data, { ex: ttl });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Get cache directly
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return null;
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export default redis;
