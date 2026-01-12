/**
 * VORTEX PROTOCOL - AUTH VERIFY API
 * Verify wallet signature and issue tokens
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { verifyWalletAuth } from '@/lib/services/auth';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  getNoCacheHeaders,
} from '@/lib/api/response';
import { ethereumAddressSchema, formatZodError } from '@/lib/validation';

export const runtime = 'edge';

const verifySchema = z.object({
  address: ethereumAddressSchema,
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format'),
});

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    const body = await request.json();
    const parseResult = verifySchema.safeParse(body);

    if (!parseResult.success) {
      return validationErrorResponse(formatZodError(parseResult.error));
    }

    const { address, signature } = parseResult.data;
    const session = await verifyWalletAuth(address, signature);

    logger.info('Auth verification successful', {
      ...requestContext,
      walletAddress: address,
      userId: session.user.id,
    });

    return successResponse(session, {
      headers: {
        ...getNoCacheHeaders(),
        'Set-Cookie': `vortex_refresh=${session.tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
      },
    });
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}
