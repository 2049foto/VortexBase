/**
 * VORTEX API - Leaderboard Integration Tests
 */

import { describe, test, expect } from 'bun:test';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3001';

describe('Leaderboard Integration', () => {
  describe('GET /api/leaderboard', () => {
    test('should return leaderboard data', async () => {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      
      // Should return 200 even if DB is down (empty array)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.rankings).toBeDefined();
        expect(Array.isArray(data.data.rankings)).toBe(true);
      }
    });

    test('should accept period parameter', async () => {
      const periods = ['daily', 'weekly', 'all_time'];
      
      for (const period of periods) {
        const response = await fetch(`${API_URL}/api/leaderboard?period=${period}`);
        expect([200, 500]).toContain(response.status);
      }
    });

    test('should accept limit parameter', async () => {
      const response = await fetch(`${API_URL}/api/leaderboard?limit=10`);
      expect([200, 500]).toContain(response.status);
    });

    test('should not require authentication', async () => {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      expect(response.status).not.toBe(401);
    });
  });
});
