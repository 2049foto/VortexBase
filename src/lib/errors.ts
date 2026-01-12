/**
 * VORTEX PROTOCOL - ERROR HANDLING SYSTEM
 * Enterprise-grade error management with tracking
 */

// ============================================
// ERROR CODES (Standardized)
// ============================================

export const ErrorCodes = {
  // Authentication (1xxx)
  UNAUTHORIZED: 'E1001',
  INVALID_TOKEN: 'E1002',
  SESSION_EXPIRED: 'E1003',
  INVALID_SIGNATURE: 'E1004',
  WALLET_NOT_CONNECTED: 'E1005',

  // Validation (2xxx)
  VALIDATION_ERROR: 'E2001',
  INVALID_ADDRESS: 'E2002',
  INVALID_CHAIN: 'E2003',
  INVALID_AMOUNT: 'E2004',
  INVALID_TOKEN: 'E2005',
  MISSING_REQUIRED_FIELD: 'E2006',

  // Business Logic (3xxx)
  INSUFFICIENT_BALANCE: 'E3001',
  PRICE_IMPACT_TOO_HIGH: 'E3002',
  SLIPPAGE_EXCEEDED: 'E3003',
  MAX_BATCH_EXCEEDED: 'E3004',
  TOKEN_NOT_TRADEABLE: 'E3005',
  RISK_TOO_HIGH: 'E3006',
  MIN_VALUE_NOT_MET: 'E3007',
  CONSOLIDATION_FAILED: 'E3008',

  // External Services (4xxx)
  API_ERROR: 'E4001',
  RPC_ERROR: 'E4002',
  RPC_TIMEOUT: 'E4003',
  BUNDLER_ERROR: 'E4004',
  PAYMASTER_ERROR: 'E4005',
  DEX_ERROR: 'E4006',
  SIMULATION_FAILED: 'E4007',

  // Rate Limiting (5xxx)
  RATE_LIMIT_EXCEEDED: 'E5001',
  TOO_MANY_REQUESTS: 'E5002',
  QUOTA_EXCEEDED: 'E5003',

  // Database (6xxx)
  DATABASE_ERROR: 'E6001',
  RECORD_NOT_FOUND: 'E6002',
  DUPLICATE_RECORD: 'E6003',
  TRANSACTION_FAILED: 'E6004',

  // Internal (9xxx)
  INTERNAL_ERROR: 'E9001',
  NOT_IMPLEMENTED: 'E9002',
  CONFIGURATION_ERROR: 'E9003',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================
// HTTP STATUS MAPPING
// ============================================

const ERROR_STATUS_MAP: Record<string, number> = {
  // 400 Bad Request
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_ADDRESS]: 400,
  [ErrorCodes.INVALID_CHAIN]: 400,
  [ErrorCodes.INVALID_AMOUNT]: 400,
  [ErrorCodes.INVALID_TOKEN]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,

  // 401 Unauthorized
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.SESSION_EXPIRED]: 401,
  [ErrorCodes.INVALID_SIGNATURE]: 401,
  [ErrorCodes.WALLET_NOT_CONNECTED]: 401,

  // 404 Not Found
  [ErrorCodes.RECORD_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCodes.DUPLICATE_RECORD]: 409,

  // 422 Unprocessable Entity
  [ErrorCodes.INSUFFICIENT_BALANCE]: 422,
  [ErrorCodes.PRICE_IMPACT_TOO_HIGH]: 422,
  [ErrorCodes.SLIPPAGE_EXCEEDED]: 422,
  [ErrorCodes.MAX_BATCH_EXCEEDED]: 422,
  [ErrorCodes.TOKEN_NOT_TRADEABLE]: 422,
  [ErrorCodes.RISK_TOO_HIGH]: 422,
  [ErrorCodes.MIN_VALUE_NOT_MET]: 422,

  // 429 Too Many Requests
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.TOO_MANY_REQUESTS]: 429,
  [ErrorCodes.QUOTA_EXCEEDED]: 429,

  // 500 Internal Server Error
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.TRANSACTION_FAILED]: 500,
  [ErrorCodes.CONFIGURATION_ERROR]: 500,

  // 502 Bad Gateway
  [ErrorCodes.API_ERROR]: 502,
  [ErrorCodes.RPC_ERROR]: 502,
  [ErrorCodes.BUNDLER_ERROR]: 502,
  [ErrorCodes.PAYMASTER_ERROR]: 502,
  [ErrorCodes.DEX_ERROR]: 502,

  // 504 Gateway Timeout
  [ErrorCodes.RPC_TIMEOUT]: 504,
};

// ============================================
// BASE ERROR CLASS
// ============================================

export interface ErrorContext {
  [key: string]: unknown;
}

