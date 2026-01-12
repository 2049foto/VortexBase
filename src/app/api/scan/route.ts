/**
 * VORTEX PROTOCOL - SCAN API
 * Enterprise-grade wallet scanning endpoint
 */

import { NextRequest } from 'next/server';

import { scanWallet } from '@/lib/services/scanner';
import { assessMultipleTokensRisk } from '@/lib/services/risk';
import { createScan, completeScan, getOrCreateUser } from '@/lib/db/queries';
import { logger, createRequestContext } from '@/lib/logger';
import { checkScanRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import {
  successResponse,
  errorResponse,
  rateLimitResponse,
  validationErrorResponse,
  getCacheHeaders,
} from '@/lib/api/response';
import { scanRequestSchema, formatZodError } from '@/lib/validation';
import { CHAIN_IDS } from '@/lib/constants';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestContext = createRequestContext(request);

  logger.apiStart('GET', '/api/scan', requestContext);

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const parseResult = scanRequestSchema.safeParse({
      address: searchParams.get('address'),
      chainId: searchParams.get('chainId') ?? CHAIN_IDS.BASE,
    });

    if (!parseResult.success) {
      return validationErrorResponse(formatZodError(parseResult.error));
    }

    const { address, chainId } = parseResult.data;

    // Rate limiting
    const rateLimit = await checkScanRateLimit(address);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter ?? 60);
    }

    logger.info('Scan request validated', {
      ...requestContext,
      walletAddress: address,
      chainId,
    });

    // Get or create user
    const user = await getOrCreateUser({ walletAddress: address });

    // Create scan record
    const scan = await createScan({
      userId: user.id,
      walletAddress: address,
      chainId,
    });

    // Perform scan
    const scanResult = await scanWallet(address, chainId);

    // Assess risk for dust tokens (non-blocking)
    if (scanResult.dustTokens > 0) {
      const dustTokenAddresses = scanResult.tokens
        .filter((t) => t.isDust)
        .map((t) => ({ address: t.address, chainId }));

      // Fire and forget
      assessMultipleTokensRisk(dustTokenAddresses).catch((error) => {
        logger.warn('Background risk assessment failed', {
          scanId: scan.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    // Complete scan record
    await completeScan(scan.id, {
      totalTokens: scanResult.totalTokens,
      dustTokens: scanResult.dustTokens,
      totalValueUsd: scanResult.totalValueUsd,
      dustValueUsd: scanResult.dustValueUsd,
      consolidatableValueUsd: scanResult.consolidatableValueUsd,
      tokensData: { tokens: scanResult.tokens },
      scanDurationMs: scanResult.scanDurationMs,
      rpcProvider: scanResult.rpcProvider,
    });

    const duration = Math.round(performance.now() - startTime);

    logger.apiEnd('GET', '/api/scan', 200, duration, {
      ...requestContext,
      walletAddress: address,
      chainId,
      tokensFound: scanResult.totalTokens,
      dustTokens: scanResult.dustTokens,
    });

    return successResponse(scanResult, {
      headers: {
        ...getRateLimitHeaders(rateLimit),
        ...getCacheHeaders(30, 60), // Cache 30s, stale-while-revalidate 60s
      },
      meta: {
        requestId: requestContext.requestId,
        duration,
      },
    });
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiEnd('GET', '/api/scan', 500, duration, requestContext);
    return errorResponse(error, requestContext);
  }
}
