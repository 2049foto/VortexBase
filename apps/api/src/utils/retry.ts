/**
 * VORTEX API - Retry Utility
 * Exponential backoff retry logic
 */

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < finalConfig.maxRetries) {
        const delay = Math.min(
          finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier || 2, attempt),
          finalConfig.maxDelayMs || 30000
        );
        
        if (finalConfig.onRetry) {
          finalConfig.onRetry(lastError, attempt + 1);
        }
        
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with custom error handling
 */
export async function withRetryOnError<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (!shouldRetry(lastError) || attempt >= finalConfig.maxRetries) {
        throw lastError;
      }
      
      const delay = Math.min(
        finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier || 2, attempt),
        finalConfig.maxDelayMs || 30000
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}
