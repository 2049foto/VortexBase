/**
 * VORTEX API - Auth Service Unit Tests
 */

import { describe, test, expect, beforeAll, mock } from 'bun:test';
import { generateNonceMessage, validateJWT } from '../services/auth';

describe('Auth Service', () => {
  describe('generateNonceMessage', () => {
    test('should generate valid nonce message with wallet address', () => {
      const wallet = '0x1234567890abcdef1234567890abcdef12345678';
      const nonce = 'vortex_1234567890_abcdef123456';

      const message = generateNonceMessage(wallet, nonce);

      expect(message).toContain('Welcome to Vortex Protocol!');
      expect(message).toContain(wallet);
      expect(message).toContain(nonce);
      expect(message).toContain('Timestamp:');
    });

    test('should include security notice', () => {
      const wallet = '0x1234567890abcdef1234567890abcdef12345678';
      const nonce = 'test_nonce';

      const message = generateNonceMessage(wallet, nonce);

      expect(message).toContain('not trigger a blockchain transaction');
      expect(message).toContain('cost any gas fees');
    });
  });

  describe('validateJWT', () => {
    test('should return null for invalid token', async () => {
      const result = await validateJWT('invalid-token');
      expect(result).toBeNull();
    });

    test('should return null for empty token', async () => {
      const result = await validateJWT('');
      expect(result).toBeNull();
    });

    test('should return null for malformed JWT', async () => {
      const result = await validateJWT('not.a.valid.jwt.token');
      expect(result).toBeNull();
    });
  });
});
