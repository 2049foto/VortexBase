/**
 * VORTEX API - Environment Config Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import { CHAIN_ID, CHAIN_NAME, CONTRACTS, PROTOCOL_FEE, DUST_THRESHOLD_USD, MAX_SLIPPAGE, RPC_URLS } from '../env';

describe('Environment Configuration', () => {
  describe('Chain Constants', () => {
    test('should use Base mainnet chain ID', () => {
      expect(CHAIN_ID).toBe(8453);
    });

    test('should have correct chain name', () => {
      expect(CHAIN_NAME).toBe('Base');
    });
  });

  describe('Contract Addresses', () => {
    test('should have valid EntryPoint v0.7 address', () => {
      expect(CONTRACTS.ENTRYPOINT).toBe('0x0000000071727De22De5D61971EFF52E27Baf08d');
      expect(CONTRACTS.ENTRYPOINT).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('should have valid USDC address', () => {
      expect(CONTRACTS.USDC).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(CONTRACTS.USDC).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('should have valid WETH address', () => {
      expect(CONTRACTS.WETH).toBe('0x4200000000000000000000000000000000000006');
      expect(CONTRACTS.WETH).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('Protocol Constants', () => {
    test('should have correct protocol fee (0.8%)', () => {
      expect(PROTOCOL_FEE).toBe(0.008);
    });

    test('should have correct dust threshold ($10)', () => {
      expect(DUST_THRESHOLD_USD).toBe(10);
    });

    test('should have correct max slippage (2%)', () => {
      expect(MAX_SLIPPAGE).toBe(0.02);
    });
  });

  describe('RPC URLs', () => {
    test('should have primary RPC URL', () => {
      expect(RPC_URLS.PRIMARY).toBeDefined();
      expect(RPC_URLS.PRIMARY).toContain('alchemy.com');
    });

    test('should have fallback RPC URL', () => {
      expect(RPC_URLS.FALLBACK_2).toBeDefined();
    });
  });
});
