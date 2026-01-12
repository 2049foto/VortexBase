/**
 * VORTEX PROTOCOL - AUTH REFRESH API
 * Refresh access token
 */

import { NextRequest } from 'next/server';

import { refreshTokens } from '@/lib/services/auth';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  getNoCacheHeaders,
} from '@/lib/api/response';
import { AuthenticationError } from '@/lib/errors';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    // Get refresh token from cookie or body
    const refreshToken =
      request.cookies.get('vortex_refresh')?.value ||
      (await request.json().catch(() => ({}))).refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    const tokens = await refreshTokens(refreshToken);

    logger.info('Token refreshed', requestContext);

    return successResponse(
      { accessToken: tokens.accessToken, expiresAt: tokens.expiresAt },
      {
        headers: {
          ...getNoCacheHeaders(),
          'Set-Cookie': `vortex_refresh=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
        },
      }
    );
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}
