'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// ============================================
// ERROR BOUNDARY TYPES
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to Sentry in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Dynamic import to avoid bundling Sentry on server
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetKeys changed
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasKeyChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.reset}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// ERROR FALLBACK COMPONENT
// ============================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({
  error,
  errorInfo,
  onReset,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  const handleReport = () => {
    // Open GitHub issue with pre-filled error info
    const title = encodeURIComponent(`[Bug] ${error?.name ?? 'Error'}: ${error?.message ?? 'Unknown error'}`);
    const body = encodeURIComponent(
      `## Error\n\`\`\`\n${error?.stack ?? 'No stack trace'}\n\`\`\`\n\n## Component Stack\n\`\`\`\n${errorInfo?.componentStack ?? 'No component stack'}\n\`\`\``
    );
    window.open(
      `https://github.com/2049foto/Vortex-/issues/new?title=${title}&body=${body}&labels=bug`,
      '_blank'
    );
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-vortex-error/10">
          <AlertTriangle className="h-8 w-8 text-vortex-error" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-vortex-text">
            Something went wrong
          </h2>
          <p className="text-sm text-vortex-text-muted">
            An unexpected error occurred. Our team has been notified.
          </p>
        </div>

        {/* Error details (development only) */}
        {showDetails && error && (
          <div className="rounded-lg border border-vortex-border bg-vortex-bg-secondary p-4 text-left">
            <p className="mb-2 font-mono text-xs font-semibold text-vortex-error">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre className="max-h-32 overflow-auto font-mono text-[10px] text-vortex-text-muted">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onReset && (
            <button
              onClick={onReset}
              className={cn(
                'btn-vortex btn-primary h-10 px-4 text-xs',
                'flex items-center justify-center gap-2'
              )}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}

          <Link
            href="/"
            className={cn(
              'btn-vortex btn-secondary h-10 px-4 text-xs',
              'flex items-center justify-center gap-2'
            )}
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>

          <button
            onClick={handleReport}
            className={cn(
              'btn-vortex h-10 px-4 text-xs',
              'flex items-center justify-center gap-2',
              'border border-vortex-border bg-transparent text-vortex-text-muted',
              'hover:bg-vortex-bg-tertiary'
            )}
          >
            <Bug className="h-4 w-4" />
            Report Bug
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUSPENSE FALLBACK COMPONENT
// ============================================

interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingFallback({
  message = 'Loading...',
  size = 'md',
}: LoadingFallbackProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-vortex-border border-t-vortex-primary',
            sizes[size]
          )}
        />
        <div
          className={cn(
            'absolute inset-0 animate-pulse rounded-full bg-vortex-primary/10',
            sizes[size]
          )}
        />
      </div>
      <p className="text-sm text-vortex-text-muted">{message}</p>
    </div>
  );
}

// ============================================
// ASYNC BOUNDARY (COMBINING ERROR + SUSPENSE)
// ============================================

interface AsyncBoundaryProps {
  children: ReactNode;
  errorFallback?: ReactNode;
  loadingFallback?: ReactNode;
  loadingMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function AsyncBoundary({
  children,
  errorFallback,
  loadingFallback,
  loadingMessage,
  onError,
}: AsyncBoundaryProps) {
  const { Suspense } = require('react');

  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={loadingFallback ?? <LoadingFallback message={loadingMessage} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
