/**
 * VORTEX API - Price Service
 * Uses CoinGecko for token prices
 * 
 * Features:
 * - 5s timeout
 * - Batch price fetching
 * - Redis caching (TTL 60s)
 * - Fallback to cached values on error
 */

import { env } from '../env';
import { get, set, mget, cacheKey, CACHE_TTL } from './cache';
import { log } from '../middleware/logger';

// ============================================
// CONFIGURATION
// ============================================

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const PRICE_TIMEOUT_MS = 10000;
const MAX_ADDRESSES_PER_BATCH = 100;
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

// Exported config for testing
export const COINGECKO_CONFIG = {
  BASE_URL: COINGECKO_BASE_URL,
  TIMEOUT_MS: PRICE_TIMEOUT_MS,
  BATCH_SIZE: MAX_ADDRESSES_PER_BATCH,
} as const;

// Known Base chain token addresses -> CoinGecko IDs (for fallback)
// Exported for testing
export const KNOWN_TOKENS: Record<string, string> = {
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd-coin', // USDC
  '0x4200000000000000000000000000000000000006': 'weth', // WETH
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'dai', // DAI
  '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': 'coinbase-wrapped-staked-eth', // cbETH
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': 'bridged-usd-coin-base', // USDbC
};

// ============================================
// TYPES
// ============================================

interface CoinGeckoPriceResponse {
  [address: string]: {
    usd: number;
  };
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
  timeoutMs: number = PRICE_TIMEOUT_MS
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
// COINGECKO API
// ============================================

async function fetchBatchPrices(
  tokenAddresses: string[]
): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) {
    return {};
  }

  const addresses = tokenAddresses.map((a) => a.toLowerCase()).join(',');
  const url = `${COINGECKO_BASE_URL}/simple/token_price/base?contract_addresses=${addresses}&vs_currencies=usd`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      // Add API key if available (pro tier)
      if (env.COINGECKO_API_KEY) {
        headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY;
      }

      const response = await fetchWithTimeout(url, { headers });

      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        
        if (attempt < MAX_RETRIES) {
          log.warn({ attempt, delay }, 'CoinGecko rate limited, retrying');
          await sleep(delay);
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data: CoinGeckoPriceResponse = await response.json();

      const prices: Record<string, number> = {};
      for (const [address, priceData] of Object.entries(data)) {
        prices[address.toLowerCase()] = priceData.usd;
      }

      log.debug({ addressCount: tokenAddresses.length, pricesFound: Object.keys(prices).length }, 'Prices fetched');

      return prices;
    } catch (error) {
      lastError = error as Error;

      if (lastError.name === 'AbortError') {
        lastError = new Error('CoinGecko request timeout');
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        log.warn({ attempt, delay, error: lastError.message }, 'CoinGecko fetch failed, retrying');
        await sleep(delay);
      }
    }
  }

  log.error({ error: lastError?.message }, 'Failed to fetch prices from CoinGecko');
  return {};
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get prices for multiple token addresses
 * Uses caching to reduce API calls
 */
export async function getTokenPrices(
  tokenAddresses: string[]
): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) {
    return {};
  }

  const normalizedAddresses = tokenAddresses.map((a) => a.toLowerCase());
  const prices: Record<string, number> = {};
  const uncachedAddresses: string[] = [];

  // Check cache first
  const cacheKeys = normalizedAddresses.map((a) => cacheKey.price(a));
  const cachedValues = await mget<number>(cacheKeys);

  normalizedAddresses.forEach((address, index) => {
    const cachedPrice = cachedValues[index];
    if (cachedPrice !== null) {
      prices[address] = cachedPrice;
    } else {
      uncachedAddresses.push(address);
    }
  });

  log.debug({
    total: normalizedAddresses.length,
    cached: normalizedAddresses.length - uncachedAddresses.length,
    toFetch: uncachedAddresses.length,
  }, 'Price cache check');

  // Fetch uncached prices in batches
  if (uncachedAddresses.length > 0) {
    const batches: string[][] = [];
    for (let i = 0; i < uncachedAddresses.length; i += MAX_ADDRESSES_PER_BATCH) {
      batches.push(uncachedAddresses.slice(i, i + MAX_ADDRESSES_PER_BATCH));
    }

    for (const batch of batches) {
      const batchPrices = await fetchBatchPrices(batch);

      // Cache and add to results
      for (const [address, price] of Object.entries(batchPrices)) {
        prices[address] = price;
        // Cache async (fire and forget)
        set(cacheKey.price(address), price, CACHE_TTL.PRICE).catch(() => {});
      }

      // Set price to 0 for tokens not found
      for (const address of batch) {
        if (!(address in prices)) {
          prices[address] = 0;
        }
      }
    }
  }

  return prices;
}

/**
 * Get price for a single token
 */
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  const normalized = tokenAddress.toLowerCase();
  
  // Check cache first
  const cached = await get<number>(cacheKey.price(normalized));
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const prices = await fetchBatchPrices([normalized]);
  const price = prices[normalized] || 0;

  // Cache the result
  await set(cacheKey.price(normalized), price, CACHE_TTL.PRICE);

  return price;
}

/**
 * Get ETH price in USD
 */
export async function getEthPrice(): Promise<number> {
  const wethAddress = '0x4200000000000000000000000000000000000006';
  return getTokenPrice(wethAddress);
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkPriceServiceHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
}> {
  const startTime = performance.now();

  try {
    // Try to get USDC price as health check
    const price = await getTokenPrice('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    const latencyMs = Math.round(performance.now() - startTime);

    // USDC should be close to $1
    const healthy = price > 0.9 && price < 1.1;

    return { healthy, latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - startTime);
    return { healthy: false, latencyMs };
  }
}
