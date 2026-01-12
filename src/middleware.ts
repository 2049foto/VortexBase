/**
 * VORTEX PROTOCOL - NEXT.JS MIDDLEWARE
 * Global request handling
 */

import { NextResponse, type NextRequest } from 'next/server';

// ============================================
// CONFIGURATION
// ============================================

const RATE_LIMIT_REQUESTS = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Simple in-memory rate limiting (use Redis in production)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

// ============================================
// SECURITY HEADERS
// ============================================

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// ============================================
// CORS CONFIGURATION
// ============================================

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://warpcast.com',
  'https://www.warpcast.com',
].filter(Boolean);

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV === 'development');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    'Access-Control-Max-Age': '86400',
  };
}

// ============================================
// RATE LIMITING
// ============================================

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count };
}

// ============================================
// MIDDLEWARE FUNCTION
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Generate request ID
  const requestId = crypto.randomUUID();

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(origin),
        ...securityHeaders,
      },
    });
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'E5001',
            message: 'Rate limit exceeded',
            status: 429,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...securityHeaders,
          },
        }
      );
    }
  }

  // Continue with request
  const response = NextResponse.next();

  // Add headers
  response.headers.set('X-Request-Id', requestId);
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (pathname.startsWith('/api/')) {
    Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// ============================================
// MATCHER CONFIGURATION
// ============================================

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all page routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
