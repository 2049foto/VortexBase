/**
 * VORTEX PROTOCOL - API MIDDLEWARE
 * Security, validation, and common middleware
 */

import { NextRequest, NextResponse } from 'next/server';

import { validateRateLimit } from '@/lib/rate-limit';
import { rateLimitResponse } from './response';
import { logger, type RequestContext } from '@/lib/logger';

// ============================================
// CORS MIDDLEWARE
// ============================================

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://warpcast.com',
  'https://www.warpcast.com',
  'https://farcaster.xyz',
].filter(Boolean);

export function corsHeaders(origin?: string | null): Record<string, string> {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    process.env.NODE_ENV === 'development'
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  return null;
}

// ============================================
// SECURITY HEADERS
// ============================================

export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

export interface RateLimitConfig {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}

export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await validateRateLimit(config.key, {
    maxRequests: config.maxRequests,
    windowSeconds: config.windowSeconds,
  });

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfter ?? 60);
  }

  return null;
}

// ============================================
// REQUEST VALIDATION
// ============================================

export function validateContentType(
  request: NextRequest,
  expectedType: string = 'application/json'
): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes(expectedType) ?? false;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

// ============================================
// REQUEST CONTEXT BUILDER
// ============================================

export function buildRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
    method: request.method,
    path: new URL(request.url).pathname,
    ip: getClientIp(request),
    userAgent: getUserAgent(request),
  };
}

// ============================================
// CHAIN VALIDATION
// ============================================

const SUPPORTED_CHAINS = [1, 8453, 42161, 10, 137, 56, 43114, 324];

export function isSupportedChain(chainId: number): boolean {
  return SUPPORTED_CHAINS.includes(chainId);
}

export function validateChainId(chainId: unknown): number | null {
  const parsed = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  
  if (typeof parsed !== 'number' || isNaN(parsed)) {
    return null;
  }

  return isSupportedChain(parsed) ? parsed : null;
}

// ============================================
// ADDRESS VALIDATION
// ============================================

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidAddress(address: unknown): address is `0x${string}` {
  return typeof address === 'string' && ADDRESS_REGEX.test(address);
}

export function normalizeAddress(address: string): `0x${string}` {
  return address.toLowerCase() as `0x${string}`;
}

// ============================================
// COMPOSITE MIDDLEWARE
// ============================================

export interface MiddlewareOptions {
  rateLimit?: RateLimitConfig;
  requireAuth?: boolean;
  requireChain?: boolean;
}

export async function applyMiddleware(
  request: NextRequest,
  options: MiddlewareOptions = {}
): Promise<{ response: NextResponse | null; context: RequestContext }> {
  const context = buildRequestContext(request);

  // CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return { response: corsResponse, context };
  }

  // Rate limiting
  if (options.rateLimit) {
    const rateLimitResult = await checkRateLimit(request, options.rateLimit);
    if (rateLimitResult) {
      return { response: rateLimitResult, context };
    }
  }

  return { response: null, context };
}
