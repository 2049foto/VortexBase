/**
 * VORTEX PROTOCOL - LEADERBOARD API
 * Enterprise-grade leaderboard endpoint
 */

import { NextRequest } from 'next/server';

import { getLeaderboard, getUserRank, getUserByWallet } from '@/lib/db/queries';
import { getCachedLeaderboard, cacheLeaderboard } from '@/lib/services/cache';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  getCacheHeaders,
} from '@/lib/api/response';
import { leaderboardRequestSchema, formatZodError } from '@/lib/validation';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestContext = createRequestContext(request);

  logger.apiStart('GET', '/api/leaderboard', requestContext);

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const parseResult = leaderboardRequestSchema.safeParse({
      period: searchParams.get('period'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      address: searchParams.get('address'),
    });

    if (!parseResult.success) {
      return validationErrorResponse(formatZodError(parseResult.error));
    }

    const { period, page, limit, address } = parseResult.data;
    const offset = (page - 1) * limit;

    // Check cache for first page
    const cacheKey = `${period}:${limit}:${offset}`;
    let leaderboardData: { entries: unknown[]; total: number } | null = null;

    if (offset === 0 && limit <= 25) {
      leaderboardData = await getCachedLeaderboard<{
        entries: unknown[];
        total: number;
      }>(cacheKey);
    }

    // Fetch from database if not cached
    if (!leaderboardData) {
      const leaderboard = await getLeaderboard({ period, limit, offset });
      leaderboardData = {
        entries: leaderboard.entries,
        total: leaderboard.total,
      };

      // Cache first page
      if (offset === 0 && limit <= 25) {
        await cacheLeaderboard(cacheKey, leaderboardData);
      }
    }

    // Get user rank if address provided
    let userRank: number | null = null;
    if (address) {
      const user = await getUserByWallet(address);
      if (user) {
        userRank = await getUserRank(user.id, period);
      }
    }

    const duration = Math.round(performance.now() - startTime);

    logger.apiEnd('GET', '/api/leaderboard', 200, duration, {
      ...requestContext,
      period,
      entriesCount: leaderboardData.entries.length,
    });

    return successResponse(
      {
        entries: leaderboardData.entries,
        total: leaderboardData.total,
        userRank,
        pagination: {
          page,
          limit,
          total: leaderboardData.total,
          hasMore: offset + limit < leaderboardData.total,
        },
      },
      {
        headers: getCacheHeaders(60, 120), // Cache 1 min, stale 2 min
        meta: {
          requestId: requestContext.requestId,
          duration,
          cached: !!leaderboardData,
        },
      }
    );
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiEnd('GET', '/api/leaderboard', 500, duration, requestContext);
    return errorResponse(error, requestContext);
  }
}
