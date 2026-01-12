/**
 * VORTEX API - Sentry Error Tracking
 */

import * as Sentry from '@sentry/bun';
import { env } from '../env';

let sentryInitialized = false;

/**
 * Initialize Sentry for error tracking
 * Only initializes if SENTRY_DSN is provided
 */
export function initSentry(): void {
  if (sentryInitialized) return;

  if (!env.SENTRY_DSN) {
    console.log('[Sentry] No DSN provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Don't send events in development
      if (env.NODE_ENV === 'development') {
        return null;
      }

      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },
    integrations: [
      // Add breadcrumbs for better debugging
      Sentry.linkedErrorsIntegration({
        limit: 5,
      }),
    ],
  });

  sentryInitialized = true;
  console.log('[Sentry] Initialized successfully');
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; wallet?: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  if (!sentryInitialized) {
    console.error('[Sentry] Not initialized, error:', error.message);
    return undefined;
  }

  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
  });

  return Sentry.captureException(error);
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): string | undefined {
  if (!sentryInitialized) {
    console.log(`[Sentry] Not initialized, ${level}:`, message);
    return undefined;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
  });

  return Sentry.captureMessage(message);
}

/**
 * Set user context for all subsequent events
 */
export function setUser(user: { id: string; wallet?: string; fid?: number }): void {
  if (!sentryInitialized) return;
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
}

export { Sentry };
