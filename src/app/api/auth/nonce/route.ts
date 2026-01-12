/**
 * VORTEX PROTOCOL - AUTH NONCE API
 * Request authentication nonce
 */

import { NextRequest } from 'next/server';

import { requestWalletAuth } from '@/lib/services/auth';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  getNoCacheHeaders,
} from '@/lib/api/response';
import { ethereumAddressSchema } from '@/lib/validation';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    const body = await request.json();
    const addressResult = ethereumAddressSchema.safeParse(body.address);

    if (!addressResult.success) {
      return validationErrorResponse('Invalid wallet address');
    }

    const { nonce, message } = await requestWalletAuth(addressResult.data);

    logger.info('Auth nonce generated', {
      ...requestContext,
      walletAddress: addressResult.data,
    });

    return successResponse(
      { nonce, message },
      { headers: getNoCacheHeaders() }
    );
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}
