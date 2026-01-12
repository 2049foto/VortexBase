/**
 * VORTEX API - Auth Routes
 */

import { Elysia, t } from 'elysia';

import { requestNonce, verifyWalletSignature, refreshTokens } from '../services/auth';
import { createRateLimiter } from '../middleware/rate-limit';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(createRateLimiter('auth'))

  // GET /api/auth/nonce - Request a nonce for wallet authentication
  .get(
    '/nonce',
    async ({ query }) => {
      const result = await requestNonce(query.wallet);

      return {
        success: true,
        data: result,
      };
    },
    {
      query: t.Object({
        wallet: t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
      }),
    }
  )

  // POST /api/auth/verify - Verify signature and get tokens
  .post(
    '/verify',
    async ({ body }) => {
      const tokens = await verifyWalletSignature(
        body.wallet,
        body.message,
        body.signature,
        body.fid
      );

      return {
        success: true,
        data: tokens,
      };
    },
    {
      body: t.Object({
        wallet: t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
        message: t.String({ minLength: 1 }),
        signature: t.String({ pattern: '^0x[a-fA-F0-9]+$' }),
        fid: t.Optional(t.Number()),
      }),
    }
  )

  // POST /api/auth/refresh - Refresh access token
  .post(
    '/refresh',
    async ({ body }) => {
      const tokens = await refreshTokens(body.refreshToken);

      return {
        success: true,
        data: tokens,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String({ minLength: 1 }),
      }),
    }
  );
