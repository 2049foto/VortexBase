/**
 * VORTEX API - Utility Functions Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import { withRetry, RetryConfig } from '../utils/retry';

describe('Retry Utility', () => {
  describe('withRetry', () => {
    test('should succeed on first try', async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    test('should retry on failure and succeed', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) throw new Error('Temporary failure');
          return 'success';
        },
        { maxRetries: 3, delayMs: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should throw after max retries', async () => {
      let attempts = 0;
      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error('Permanent failure');
          },
          { maxRetries: 2, delayMs: 10 }
        )
      ).rejects.toThrow('Permanent failure');

      expect(attempts).toBe(3); // Initial + 2 retries
    });

    test('should respect custom config', async () => {
      const config: RetryConfig = {
        maxRetries: 1,
        delayMs: 5,
        backoffMultiplier: 1,
      };

      let attempts = 0;
      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error('Fail');
          },
          config
        )
      ).rejects.toThrow();

      expect(attempts).toBe(2); // Initial + 1 retry
    });
  });
});

describe('Validation Helpers', () => {
  describe('isValidEthereumAddress', () => {
    const isValidEthereumAddress = (address: string): boolean => {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    test('should accept valid lowercase address', () => {
      expect(isValidEthereumAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    });

    test('should accept valid uppercase address', () => {
      expect(isValidEthereumAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
    });

    test('should accept valid mixed case address', () => {
      expect(isValidEthereumAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe(true);
    });

    test('should reject address without 0x prefix', () => {
      expect(isValidEthereumAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false);
    });

    test('should reject address with wrong length', () => {
      expect(isValidEthereumAddress('0x123456')).toBe(false);
    });

    test('should reject address with invalid characters', () => {
      expect(isValidEthereumAddress('0xGHIJKL7890abcdef1234567890abcdef12345678')).toBe(false);
    });
  });
});
