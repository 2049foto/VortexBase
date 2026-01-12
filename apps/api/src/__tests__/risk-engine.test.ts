/**
 * VORTEX API - Risk Engine Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import {
  classifyRisk,
  RISK_THRESHOLDS,
  SAFE_TOKENS,
  type RiskClassification,
} from '../services/risk-engine';

describe('Risk Engine Service', () => {
  describe('RISK_THRESHOLDS', () => {
    test('should have correct threshold values', () => {
      expect(RISK_THRESHOLDS.SAFE).toBe(20);
      expect(RISK_THRESHOLDS.MEDIUM).toBe(70);
    });
  });

  describe('SAFE_TOKENS', () => {
    test('should include USDC', () => {
      const usdcAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
      expect(SAFE_TOKENS.has(usdcAddress)).toBe(true);
    });

    test('should include WETH', () => {
      const wethAddress = '0x4200000000000000000000000000000000000006';
      expect(SAFE_TOKENS.has(wethAddress)).toBe(true);
    });

    test('should have all addresses lowercase', () => {
      SAFE_TOKENS.forEach((address) => {
        expect(address).toBe(address.toLowerCase());
      });
    });
  });

  describe('classifyRisk', () => {
    test('should classify score 0 as safe', () => {
      const result = classifyRisk(0);
      expect(result).toBe('safe');
    });

    test('should classify score 19 as safe', () => {
      const result = classifyRisk(19);
      expect(result).toBe('safe');
    });

    test('should classify score 20 as medium', () => {
      const result = classifyRisk(20);
      expect(result).toBe('medium');
    });

    test('should classify score 50 as medium', () => {
      const result = classifyRisk(50);
      expect(result).toBe('medium');
    });

    test('should classify score 70 as high', () => {
      const result = classifyRisk(70);
      expect(result).toBe('high');
    });

    test('should classify score 100 as high', () => {
      const result = classifyRisk(100);
      expect(result).toBe('high');
    });
  });
});