export interface SerializedError {
  name: string;
  code: ErrorCode;
  message: string;
  status: number;
  timestamp: string;
  requestId?: string;
  context?: ErrorContext;
  stack?: string;
}

export abstract class BaseError extends Error {
  abstract readonly code: ErrorCode;
  readonly timestamp: Date;
  readonly context?: ErrorContext;
  requestId?: string;

  constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }

  get status(): number {
    return ERROR_STATUS_MAP[this.code] ?? 500;
  }

  toJSON(): SerializedError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  toResponse(): { error: SerializedError; success: false } {
    return {
      success: false,
      error: this.toJSON(),
    };
  }
}

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

export class ValidationError extends BaseError {
  readonly code = ErrorCodes.VALIDATION_ERROR;

  constructor(message: string, context?: ErrorContext) {
    super(message, context);
  }

  static invalidAddress(address: string): ValidationError {
    return new ValidationError(`Invalid Ethereum address: ${address}`, { address });
  }

  static invalidChain(chainId: number): ValidationError {
    return new ValidationError(`Unsupported chain ID: ${chainId}`, { chainId });
  }

  static missingField(field: string): ValidationError {
    return new ValidationError(`Missing required field: ${field}`, { field });
  }
}

export class AuthenticationError extends BaseError {
  readonly code = ErrorCodes.UNAUTHORIZED;

  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, context);
  }

  static walletNotConnected(): AuthenticationError {
    return new AuthenticationError('Wallet not connected');
  }

  static invalidSignature(): AuthenticationError {
    return new AuthenticationError('Invalid signature');
  }

  static sessionExpired(): AuthenticationError {
    return new AuthenticationError('Session expired');
  }
}

export class BusinessError extends BaseError {
  readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode = ErrorCodes.INTERNAL_ERROR, context?: ErrorContext) {
    super(message, context);
    this.code = code;
  }

  static insufficientBalance(required: string, available: string): BusinessError {
    return new BusinessError(
      `Insufficient balance: required ${required}, available ${available}`,
      ErrorCodes.INSUFFICIENT_BALANCE,
      { required, available }
    );
  }

  static priceImpactTooHigh(impact: number, max: number): BusinessError {
    return new BusinessError(
      `Price impact ${impact.toFixed(2)}% exceeds maximum ${max}%`,
      ErrorCodes.PRICE_IMPACT_TOO_HIGH,
      { impact, max }
    );
  }

  static riskTooHigh(score: number, token: string): BusinessError {
    return new BusinessError(
      `Token ${token} risk score ${score} is too high for consolidation`,
      ErrorCodes.RISK_TOO_HIGH,
      { score, token }
    );
  }
}

export class ExternalServiceError extends BaseError {
  readonly code: ErrorCode;
  readonly service: string;

  constructor(
    message: string,
    service: string,
    code: ErrorCode = ErrorCodes.API_ERROR,
    context?: ErrorContext
  ) {
    super(message, { ...context, service });
    this.code = code;
    this.service = service;
  }

  static rpcError(message: string, chainId: number): ExternalServiceError {
    return new ExternalServiceError(message, 'rpc', ErrorCodes.RPC_ERROR, { chainId });
  }

  static bundlerError(message: string): ExternalServiceError {
    return new ExternalServiceError(message, 'bundler', ErrorCodes.BUNDLER_ERROR);
  }

  static dexError(message: string, dex: string): ExternalServiceError {
    return new ExternalServiceError(message, dex, ErrorCodes.DEX_ERROR, { dex });
  }
}

export class RateLimitError extends BaseError {
  readonly code = ErrorCodes.RATE_LIMIT_EXCEEDED;
  readonly retryAfter: number;

  constructor(message: string, retryAfter: number, context?: ErrorContext) {
    super(message, { ...context, retryAfter });
    this.retryAfter = retryAfter;
  }
}

export class NotFoundError extends BaseError {
  readonly code = ErrorCodes.RECORD_NOT_FOUND;

  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, { resource, identifier });
  }
}

export class DatabaseError extends BaseError {
  readonly code = ErrorCodes.DATABASE_ERROR;

  constructor(message: string, context?: ErrorContext) {
    super(message, context);
  }
}

// ============================================
// ERROR UTILITIES
// ============================================

export function isVortexError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function normalizeError(error: unknown): BaseError {
  if (isVortexError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new BusinessError(error.message, ErrorCodes.INTERNAL_ERROR, {
      originalName: error.name,
      originalStack: error.stack,
    });
  }

  return new BusinessError(
    typeof error === 'string' ? error : 'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR
  );
}

export function getErrorStatus(error: unknown): number {
  if (isVortexError(error)) {
    return error.status;
  }
  return 500;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
