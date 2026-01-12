/**
 * Sentry Client Configuration
 * This file configures the initialization of Sentry on the client.
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay configuration
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration({
      // Enable tracing for specific routes
      enableInp: true,
    }),
  ],

  // Filter events before sending
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filter out specific errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore user-cancelled transactions
      if (error.message.includes('User rejected') || 
          error.message.includes('User denied')) {
        return null;
      }

      // Ignore network errors (often transient)
      if (error.message.includes('Network Error') ||
          error.message.includes('Failed to fetch')) {
        return null;
      }
    }

    return event;
  },

  // Add user context
  beforeSendTransaction(event) {
    // Add wallet address if available
    if (typeof window !== 'undefined') {
      const walletAddress = localStorage.getItem('vortex_wallet_address');
      if (walletAddress) {
        event.user = {
          ...event.user,
          id: walletAddress,
        };
      }
    }
    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    /chrome-extension/i,
    /moz-extension/i,
    
    // Wallet rejections
    /User rejected/i,
    /User denied/i,
    
    // Network issues
    /Network Error/i,
    /Failed to fetch/i,
    /Load failed/i,
    
    // Third-party scripts
    /Script error/i,
    /ResizeObserver loop/i,
  ],

  // Ignore specific URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    
    // Firefox extensions
    /^moz-extension:\/\//i,
    
    // Safari extensions
    /^safari-extension:\/\//i,
  ],
});
