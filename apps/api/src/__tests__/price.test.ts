/**
 * VORTEX API - Price Service Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import { COINGECKO_CONFIG, KNOWN_TOKENS } from '../services/price';

describe('Price Service', () => {
  describe('COINGECKO_CONFIG', () => {
    test('should have correct base URL', () => {
      expect(COINGECKO_CONFIG.BASE_URL).toBe('https://api.coingecko.com/api/v3');
    });

    test('should have correct timeout', () => {
      expect(COINGECKO_CONFIG.TIMEOUT_MS).toBe(10000);
    });

    test('should have correct batch size', () => {
      expect(COINGECKO_CONFIG.BATCH_SIZE).toBe(100);
    });
  });

  describe('KNOWN_TOKENS', () => {
    test('should have USDC mapping', () => {
      const usdcAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
      expect(KNOWN_TOKENS[usdcAddress]).toBe('usd-coin');
    });

    test('should have WETH mapping', () => {
      const wethAddress = '0x4200000000000000000000000000000000000006';
      expect(KNOWN_TOKENS[wethAddress]).toBe('weth');
    });

    test('should have all addresses lowercase', () => {
      Object.keys(KNOWN_TOKENS).forEach((address) => {
        expect(address).toBe(address.toLowerCase());
      });
    });
  });
});
