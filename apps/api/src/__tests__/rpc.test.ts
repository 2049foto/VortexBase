/**
 * VORTEX API - RPC Service Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import { getClient, RPC_CONFIG } from '../services/rpc';
import { CHAIN_ID } from '../env';

describe('RPC Service', () => {
  describe('RPC_CONFIG', () => {
    test('should have correct timeout', () => {
      expect(RPC_CONFIG.TIMEOUT_MS).toBe(5000);
    });

    test('should have correct retry settings', () => {
      expect(RPC_CONFIG.MAX_RETRIES).toBe(3);
      expect(RPC_CONFIG.RETRY_DELAY_MS).toBe(1000);
    });
  });

  describe('getClient', () => {
    test('should return a viem client', () => {
      const client = getClient();
      expect(client).toBeDefined();
      expect(client.chain?.id).toBe(CHAIN_ID);
    });

    test('should use Base mainnet chain', () => {
      const client = getClient();
      expect(client.chain?.name).toBe('Base');
    });
  });
});
