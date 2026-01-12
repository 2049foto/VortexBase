/**
 * VORTEX PROTOCOL - AUTHENTICATION SERVICE
 * Farcaster + Wallet authentication
 */

import { createPublicClient, http, verifyMessage } from 'viem';
import { base } from 'viem/chains';
import * as jose from 'jose';

import { logger, createLogger } from '@/lib/logger';
import { AuthenticationError, ErrorCodes } from '@/lib/errors';
import { getUserByWallet, getUserByFarcasterFid, setUserNonce, clearUserNonce, getOrCreateUser } from '@/lib/db/queries';
import type { User } from '@/lib/db/schema';

const authLogger = createLogger('auth');

// ============================================
// JWT CONFIGURATION
// ============================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vortex-jwt-secret-change-in-production'
);
const JWT_ISSUER = 'vortex-protocol';
const JWT_AUDIENCE = 'vortex-app';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ============================================
// TOKEN TYPES
// ============================================

export interface TokenPayload {
  sub: string; // User ID
  wallet: string;
  fid?: number;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthSession {
  user: Pick<User, 'id' | 'walletAddress' | 'farcasterFid' | 'displayName' | 'avatarUrl'>;
  tokens: AuthTokens;
}

// ============================================
// NONCE GENERATION
// ============================================

export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSignMessage(nonce: string, address: string): string {
  return `Welcome to Vortex Protocol!

Sign this message to authenticate your wallet.

Wallet: ${address}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

export async function generateTokens(user: User): Promise<AuthTokens> {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiry = now + 15 * 60; // 15 minutes

  const accessToken = await new jose.SignJWT({
    sub: user.id,
    wallet: user.walletAddress,
    fid: user.farcasterFid,
    type: 'access',
  } as TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  const refreshToken = await new jose.SignJWT({
    sub: user.id,
    wallet: user.walletAddress,
    fid: user.farcasterFid,
    type: 'refresh',
  } as TokenPayload)
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

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as unknown as TokenPayload;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new AuthenticationError('Token expired', { code: ErrorCodes.SESSION_EXPIRED });
    }
    throw new AuthenticationError('Invalid token', { code: ErrorCodes.INVALID_TOKEN });
  }
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const payload = await verifyToken(refreshToken);

  if (payload.type !== 'refresh') {
    throw new AuthenticationError('Invalid token type');
  }

  const user = await getUserByWallet(payload.wallet);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return generateTokens(user);
}

// ============================================
// WALLET AUTHENTICATION
// ============================================

export async function requestWalletAuth(walletAddress: string): Promise<{
  nonce: string;
  message: string;
}> {
  const normalizedAddress = walletAddress.toLowerCase();
  const nonce = generateNonce();
  const message = generateSignMessage(nonce, normalizedAddress);

  // Get or create user and save nonce
  const user = await getOrCreateUser({ walletAddress: normalizedAddress });
  await setUserNonce(user.id, nonce);

  authLogger.info('Wallet auth requested', { walletAddress: normalizedAddress });

  return { nonce, message };
}

export async function verifyWalletAuth(
  walletAddress: string,
  signature: string
): Promise<AuthSession> {
  const normalizedAddress = walletAddress.toLowerCase() as `0x${string}`;

  // Get user and verify nonce exists
  const user = await getUserByWallet(normalizedAddress);
  if (!user || !user.nonce) {
    throw new AuthenticationError('Authentication not initiated');
  }

  // Check nonce expiry
  if (user.nonceExpiresAt && user.nonceExpiresAt < new Date()) {
    await clearUserNonce(user.id);
    throw new AuthenticationError('Nonce expired');
  }

  // Verify signature
  const message = generateSignMessage(user.nonce, normalizedAddress);

  try {
    const isValid = await verifyMessage({
      address: normalizedAddress,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      throw new AuthenticationError('Invalid signature');
    }
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Signature verification failed');
  }

  // Clear nonce after successful verification
  await clearUserNonce(user.id);

  // Generate tokens
  const tokens = await generateTokens(user);

  authLogger.info('Wallet auth successful', { walletAddress: normalizedAddress, userId: user.id });

  return {
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      farcasterFid: user.farcasterFid,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    tokens,
  };
}

// ============================================
// FARCASTER AUTHENTICATION
// ============================================

export async function verifyFarcasterAuth(
  fid: number,
  signature: string,
  message: string
): Promise<AuthSession> {
  // Verify with Farcaster Hub
  const hubUrl = process.env.NEXT_PUBLIC_FARCASTER_HUB_URL || 'https://nemes.farcaster.xyz:2281';

  try {
    const response = await fetch(`${hubUrl}/v1/validateMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(message, 'hex'),
    });

    if (!response.ok) {
      throw new AuthenticationError('Farcaster verification failed');
    }

    // Get or create user
    let user = await getUserByFarcasterFid(fid);
    
    if (!user) {
      // Fetch Farcaster profile
      const profileResponse = await fetch(`${hubUrl}/v1/userDataByFid?fid=${fid}`);
      const profileData = await profileResponse.json();
      
      // This would need a wallet address from Farcaster custody address
      // For now, we require wallet connection first
      throw new AuthenticationError('Please connect wallet first');
    }

    const tokens = await generateTokens(user);

    authLogger.info('Farcaster auth successful', { fid, userId: user.id });

    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        farcasterFid: user.farcasterFid,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Farcaster authentication failed');
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function getSessionFromToken(token: string): Promise<AuthSession | null> {
  try {
    const payload = await verifyToken(token);
    
    if (payload.type !== 'access') {
      return null;
    }

    const user = await getUserByWallet(payload.wallet);
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        farcasterFid: user.farcasterFid,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      tokens: {
        accessToken: token,
        refreshToken: '', // Not included in session
        expiresAt: 0,
      },
    };
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
}
