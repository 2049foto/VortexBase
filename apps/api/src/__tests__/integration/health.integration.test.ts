/**
 * VORTEX API - Health Integration Tests
 */

import { describe, test, expect } from 'bun:test';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3001';

describe('Health Integration', () => {
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      
      // Accept 200 (healthy) or 503 (degraded with some services down)
      expect([200, 503]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.status).toBeDefined();
      expect(['healthy', 'degraded']).toContain(data.data.status);
      
      // Check structure
      expect(data.data.checks).toBeDefined();
      expect(data.data.checks.database).toBeDefined();
      expect(data.data.checks.redis).toBeDefined();
      expect(data.data.checks.rpc).toBeDefined();
      
      // Chain info
      expect(data.data.chain).toBe('base');
      expect(data.data.chainId).toBe(8453);
    });

    test('should return correct content type', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('should include version info', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      
      expect(data.data.version).toBeDefined();
      expect(data.data.uptime).toBeDefined();
      expect(data.data.timestamp).toBeDefined();
    });
  });
});
