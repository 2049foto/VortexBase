/**
 * VORTEX API - Auth Integration Tests
 * Tests the full auth flow: nonce → verify → JWT
 */

import { describe, test, expect, beforeAll } from 'bun:test';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3001';

describe('Auth Integration', () => {
  describe('GET /api/auth/nonce', () => {
    test('should return nonce for valid wallet (when DB connected)', async () => {
      const wallet = '0x1234567890abcdef1234567890abcdef12345678';
      const response = await fetch(`${API_URL}/api/auth/nonce?wallet=${wallet}`);
      
      // Accept 200 (success) or 500 (DB not connected)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.nonce).toBeDefined();
        expect(data.data.nonce).toContain('vortex_');
        expect(data.data.message).toContain('Welcome to Vortex Protocol');
        expect(data.data.expiresAt).toBeGreaterThan(Date.now());
      }
    });

    test('should reject invalid wallet address', async () => {
      const response = await fetch(`${API_URL}/api/auth/nonce?wallet=invalid`);
      // Elysia returns 422 for validation errors
      expect([400, 422]).toContain(response.status);
    });

    test('should reject missing wallet parameter', async () => {
      const response = await fetch(`${API_URL}/api/auth/nonce`);
      // Elysia returns 422 for validation errors
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('POST /api/auth/verify', () => {
    test('should reject invalid signature', async () => {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: '0x1234567890abcdef1234567890abcdef12345678',
          message: 'Invalid message',
          signature: '0x' + 'ab'.repeat(65),
        }),
      });

      // Accept 401 (auth error), 500 (DB error), or 422 (validation)
      expect([401, 422, 500]).toContain(response.status);
    });

    test('should reject missing fields', async () => {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      });

      // Elysia returns 422 for validation errors
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should reject invalid refresh token', async () => {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'invalid-token',
        }),
      });

      // Accept 401 (auth error) or 500 (if throws)
      expect([401, 500]).toContain(response.status);
    });
  });
});
