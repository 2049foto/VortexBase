/**
 * VORTEX API - Error Handler Unit Tests
 */

import { describe, test, expect } from 'bun:test';
import {
  ApiError,
  ValidationError,
  AuthError,
  NotFoundError,
  RateLimitError,
} from '../middleware/error-handler';

describe('Error Handler', () => {
  describe('ApiError', () => {
    test('should create error with default status 500', () => {
      const error = new ApiError('Something went wrong');
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    test('should create error with custom status', () => {
      const error = new ApiError('Custom error', 400, 'CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
    });

    test('should be instance of Error', () => {
      const error = new ApiError('Test');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ValidationError', () => {
    test('should have status 400', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('should be instance of ApiError', () => {
      const error = new ValidationError('Test');
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('AuthError', () => {
    test('should have status 401', () => {
      const error = new AuthError('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_ERROR');
    });

    test('should be instance of ApiError', () => {
      const error = new AuthError('Test');
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    test('should have status 404', () => {
      const error = new NotFoundError('Resource');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    test('should be instance of ApiError', () => {
      const error = new NotFoundError('User');
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('RateLimitError', () => {
    test('should have status 429', () => {
      const error = new RateLimitError(60);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT');
    });

    test('should be instance of ApiError', () => {
      const error = new RateLimitError(30);
      expect(error instanceof ApiError).toBe(true);
    });

    test('should include retry time in message', () => {
      const error = new RateLimitError(120);
      expect(error.message).toContain('120');
    });
  });
});
