/**
 * VORTEX PROTOCOL - HEALTH CHECK API
 * System health monitoring endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/services/cache';
import { getBlockNumber } from '@/lib/services/rpc';
import { CHAIN_IDS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
    cache: ServiceCheck;
    rpc: ServiceCheck;
  };
}

interface ServiceCheck {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    await db.execute('SELECT 1');
    return {
      status: 'up',
      latency: Math.round(performance.now() - start),
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkCache(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const testKey = 'health:test';
    await cacheSet(testKey, Date.now(), 60);
    await cacheGet(testKey);
    return {
      status: 'up',
      latency: Math.round(performance.now() - start),
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRpc(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    await getBlockNumber(CHAIN_IDS.BASE);
    return {
      status: 'up',
      latency: Math.round(performance.now() - start),
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  const verbose = request.nextUrl.searchParams.get('verbose') === 'true';

  try {
    // Run health checks in parallel
    const [database, cache, rpc] = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkRpc(),
    ]);

    const checks = { database, cache, rpc };
    const allUp = Object.values(checks).every((c) => c.status === 'up');
    const anyDown = Object.values(checks).some((c) => c.status === 'down');

    const health: HealthStatus = {
      status: allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000),
      checks,
    };

    // Log if unhealthy
    if (health.status !== 'healthy') {
      logger.warn('Health check degraded', { health });
    }

    // Return minimal response unless verbose
    const response = verbose
      ? health
      : {
          status: health.status,
          timestamp: health.timestamp,
        };

    return NextResponse.json(response, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error(
      'Health check failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
