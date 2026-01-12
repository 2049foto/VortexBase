/**
 * VORTEX API - Auth Service
 * JWT + Wallet Nonce Authentication
 */

import * as jose from 'jose';
import { verifyMessage } from 'viem';
import { nanoid } from 'nanoid';

import { env } from '../env';
import { createNonce, verifyNonce, getOrCreateUser, logAudit } from '../db/queries';
import { AuthError } from '../middleware/error-handler';
import { log } from '../middleware/logger';

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const JWT_ISSUER = 'vortex-api';
const JWT_AUDIENCE = 'vortex-app';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ============================================
// NONCE GENERATION
// ============================================

export function generateNonceMessage(wallet: string, nonce: string): string {
  return `Welcome to Vortex Protocol!

Sign this message to authenticate your wallet.

Wallet: ${wallet}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}

export async function requestNonce(wallet: string): Promise<{
  nonce: string;
  message: string;
  expiresAt: number;
}> {
  const nonce = `vortex_${Date.now()}_${nanoid(16)}`;
  const expiresAt = Date.now() + env.WALLET_NONCE_TTL * 1000;

  await createNonce(wallet, nonce, env.WALLET_NONCE_TTL);

  const message = generateNonceMessage(wallet, nonce);

  log.info({ wallet }, 'Nonce generated');

  return {
    nonce,
    message,
    expiresAt,
  };
}

// ============================================
// SIGNATURE VERIFICATION
// ============================================

export async function verifyWalletSignature(
  wallet: string,
  message: string,
  signature: string,
  fid?: number
): Promise<AuthTokens> {
  // Extract nonce from message
  const nonceMatch = message.match(/Nonce: (vortex_\d+_[\w-]+)/);
  if (!nonceMatch) {
    throw new AuthError('Invalid message format');
  }

  const nonce = nonceMatch[1];

  // Verify nonce exists and not expired
  const nonceValid = await verifyNonce(wallet, nonce);
  if (!nonceValid) {
    throw new AuthError('Invalid or expired nonce');
  }

  // Verify signature
  try {
    const isValid = await verifyMessage({
      address: wallet as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      throw new AuthError('Invalid signature');
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Signature verification failed');
  }

  // Get or create user
  const user = await getOrCreateUser(wallet, fid);

  // Generate tokens
  const tokens = await generateTokens(user.id, wallet, fid);

  await logAudit('auth_success', { wallet, fid }, user.id);
  log.info({ wallet, userId: user.id }, 'Auth successful');

  return tokens;
}

// ============================================
// TOKEN GENERATION
// ============================================

export async function generateTokens(
  userId: string,
  wallet: string,
  fid?: number
): Promise<AuthTokens> {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiry = now + 60 * 60; // 1 hour

  const accessToken = await new jose.SignJWT({
    sub: userId,
    wallet,
    fid,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  const refreshToken = await new jose.SignJWT({
    sub: userId,
    wallet,
    fid,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return {
    accessToken,
    refreshToken,
    expiresAt: accessExpiry * 1000,
  };
}

// ============================================
// TOKEN VALIDATION
// ============================================

export interface ValidatedToken {
  userId: string;
  wallet: string;
  fid?: number;
}

export async function validateJWT(token: string): Promise<ValidatedToken | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.type !== 'access') {
      return null;
    }

    return {
      userId: payload.sub as string,
      wallet: payload.wallet as string,
      fid: payload.fid as number | undefined,
    };
  } catch {
    return null;
  }
}

// ============================================
// TOKEN REFRESH
// ============================================

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  try {
    const { payload } = await jose.jwtVerify(refreshToken, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.type !== 'refresh') {
      throw new AuthError('Invalid token type');
    }

    return generateTokens(
      payload.sub as string,
      payload.wallet as string,
      payload.fid as number | undefined
    );
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Invalid refresh token');
  }
}
