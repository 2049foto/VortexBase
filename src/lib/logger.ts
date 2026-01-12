/**
 * VORTEX PROTOCOL - LOGGING SYSTEM
 * Structured logging with multiple transports
 */

import * as Sentry from '@sentry/nextjs';

// ============================================
// LOG LEVELS
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ============================================
// LOG CONTEXT
// ============================================

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  service?: string;
  environment: string;
  requestId?: string;
  userId?: string;
  walletAddress?: string;
  chainId?: number;
  duration?: number;
}

// ============================================
// LOGGER CLASS
// ============================================

class Logger {
  private readonly service: string;
  private readonly minLevel: LogLevel;
  private readonly environment: string;

  constructor(service: string = 'vortex') {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
    };

    if (context) {
      entry.context = context;
      
      // Extract common fields
      if (context.requestId) entry.requestId = context.requestId as string;
      if (context.userId) entry.userId = context.userId as string;
      if (context.walletAddress) entry.walletAddress = context.walletAddress as string;
      if (context.chainId) entry.chainId = context.chainId as number;
      if (context.duration) entry.duration = context.duration as number;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.environment === 'development' ? error.stack : undefined,
        code: (error as Error & { code?: string }).code,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const jsonOutput = JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(jsonOutput);
        break;
      case 'info':
        console.info(jsonOutput);
        break;
      case 'warn':
        console.warn(jsonOutput);
        break;
      case 'error':
      case 'fatal':
        console.error(jsonOutput);
        break;
    }
  }

  private sendToSentry(entry: LogEntry, error?: Error): void {
    if (entry.level === 'error' || entry.level === 'fatal') {
      Sentry.withScope((scope) => {
        scope.setLevel(entry.level === 'fatal' ? 'fatal' : 'error');
        scope.setTag('service', this.service);
        
        if (entry.requestId) scope.setTag('requestId', entry.requestId);
        if (entry.userId) scope.setUser({ id: entry.userId });
        if (entry.walletAddress) scope.setTag('walletAddress', entry.walletAddress);
        if (entry.chainId) scope.setTag('chainId', String(entry.chainId));
        
        if (entry.context) {
          scope.setContext('details', entry.context);
        }

        if (error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(entry.message);
        }
      });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.formatEntry('debug', message, context);
    this.output(entry);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const entry = this.formatEntry('info', message, context);
    this.output(entry);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.formatEntry('warn', message, context);
    this.output(entry);
  }

  error(message: string, error: Error, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    const entry = this.formatEntry('error', message, context, error);
    this.output(entry);
    this.sendToSentry(entry, error);
  }

  fatal(message: string, error: Error, context?: LogContext): void {
    const entry = this.formatEntry('fatal', message, context, error);
    this.output(entry);
    this.sendToSentry(entry, error);
  }

  // ============================================
  // SPECIALIZED LOGGING METHODS
  // ============================================

  /**
   * Log API request start
   */
  apiStart(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path} started`, {
      ...context,
      type: 'api_request',
      method,
      path,
    });
  }

  /**
   * Log API request completion
   */
  apiEnd(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const entry = this.formatEntry(level, `API ${method} ${path} completed`, {
      ...context,
      type: 'api_response',
      method,
      path,
      status,
      duration,
    });
    this.output(entry);
  }

  /**
   * Log transaction event
   */
  transaction(event: string, txHash: string, context?: LogContext): void {
    this.info(`Transaction ${event}`, {
      ...context,
      type: 'transaction',
      event,
      txHash,
    });
  }

  /**
   * Log performance metric
   */
  metric(name: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Metric: ${name}`, {
      ...context,
      type: 'metric',
      metric: name,
      value,
      unit,
    });
  }

  /**
   * Create child logger with service name
   */
  child(service: string): Logger {
    return new Logger(`${this.service}:${service}`);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const logger = new Logger('vortex');

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export function createLogger(service: string): Logger {
  return logger.child(service);
}

// ============================================
// REQUEST CONTEXT HELPER
// ============================================

export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  walletAddress?: string;
}

export function createRequestContext(request: Request): RequestContext {
  const url = new URL(request.url);
  
  return {
    requestId: crypto.randomUUID(),
    method: request.method,
    path: url.pathname,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}
