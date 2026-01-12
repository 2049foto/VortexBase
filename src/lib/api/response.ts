/**
 * VORTEX PROTOCOL - API RESPONSE UTILITIES
 * Standardized API response handling
 */

import { NextResponse } from 'next/server';

import { isVortexError, normalizeError, type SerializedError } from '@/lib/errors';
import { logger, type RequestContext } from '@/lib/logger';

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    duration?: number;
    cached?: boolean;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  error: SerializedError;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// RESPONSE BUILDERS
// ============================================

export function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    headers?: Record<string, string>;
    meta?: ApiSuccessResponse['meta'];
  }
): NextResponse<ApiSuccessResponse<T>> {
  const { status = 200, headers = {}, meta } = options ?? {};

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

export function errorResponse(
  error: unknown,
  requestContext?: RequestContext
): NextResponse<ApiErrorResponse> {
  const normalizedError = normalizeError(error);

  // Attach request ID
  if (requestContext?.requestId) {
    normalizedError.requestId = requestContext.requestId;
  }

  // Log the error
  if (normalizedError.status >= 500) {
    logger.error(
      `API Error: ${normalizedError.message}`,
      error instanceof Error ? error : new Error(normalizedError.message),
      requestContext
    );
  } else {
    logger.warn(`API Error: ${normalizedError.message}`, requestContext);
  }

  return NextResponse.json(normalizedError.toResponse(), {
    status: normalizedError.status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function rateLimitResponse(retryAfter: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        name: 'RateLimitError',
        code: 'E5001',
        message: 'Rate limit exceeded. Please try again later.',
        status: 429,
        timestamp: new Date().toISOString(),
        context: { retryAfter },
      },
    },
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000),
      },
    }
  );
}

export function notFoundResponse(resource: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        name: 'NotFoundError',
        code: 'E6002',
        message: `${resource} not found`,
        status: 404,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 404 }
  );
}

export function validationErrorResponse(
  message: string,
  field?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        name: 'ValidationError',
        code: 'E2001',
        message,
        status: 400,
        timestamp: new Date().toISOString(),
        context: field ? { field } : undefined,
      },
    },
    { status: 400 }
  );
}

// ============================================
// API HANDLER WRAPPER
// ============================================

type ApiHandler<T = unknown> = (
  request: Request,
  context: RequestContext
) => Promise<NextResponse<ApiResponse<T>>>;

export function withApiHandler<T = unknown>(
  handler: ApiHandler<T>
): (request: Request) => Promise<NextResponse<ApiResponse<T>>> {
  return async (request: Request) => {
    const startTime = performance.now();
    const requestContext: RequestContext = {
      requestId: crypto.randomUUID(),
      method: request.method,
      path: new URL(request.url).pathname,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    logger.apiStart(requestContext.method, requestContext.path, requestContext);

    try {
      const response = await handler(request, requestContext);
      const duration = Math.round(performance.now() - startTime);

      // Add timing headers
      response.headers.set('X-Request-Id', requestContext.requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      logger.apiEnd(
        requestContext.method,
        requestContext.path,
        response.status,
        duration,
        requestContext
      );

      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      logger.apiEnd(
        requestContext.method,
        requestContext.path,
        500,
        duration,
        requestContext
      );

      return errorResponse(error, requestContext);
    }
  };
}

// ============================================
// CACHE HEADERS
// ============================================

export function getCacheHeaders(maxAge: number, staleWhileRevalidate?: number): Record<string, string> {
  let cacheControl = `public, max-age=${maxAge}`;
  
  if (staleWhileRevalidate) {
    cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  return {
    'Cache-Control': cacheControl,
    'CDN-Cache-Control': cacheControl,
    'Vercel-CDN-Cache-Control': cacheControl,
  };
}

export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };
}
