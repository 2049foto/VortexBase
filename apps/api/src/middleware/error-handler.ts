/**
 * VORTEX API - Error Handler Middleware
 */

import { Elysia } from 'elysia';
import { log } from './logger';

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  ({ error, set }) => {
    // Handle custom API errors
    if (error instanceof ApiError) {
      set.status = error.statusCode;
      log.warn({ error: error.message, code: error.code });
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      // Elysia validation errors
      if (error.name === 'ValidationError') {
        set.status = 400;
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        };
      }

      // Unknown errors
      log.error({ error: error.message, stack: error.stack });
      set.status = 500;
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            process.env['NODE_ENV'] === 'production'
              ? 'Internal server error'
              : error.message,
        },
      };
    }

    // Fallback for non-Error types
    log.error({ error: String(error) });
    set.status = 500;
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
);
