/**
 * VORTEX PROTOCOL - CONSOLIDATE API
 * Enterprise-grade consolidation transaction builder
 */

import { NextRequest } from 'next/server';

import { buildConsolidationTransaction } from '@/lib/services/swap';
import { getNativeTokenPrice } from '@/lib/services/price';
import { createConsolidation, getOrCreateUser } from '@/lib/db/queries';
import { logger, createRequestContext } from '@/lib/logger';
import { checkSwapRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import {
  successResponse,
  errorResponse,
  rateLimitResponse,
  validationErrorResponse,
  getNoCacheHeaders,
} from '@/lib/api/response';
import { consolidateRequestSchema, formatZodError } from '@/lib/validation';
import { BASE_TOKENS } from '@/lib/constants';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestContext = createRequestContext(request);

  logger.apiStart('POST', '/api/consolidate', requestContext);

  try {
    // Parse request body
    const body = await request.json();
    const parseResult = consolidateRequestSchema.safeParse({
      ...body,
      outputToken: body.outputToken ?? BASE_TOKENS.USDC,
    });

    if (!parseResult.success) {
      return validationErrorResponse(formatZodError(parseResult.error));
    }

    const { address, chainId, tokens, outputToken, slippage } = parseResult.data;

    // Rate limiting
    const rateLimit = await checkSwapRateLimit(address);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter ?? 60);
    }

    logger.info('Consolidate request validated', {
      ...requestContext,
      walletAddress: address,
      chainId,
      tokensCount: tokens.length,
      outputToken,
      slippage,
    });

    // Get user
    const user = await getOrCreateUser({ walletAddress: address });

    // Build consolidation transaction
    const consolidation = await buildConsolidationTransaction({
      chainId,
      tokensIn: tokens,
      tokenOutAddress: outputToken,
      fromAddress: address,
      slippage,
    });

    // Calculate gas estimate in USD
    const ethPrice = await getNativeTokenPrice(chainId);
    const estimatedGasWei = BigInt(consolidation.estimatedGasTotal);
    const gasEstimateUsd = (Number(estimatedGasWei) / 1e18) * ethPrice;

    // Create consolidation record
    const dbConsolidation = await createConsolidation({
      userId: user.id,
      chainId,
      walletAddress: address,
      tokensIn: tokens.map((t) => t.address),
      tokensInSymbols: consolidation.tokensIn.map((t) => t.symbol),
      amountsIn: tokens.map((t) => t.amount),
      valuesInUsd: consolidation.tokensIn.map((t) => String(t.valueUsd)),
      totalValueInUsd: String(consolidation.totalInputValueUsd),
      tokenOut: outputToken,
      tokenOutSymbol: consolidation.tokenOut.symbol,
      slippage: String(slippage),
      priceImpact: String(consolidation.priceImpact),
      gasEstimateWei: consolidation.estimatedGasTotal,
      gasEstimateUsd: String(gasEstimateUsd),
      protocolFeeUsd: String(consolidation.protocolFeeUsd),
      referrerId: user.referredBy ?? undefined,
      status: 'pending',
    });

    const duration = Math.round(performance.now() - startTime);

    logger.transaction('consolidation_created', dbConsolidation.id, {
      ...requestContext,
      walletAddress: address,
      chainId,
      tokensCount: tokens.length,
      totalValueUsd: consolidation.totalInputValueUsd,
    });

    logger.apiEnd('POST', '/api/consolidate', 200, duration, requestContext);

    return successResponse(
      {
        consolidationId: dbConsolidation.id,
        tokensIn: consolidation.tokensIn,
        tokenOut: consolidation.tokenOut,
        totalInputValueUsd: consolidation.totalInputValueUsd,
        expectedOutputValueUsd: consolidation.totalOutputValueUsd,
        priceImpact: consolidation.priceImpact,
        gasEstimateUsd,
        protocolFeeUsd: consolidation.protocolFeeUsd,
        swaps: consolidation.swaps.map((swap) => ({
          from: swap.quote.fromToken,
          to: swap.quote.toToken,
          expectedOutput: swap.quote.toAmount,
          transaction: swap.tx,
        })),
      },
      {
        headers: {
          ...getRateLimitHeaders(rateLimit),
          ...getNoCacheHeaders(),
        },
        meta: {
          requestId: requestContext.requestId,
          duration,
        },
      }
    );
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiEnd('POST', '/api/consolidate', 500, duration, requestContext);
    return errorResponse(error, requestContext);
  }
}
