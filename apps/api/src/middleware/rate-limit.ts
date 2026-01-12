/**
 * VORTEX API - Rate Limiting Middleware
 */

import { Elysia } from 'elysia';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '../env';
import { RateLimitError } from './error-handler';

// Initialize Redis client
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiters for different endpoints
const rateLimiters = {
  scan: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 d'), // 100 scans per day
    prefix: 'rl:scan',
  }),
  consolidate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 d'), // 50 consolidations per day
    prefix: 'rl:consolidate',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 auth attempts per hour
    prefix: 'rl:auth',
  }),
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 calls per hour
    prefix: 'rl:general',
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

export function createRateLimiter(type: RateLimitType = 'general') {
  return new Elysia({ name: `rate-limit-${type}` }).derive(
    async ({ request }) => {
      // Get identifier (wallet or IP)
      const identifier =
        request.headers.get('x-wallet-address') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'anonymous';

      const limiter = rateLimiters[type];
      const { success, limit, remaining, reset } = await limiter.limit(identifier);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        throw new RateLimitError(retryAfter);
      }

      return {
        rateLimit: {
          limit,
          remaining,
          reset,
        },
      };
    }
  );
}

export const rateLimitMiddleware = createRateLimiter('general');
