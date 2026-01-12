/**
 * VORTEX API - Swap Service Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import { ONEINCH_CONFIG, validateSlippage } from '../services/swap';
import { MAX_SLIPPAGE } from '../env';

describe('Swap Service', () => {
  describe('ONEINCH_CONFIG', () => {
    test('should use Base chain ID', () => {
      expect(ONEINCH_CONFIG.CHAIN_ID).toBe(8453);
    });

    test('should have correct API version', () => {
      expect(ONEINCH_CONFIG.API_VERSION).toBe('v6.0');
    });

    test('should have correct timeout', () => {
      expect(ONEINCH_CONFIG.TIMEOUT_MS).toBe(10000);
    });

    test('should have correct retry settings', () => {
      expect(ONEINCH_CONFIG.MAX_RETRIES).toBe(3);
      expect(ONEINCH_CONFIG.RETRY_DELAY_MS).toBe(500);
    });
  });

  describe('validateSlippage', () => {
    test('should accept valid slippage 0.5%', () => {
      expect(validateSlippage(0.005)).toBe(true);
    });

    test('should accept valid slippage 1%', () => {
      expect(validateSlippage(0.01)).toBe(true);
    });

    test('should accept max slippage 2%', () => {
      expect(validateSlippage(MAX_SLIPPAGE)).toBe(true);
    });

    test('should reject slippage above max', () => {
      expect(validateSlippage(0.03)).toBe(false);
    });

    test('should reject negative slippage', () => {
      expect(validateSlippage(-0.01)).toBe(false);
    });

    test('should reject zero slippage', () => {
      expect(validateSlippage(0)).toBe(false);
    });
  });
});
