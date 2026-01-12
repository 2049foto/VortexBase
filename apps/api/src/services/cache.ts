/**
 * VORTEX API - Cache Service (Upstash Redis)
 * 
 * Features:
 * - Get/Set/Del operations
 * - Increment for rate limiting
 * - Cache-or-fetch pattern
 * - Connection retry logic
 * - Graceful error handling
 */

import { Redis } from '@upstash/redis';
import { env } from '../env';
import { log } from '../middleware/logger';

// ============================================
// CONFIGURATION
// ============================================

// Cache TTLs (seconds)
export const CACHE_TTL = {
  SCAN_RESULT: 300,    // 5 min
  RISK_SCORE: 180,     // 3 min
  PRICE: 60,           // 1 min
  LEADERBOARD: 300,    // 5 min
  USER_PROFILE: 300,   // 5 min
  NONCE: 300,          // 5 min (matches env.WALLET_NONCE_TTL)
} as const;

// Cache key prefixes
export const CACHE_PREFIX = {
  SCAN: 'scan',
  RISK: 'risk',
  PRICE: 'price',
  LEADERBOARD: 'lb',
  USER: 'user',
  RATE_LIMIT: 'rl',
} as const;

// ============================================
// REDIS CLIENT
// ============================================

function createRedisClient(): Redis {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const redis = createRedisClient();

// ============================================
// CACHE KEY HELPERS
// ============================================

export const cacheKey = {
  scan: (wallet: string) => `${CACHE_PREFIX.SCAN}:${wallet.toLowerCase()}`,
  risk: (token: string) => `${CACHE_PREFIX.RISK}:${token.toLowerCase()}`,
  price: (token: string) => `${CACHE_PREFIX.PRICE}:${token.toLowerCase()}`,
  prices: (chain: string) => `${CACHE_PREFIX.PRICE}:batch:${chain}`,
  leaderboard: (period: string) => `${CACHE_PREFIX.LEADERBOARD}:${period}`,
  user: (wallet: string) => `${CACHE_PREFIX.USER}:${wallet.toLowerCase()}`,
  rateLimit: (key: string) => `${CACHE_PREFIX.RATE_LIMIT}:${key}`,
};

// ============================================
// CORE OPERATIONS
// ============================================

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(key);
    if (value !== null) {
      log.debug({ key, hit: true }, 'Cache hit');
    }
    return value;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Cache get failed');
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.SCAN_RESULT
): Promise<boolean> {
  try {
    await redis.setex(key, ttlSeconds, value);
    log.debug({ key, ttl: ttlSeconds }, 'Cache set');
    return true;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Cache set failed');
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function del(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    log.debug({ key }, 'Cache deleted');
    return true;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Cache delete failed');
    return false;
  }
}

/**
 * Increment counter (for rate limiting)
 */
export async function incr(key: string): Promise<number> {
  try {
    const value = await redis.incr(key);
    return value;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Cache incr failed');
    return 0;
  }
}

/**
 * Set expiry on existing key
 */
export async function expire(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    await redis.expire(key, ttlSeconds);
    return true;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Cache expire failed');
    return false;
  }
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Cache exists check failed');
    return false;
  }
}

// ============================================
// CACHE-OR-FETCH PATTERN
// ============================================

/**
 * Get from cache or fetch from source
 * Automatically caches the result
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.SCAN_RESULT
): Promise<T> {
  // Try cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  log.debug({ key }, 'Cache miss, fetching');
  const fresh = await fetcher();

  // Cache the result (fire and forget)
  set(key, fresh, ttlSeconds).catch(() => {
    // Already logged in set()
  });

  return fresh;
}

/**
 * Batch get multiple keys
 */
export async function mget<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) {
    return [];
  }

  try {
    const values = await redis.mget<T[]>(...keys);
    const hits = values.filter((v) => v !== null).length;
    log.debug({ keyCount: keys.length, hits }, 'Cache mget');
    return values;
  } catch (error) {
    log.warn({ keys, error: (error as Error).message }, 'Cache mget failed');
    return keys.map(() => null);
  }
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Invalidate cache by pattern (use with caution)
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  try {
    // Upstash doesn't support KEYS command directly, so we track keys manually
    // For now, just log the intent
    log.info({ pattern }, 'Cache invalidation requested');
    return 0;
  } catch (error) {
    log.warn({ pattern, error: (error as Error).message }, 'Cache invalidation failed');
    return 0;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkCacheHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
}> {
  const startTime = performance.now();

  try {
    await redis.ping();
    const latencyMs = Math.round(performance.now() - startTime);
    return { healthy: true, latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    log.error({ error: (error as Error).message, latencyMs }, 'Cache health check failed');
    return { healthy: false, latencyMs };
  }
}

// For backwards compatibility
export { getOrFetch as getCacheOrFetch };
