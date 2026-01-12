/**
 * VORTEX API - Cache Service Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import { CACHE_TTL, CACHE_PREFIX, cacheKey } from '../services/cache';

describe('Cache Service', () => {
  describe('CACHE_TTL constants', () => {
    test('should have correct TTL values', () => {
      expect(CACHE_TTL.SCAN_RESULT).toBe(300);
      expect(CACHE_TTL.RISK_SCORE).toBe(180);
      expect(CACHE_TTL.PRICE).toBe(60);
      expect(CACHE_TTL.LEADERBOARD).toBe(300);
      expect(CACHE_TTL.USER_PROFILE).toBe(300);
      expect(CACHE_TTL.NONCE).toBe(300);
    });
  });

  describe('CACHE_PREFIX constants', () => {
    test('should have correct prefix values', () => {
      expect(CACHE_PREFIX.SCAN).toBe('scan');
      expect(CACHE_PREFIX.RISK).toBe('risk');
      expect(CACHE_PREFIX.PRICE).toBe('price');
      expect(CACHE_PREFIX.LEADERBOARD).toBe('lb');
      expect(CACHE_PREFIX.USER).toBe('user');
      expect(CACHE_PREFIX.RATE_LIMIT).toBe('rl');
    });
  });

  describe('cacheKey helpers', () => {
    test('should generate correct scan cache key', () => {
      const wallet = '0xABCDEF1234567890';
      const key = cacheKey.scan(wallet);
      expect(key).toBe('scan:0xabcdef1234567890');
    });

    test('should generate correct risk cache key', () => {
      const token = '0xTOKENADDRESS';
      const key = cacheKey.risk(token);
      expect(key).toBe('risk:0xtokenaddress');
    });

    test('should generate correct price cache key', () => {
      const token = '0xPRICETOKEN';
      const key = cacheKey.price(token);
      expect(key).toBe('price:0xpricetoken');
    });

    test('should generate correct leaderboard cache key', () => {
      const period = 'weekly';
      const key = cacheKey.leaderboard(period);
      expect(key).toBe('lb:weekly');
    });

    test('should generate correct user cache key', () => {
      const wallet = '0xUSERWALLET';
      const key = cacheKey.user(wallet);
      expect(key).toBe('user:0xuserwallet');
    });

    test('should generate correct rate limit cache key', () => {
      const identifier = 'user:123:scan';
      const key = cacheKey.rateLimit(identifier);
      expect(key).toBe('rl:user:123:scan');
    });
  });
});
