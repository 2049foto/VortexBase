import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas and decimals
 */
export function formatNumber(
  value: number,
  options: {
    decimals?: number;
    compact?: boolean;
    currency?: boolean;
  } = {}
): string {
  const { decimals = 2, compact = false, currency = false } = options;

  if (compact && value >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = value / scale;

    return `${currency ? '$' : ''}${scaled.toFixed(decimals)}${suffix}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return currency ? `$${formatted}` : formatted;
}

/**
 * Format USD value
 */
export function formatUSD(value: number, compact = false): string {
  return formatNumber(value, { decimals: 2, compact, currency: true });
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Truncate Ethereum address
 */
export function truncateAddress(
  address: string,
  startChars = 6,
  endChars = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  displayDecimals = 4
): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;

  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, '0')
    .slice(0, displayDecimals);

  return `${integerPart.toLocaleString()}.${fractionalStr}`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 5000,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      onRetry?.(attempt, lastError);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get chain explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string, chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx',
    8453: 'https://basescan.org/tx',
    42161: 'https://arbiscan.io/tx',
    10: 'https://optimistic.etherscan.io/tx',
    137: 'https://polygonscan.com/tx',
    56: 'https://bscscan.com/tx',
    43114: 'https://snowtrace.io/tx',
    324: 'https://explorer.zksync.io/tx',
  };

  const baseUrl = explorers[chainId] || 'https://basescan.org/tx';
  return `${baseUrl}/${txHash}`;
}

/**
 * Get chain explorer URL for address
 */
export function getExplorerAddressUrl(
  address: string,
  chainId: number
): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/address',
    8453: 'https://basescan.org/address',
    42161: 'https://arbiscan.io/address',
    10: 'https://optimistic.etherscan.io/address',
    137: 'https://polygonscan.com/address',
    56: 'https://bscscan.com/address',
    43114: 'https://snowtrace.io/address',
    324: 'https://explorer.zksync.io/address',
  };

  const baseUrl = explorers[chainId] || 'https://basescan.org/address';
  return `${baseUrl}/${address}`;
}

/**
 * Calculate risk level from score
 */
export function getRiskLevel(score: number): {
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  label: string;
  color: string;
} {
  if (score <= 15) {
    return { level: 'safe', label: 'Safe', color: 'text-vortex-success' };
  }
  if (score <= 30) {
    return { level: 'low', label: 'Low Risk', color: 'text-vortex-primary' };
  }
  if (score <= 50) {
    return { level: 'medium', label: 'Medium Risk', color: 'text-vortex-warning' };
  }
  if (score <= 70) {
    return { level: 'high', label: 'High Risk', color: 'text-vortex-accent' };
  }
  return { level: 'critical', label: 'Critical', color: 'text-vortex-error' };
}

/**
 * Generate referral code from wallet address
 */
export function generateReferralCode(address: string): string {
  const hash = address.slice(2, 10).toUpperCase();
  return `VORTEX-${hash}`;
}
