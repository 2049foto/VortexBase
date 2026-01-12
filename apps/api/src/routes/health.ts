/**
 * VORTEX API - Health Check Routes
 */

import { Elysia } from 'elysia';
import { sql } from 'drizzle-orm';

import { db } from '../db/client';
import { redis } from '../services/cache';
import { getBlockNumber } from '../services/rpc';

export const healthRoutes = new Elysia({ prefix: '/api' })
  .get('/health', async ({ set }) => {
    const startTime = performance.now();
    const checks: Record<string, { status: boolean; latency?: number; error?: string }> = {
      database: { status: false },
      redis: { status: false },
      rpc: { status: false },
    };

    // Check database
    try {
      const dbStart = performance.now();
      await db.execute(sql`SELECT 1`);
      checks.database = {
        status: true,
        latency: Math.round(performance.now() - dbStart),
      };
    } catch (error) {
      checks.database = {
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check Redis
    try {
      const redisStart = performance.now();
      await redis.ping();
      checks.redis = {
        status: true,
        latency: Math.round(performance.now() - redisStart),
      };
    } catch (error) {
      checks.redis = {
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check RPC
    try {
      const rpcStart = performance.now();
      const blockNumber = await getBlockNumber();
      checks.rpc = {
        status: true,
        latency: Math.round(performance.now() - rpcStart),
      };
    } catch (error) {
      checks.rpc = {
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const allHealthy = Object.values(checks).every((c) => c.status);
    const totalLatency = Math.round(performance.now() - startTime);

    // Set appropriate HTTP status
    if (!allHealthy) {
      set.status = 503;
    }

    return {
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        chain: 'base',
        chainId: 8453,
        uptime: process.uptime(),
        totalLatency: `${totalLatency}ms`,
        checks,
      },
    };
  });
