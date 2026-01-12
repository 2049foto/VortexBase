/**
 * VORTEX API - Swap Service
 * 1inch Router v6 integration
 * 
 * Features:
 * - 5s timeout
 * - Slippage validation (max 2%)
 * - Multi-token swap routing
 * - Retry logic
 */

import { env, CONTRACTS, MAX_SLIPPAGE, CHAIN_ID } from '../env';
import { log } from '../middleware/logger';

// ============================================
// CONFIGURATION
// ============================================

const ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const SWAP_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 500;

// Exported config for testing
export const ONEINCH_CONFIG = {
  CHAIN_ID: 8453,
  API_VERSION: 'v6.0',
  TIMEOUT_MS: SWAP_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS: INITIAL_RETRY_DELAY_MS,
} as const;

// Slippage validation
export function validateSlippage(slippage: number): boolean {
  return slippage > 0 && slippage <= MAX_SLIPPAGE;
}

// ============================================
// TYPES
// ============================================

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  protocols: Array<{
    name: string;
    part: number;
  }>;
  estimatedGas: number;
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: number;
  gasPrice: string;
}

export interface SwapResult {
  quote: SwapQuote;
  tx: SwapTransaction;
}

export interface TokenInput {
  address: string;
  amount: string;
}

// ============================================
// HELPERS
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = SWAP_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// 1INCH API
// ============================================

interface OneInchProtocol {
  name: string;
  part: number;
}

interface OneInchToken {
  address: string;
  symbol: string;
  decimals: number;
}

interface OneInchQuoteResponse {
  srcToken: OneInchToken;
  dstToken: OneInchToken;
  srcAmount: string;
  dstAmount: string;
  protocols?: OneInchProtocol[][];
  gas?: number;
}

interface OneInchSwapResponse extends OneInchQuoteResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
}

async function fetch1inch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${ONEINCH_BASE_URL}/${CHAIN_ID}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url.toString(), {
        headers: {
          Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        
        if (attempt < MAX_RETRIES) {
          log.warn({ endpoint, attempt, delay }, '1inch rate limited, retrying');
          await sleep(delay);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`1inch API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;

      if (lastError.name === 'AbortError') {
        lastError = new Error('1inch request timeout');
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        log.warn({ endpoint, attempt, delay, error: lastError.message }, '1inch fetch failed, retrying');
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get swap quote without building transaction
 */
export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: string
): Promise<SwapQuote> {
  // Validate addresses
  if (!/^0x[a-fA-F0-9]{40}$/.test(fromToken)) {
    throw new Error('Invalid fromToken address');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(toToken)) {
    throw new Error('Invalid toToken address');
  }
  if (!amount || amount === '0') {
    throw new Error('Amount must be greater than 0');
  }

  const data = await fetch1inch<OneInchQuoteResponse>('/quote', {
    src: fromToken,
    dst: toToken,
    amount,
  });

  return {
    fromToken: data.srcToken.address,
    toToken: data.dstToken.address,
    fromAmount: data.srcAmount,
    toAmount: data.dstAmount,
    protocols: data.protocols?.flat()?.map((p) => ({
      name: p.name,
      part: p.part,
    })) || [],
    estimatedGas: data.gas || 200000,
  };
}

/**
 * Build swap transaction with slippage protection
 */
export async function buildSwapTransaction(
  fromToken: string,
  toToken: string,
  amount: string,
  fromAddress: string,
  slippage: number = 0.5
): Promise<SwapResult> {
  // Validate addresses
  if (!/^0x[a-fA-F0-9]{40}$/.test(fromToken)) {
    throw new Error('Invalid fromToken address');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(toToken)) {
    throw new Error('Invalid toToken address');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(fromAddress)) {
    throw new Error('Invalid fromAddress');
  }
  if (!amount || amount === '0') {
    throw new Error('Amount must be greater than 0');
  }

  // Ensure slippage is within bounds (max 2%)
  const safeSlippage = Math.min(slippage, MAX_SLIPPAGE * 100);
  if (safeSlippage !== slippage) {
    log.warn({ requested: slippage, applied: safeSlippage }, 'Slippage capped to max');
  }

  const startTime = performance.now();

  const data = await fetch1inch<OneInchSwapResponse>('/swap', {
    src: fromToken,
    dst: toToken,
    amount,
    from: fromAddress,
    slippage: safeSlippage.toString(),
    disableEstimate: 'true', // We'll use Pimlico for gas estimation
  });

  const durationMs = Math.round(performance.now() - startTime);

  log.info({
    fromToken,
    toToken,
    amount,
    toAmount: data.dstAmount,
    slippage: safeSlippage,
    durationMs,
  }, 'Swap transaction built');

  return {
    quote: {
      fromToken: data.srcToken.address,
      toToken: data.dstToken.address,
      fromAmount: data.srcAmount,
      toAmount: data.dstAmount,
      protocols: data.protocols?.flat()?.map((p) => ({
        name: p.name,
        part: p.part,
      })) || [],
      estimatedGas: data.tx?.gas || 200000,
    },
    tx: {
      from: data.tx.from,
      to: data.tx.to,
      data: data.tx.data,
      value: data.tx.value || '0',
      gas: data.tx.gas || 200000,
      gasPrice: data.tx.gasPrice || '0',
    },
  };
}

/**
 * Build multi-swap transaction for consolidating multiple tokens
 */
export async function buildMultiSwapTransaction(
  tokens: TokenInput[],
  toToken: string,
  fromAddress: string,
  slippage: number = 0.5
): Promise<SwapResult[]> {
  if (tokens.length === 0) {
    throw new Error('No tokens provided for swap');
  }

  // Validate toToken
  if (!/^0x[a-fA-F0-9]{40}$/.test(toToken)) {
    throw new Error('Invalid toToken address');
  }

  // Validate fromAddress
  if (!/^0x[a-fA-F0-9]{40}$/.test(fromAddress)) {
    throw new Error('Invalid fromAddress');
  }

  log.info({
    tokenCount: tokens.length,
    toToken,
    fromAddress,
    slippage,
  }, 'Building multi-swap transaction');

  // Build swap for each token
  const swaps = await Promise.all(
    tokens.map(async (token) => {
      try {
        return await buildSwapTransaction(
          token.address,
          toToken,
          token.amount,
          fromAddress,
          slippage
        );
      } catch (error) {
        log.error({
          token: token.address,
          error: (error as Error).message,
        }, 'Failed to build swap for token');
        throw error;
      }
    })
  );

  return swaps;
}

/**
 * Calculate total output from multiple swaps
 */
export function calculateTotalOutput(swaps: SwapResult[]): bigint {
  return swaps.reduce((sum, swap) => {
    return sum + BigInt(swap.quote.toAmount);
  }, 0n);
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkSwapServiceHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
}> {
  const startTime = performance.now();

  try {
    // Try to get a quote for USDC → WETH
    await getSwapQuote(
      CONTRACTS.USDC,
      CONTRACTS.WETH,
      '1000000' // 1 USDC
    );

    const latencyMs = Math.round(performance.now() - startTime);
    return { healthy: true, latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - startTime);
    return { healthy: false, latencyMs };
  }
}
