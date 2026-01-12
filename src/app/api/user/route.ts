/**
 * VORTEX PROTOCOL - USER API
 * Enterprise-grade user profile endpoint
 */

import { NextRequest } from 'next/server';

import {
  getUserByWallet,
  getUserRank,
  getScansByUserId,
  getConsolidationsByUserId,
} from '@/lib/db/queries';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  getCacheHeaders,
} from '@/lib/api/response';
import { userRequestSchema, formatZodError } from '@/lib/validation';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestContext = createRequestContext(request);

  logger.apiStart('GET', '/api/user', requestContext);

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const parseResult = userRequestSchema.safeParse({
      address: searchParams.get('address'),
      includeHistory: searchParams.get('includeHistory'),
    });

    if (!parseResult.success) {
      return validationErrorResponse(formatZodError(parseResult.error));
    }

    const { address, includeHistory } = parseResult.data;

    // Get user
    const user = await getUserByWallet(address);

    if (!user) {
      return notFoundResponse('User');
    }

    // Get user's rank (parallel)
    const [weeklyRank, monthlyRank, allTimeRank] = await Promise.all([
      getUserRank(user.id, 'weekly'),
      getUserRank(user.id, 'monthly'),
      getUserRank(user.id, 'all_time'),
    ]);

    // Get history if requested
    let history: { scans: unknown[]; consolidations: unknown[] } | undefined;

    if (includeHistory) {
      const [scansResult, consolidationsResult] = await Promise.all([
        getScansByUserId(user.id, { limit: 10 }),
        getConsolidationsByUserId(user.id, { limit: 10 }),
      ]);
      history = {
        scans: scansResult.scans,
        consolidations: consolidationsResult.consolidations,
      };
    }

    const duration = Math.round(performance.now() - startTime);

    logger.apiEnd('GET', '/api/user', 200, duration, {
      ...requestContext,
      userId: user.id,
    });

    return successResponse(
      {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          farcasterFid: user.farcasterFid,
          farcasterUsername: user.farcasterUsername,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          totalXp: user.totalXp,
          weeklyXp: user.weeklyXp,
          monthlyXp: user.monthlyXp,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          totalScans: user.totalScans,
          totalConsolidations: user.totalConsolidations,
          totalTokensConsolidated: user.totalTokensConsolidated,
          totalValueConsolidatedUsd: user.totalValueConsolidatedUsd,
          totalGasSavedUsd: user.totalGasSavedUsd,
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          referralEarningsUsd: user.referralEarningsUsd,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
        },
        ranks: {
          weekly: weeklyRank,
          monthly: monthlyRank,
          allTime: allTimeRank,
        },
        ...(history && { history }),
      },
      {
        headers: getCacheHeaders(60, 120),
        meta: {
          requestId: requestContext.requestId,
          duration,
        },
      }
    );
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiEnd('GET', '/api/user', 500, duration, requestContext);
    return errorResponse(error, requestContext);
  }
}
