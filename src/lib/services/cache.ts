/**
 * VORTEX PROTOCOL - CACHE SERVICE
 * Redis caching with Upstash
 */

import { Redis } from '@upstash/redis';

import { CACHE_PREFIX, CACHE_TTL } from '@/lib/constants';
import { logger } from '@/lib/logger';

// ============================================
// REDIS CLIENT
// ============================================

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('Redis configuration missing: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required');
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

// ============================================
// CACHE OPERATIONS
// ============================================

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    const value = await getRedis().get<T>(fullKey);
    return value;
  } catch (error) {
    logger.error('Cache get failed', error instanceof Error ? error : new Error(String(error)), { key });
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.PRICE
): Promise<boolean> {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    await getRedis().set(fullKey, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    logger.error('Cache set failed', error instanceof Error ? error : new Error(String(error)), { key });
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    await getRedis().del(fullKey);
    return true;
  } catch (error) {
    logger.error('Cache delete failed', error instanceof Error ? error : new Error(String(error)), { key });
    return false;
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.PRICE
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache for next time (don't await)
  cacheSet(key, data, ttlSeconds).catch(() => {
    // Already logged in cacheSet
  });

  return data;
}

// ============================================
// SPECIALIZED CACHE FUNCTIONS
// ============================================

export async function cacheTokenPrice(
  tokenAddress: string,
  chainId: number,
  price: number
): Promise<void> {
  const key = `price:${chainId}:${tokenAddress.toLowerCase()}`;
  await cacheSet(key, price, CACHE_TTL.PRICE);
}

export async function getCachedTokenPrice(
  tokenAddress: string,
  chainId: number
): Promise<number | null> {
  const key = `price:${chainId}:${tokenAddress.toLowerCase()}`;
  return cacheGet<number>(key);
}

export async function cacheRiskScore(
  tokenAddress: string,
  chainId: number,
  score: { overall: number; level: string; confidence: number }
): Promise<void> {
  const key = `risk:${chainId}:${tokenAddress.toLowerCase()}`;
  await cacheSet(key, score, CACHE_TTL.RISK_SCORE);
}

export async function getCachedRiskScore(
  tokenAddress: string,
  chainId: number
): Promise<{ overall: number; level: string; confidence: number } | null> {
  const key = `risk:${chainId}:${tokenAddress.toLowerCase()}`;
  return cacheGet(key);
}

export async function cacheScanResult(
  walletAddress: string,
  chainId: number,
  result: unknown
): Promise<void> {
  const key = `scan:${chainId}:${walletAddress.toLowerCase()}`;
  await cacheSet(key, result, CACHE_TTL.SCAN);
}

export async function getCachedScanResult<T>(
  walletAddress: string,
  chainId: number
): Promise<T | null> {
  const key = `scan:${chainId}:${walletAddress.toLowerCase()}`;
  return cacheGet<T>(key);
}

export async function cacheUserProfile(userId: string, profile: unknown): Promise<void> {
  const key = `user:${userId}`;
  await cacheSet(key, profile, CACHE_TTL.USER_PROFILE);
}

export async function getCachedUserProfile<T>(userId: string): Promise<T | null> {
  const key = `user:${userId}`;
  return cacheGet<T>(key);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheDelete(`user:${userId}`);
}

export async function cacheLeaderboard(
  period: string,
  data: unknown
): Promise<void> {
  const key = `leaderboard:${period}`;
  await cacheSet(key, data, CACHE_TTL.LEADERBOARD);
}

export async function getCachedLeaderboard<T>(period: string): Promise<T | null> {
  const key = `leaderboard:${period}`;
  return cacheGet<T>(key);
}
