/**
 * Sentry Server Configuration
 * This file configures the initialization of Sentry on the server.
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Filter events before sending
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filter out specific errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore rate limit errors (expected)
      if (error.message.includes('Rate limit')) {
        return null;
      }

      // Ignore validation errors (user input)
      if (error.name === 'ValidationError') {
        return null;
      }
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Rate limiting
    /Rate limit/i,
    /Too many requests/i,
    
    // Expected business errors
    /ValidationError/i,
    /AuthenticationError/i,
  ],

  // Integrations
  integrations: [
    // Add database integration if needed
    Sentry.prismaIntegration(),
  ],
});
