/**
 * VORTEX API - Auth Middleware
 */

import { Elysia } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import * as jose from 'jose';

import { env } from '../env';
import { AuthError } from './error-handler';

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenPayload {
  sub: string; // User ID
  wallet: string;
  fid?: number;
}

export interface AuthUser {
  id: string;
  wallet: string;
  fid?: number;
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: 'vortex-api',
      audience: 'vortex-app',
    });

    return {
      sub: payload.sub as string,
      wallet: payload.wallet as string,
      fid: payload.fid as number | undefined,
    };
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

export const authMiddleware = new Elysia({ name: 'auth' })
  .use(bearer())
  .derive(async ({ bearer }): Promise<{ user: AuthUser }> => {
    if (!bearer) {
      throw new AuthError('No token provided');
    }

    const payload = await verifyToken(bearer);

    return {
      user: {
        id: payload.sub,
        wallet: payload.wallet,
        fid: payload.fid,
      },
    };
  });

// Optional auth - doesn't throw if no token
export const optionalAuth = new Elysia({ name: 'optional-auth' })
  .use(bearer())
  .derive(async ({ bearer }): Promise<{ user: AuthUser | null }> => {
    if (!bearer) {
      return { user: null };
    }

    try {
      const payload = await verifyToken(bearer);
      return {
        user: {
          id: payload.sub,
          wallet: payload.wallet,
          fid: payload.fid,
        },
      };
    } catch {
      return { user: null };
    }
  });
