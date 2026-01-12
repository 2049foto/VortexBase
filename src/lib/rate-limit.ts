/**
 * VORTEX PROTOCOL - RATE LIMITING
 * Enterprise-grade rate limiting with Upstash
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/constants';

// ============================================
// REDIS CLIENT
// ============================================

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('Redis configuration missing');
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

// ============================================
// RATE LIMITER CACHE
// ============================================

const limiters = new Map<string, Ratelimit>();

function getRateLimiter(config: {
  prefix: string;
  maxRequests: number;
  windowSeconds: number;
}): Ratelimit {
  const key = `${config.prefix}:${config.maxRequests}:${config.windowSeconds}`;

  if (!limiters.has(key)) {
    const limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowSeconds}s`),
      prefix: `vortex:rl:${config.prefix}`,
      analytics: true,
    });
    limiters.set(key, limiter);
  }

  return limiters.get(key)!;
}

// ============================================
// RATE LIMIT RESULT
// ============================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// ============================================
// VALIDATE RATE LIMIT
// ============================================

export async function validateRateLimit(
  identifier: string,
  config: {
    maxRequests?: number;
    windowSeconds?: number;
    prefix?: string;
  } = {}
): Promise<RateLimitResult> {
  const {
    maxRequests = RATE_LIMITS.SCAN_PER_MINUTE,
    windowSeconds = 60,
    prefix = 'default',
  } = config;

  try {
    const limiter = getRateLimiter({ prefix, maxRequests, windowSeconds });
    const result = await limiter.limit(identifier);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      
      logger.warn('Rate limit exceeded', {
        identifier,
        prefix,
        remaining: result.remaining,
        reset: result.reset,
      });

      return {
        allowed: false,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return {
      allowed: true,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // On error, allow the request but log it
    logger.error(
      'Rate limit check failed',
      error instanceof Error ? error : new Error(String(error)),
      { identifier, prefix }
    );

    return {
      allowed: true,
      remaining: -1,
      reset: Date.now() + windowSeconds * 1000,
    };
  }
}

// ============================================
// PREDEFINED LIMITERS
// ============================================

export async function checkScanRateLimit(walletAddress: string): Promise<RateLimitResult> {
  return validateRateLimit(`scan:${walletAddress.toLowerCase()}`, {
    maxRequests: RATE_LIMITS.SCAN_PER_MINUTE,
    windowSeconds: 60,
    prefix: 'scan',
  });
}

export async function checkSwapRateLimit(walletAddress: string): Promise<RateLimitResult> {
  return validateRateLimit(`swap:${walletAddress.toLowerCase()}`, {
    maxRequests: RATE_LIMITS.SWAP_PER_MINUTE,
    windowSeconds: 60,
    prefix: 'swap',
  });
}

export async function checkApiRateLimit(ip: string, endpoint: string): Promise<RateLimitResult> {
  return validateRateLimit(`api:${ip}:${endpoint}`, {
    maxRequests: 100,
    windowSeconds: 60,
    prefix: 'api',
  });
}

// ============================================
// IP-BASED RATE LIMITING
// ============================================

export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  return validateRateLimit(`ip:${ip}`, {
    maxRequests: 1000,
    windowSeconds: 3600, // 1 hour
    prefix: 'ip',
  });
}

// ============================================
// RATE LIMIT HEADERS
// ============================================

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}
