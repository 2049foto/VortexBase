/**
 * VORTEX API - Portfolio Scanner Service
 * Uses Moralis to get wallet token balances
 * 
 * Features:
 * - 30s timeout
 * - Exponential backoff retry
 * - Dust token filtering (<$10 USD)
 * - Spam token filtering
 * - Result caching
 */

import { env, DUST_THRESHOLD_USD, CHAIN_ID } from '../env';
import { log } from '../middleware/logger';
import { getOrFetch, cacheKey, CACHE_TTL } from './cache';
import { getTokenPrices } from './price';

// ============================================
// CONFIGURATION
// ============================================

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
const SCANNER_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_TOKENS = 100;

// Known spam token patterns
const SPAM_PATTERNS = [
  /airdrop/i,
  /claim/i,
  /\.com$/i,
  /\.io$/i,
  /\.org$/i,
  /free/i,
  /bonus/i,
  /reward/i,
];

// ============================================
// TYPES
// ============================================

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  logo?: string;
  valueUsd?: number;
}

export interface ScanResult {
  wallet: string;
  chainId: number;
  tokens: TokenBalance[];
  dustTokens: TokenBalance[];
  dustValueUsd: number;
  dustCount: number;
  scannedAt: string;
  durationMs: number;
}

// ============================================
// HELPERS
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSpamToken(symbol: string, name: string): boolean {
  return SPAM_PATTERNS.some(
    (pattern) => pattern.test(symbol) || pattern.test(name)
  );
}

// ============================================
// MORALIS API
// ============================================

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCANNER_TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check for rate limit
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          
          if (attempt < maxRetries) {
            log.warn({ url, status: 429, delay }, 'Rate limited, retrying');
            await sleep(delay);
            continue;
          }
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;

      if (lastError.name === 'AbortError') {
        lastError = new Error('Request timeout');
      }

      if (attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        log.warn({
          url,
          attempt: attempt + 1,
          delay,
          error: lastError.message,
        }, 'Fetch failed, retrying');
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

interface MoralisToken {
  token_address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  logo?: string;
  possible_spam?: boolean;
}

async function fetchMoralisBalances(wallet: string): Promise<TokenBalance[]> {
  const url = `${MORALIS_BASE_URL}/${wallet}/erc20?chain=base&limit=${MAX_TOKENS}`;

  const data = await fetchWithRetry<MoralisToken[]>(url, {
    headers: {
      'X-API-Key': env.MORALIS_API_KEY,
      Accept: 'application/json',
    },
  });

  // Filter and transform tokens
  return (data || [])
    .filter((token) => {
      // Filter zero balances
      if (token.balance === '0' || !token.balance) {
        return false;
      }

      // Filter Moralis-flagged spam
      if (token.possible_spam) {
        return false;
      }

      // Filter by our spam patterns
      if (isSpamToken(token.symbol, token.name)) {
        log.debug({ symbol: token.symbol, name: token.name }, 'Spam token filtered');
        return false;
      }

      return true;
    })
    .map((token) => ({
      address: token.token_address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      balance: token.balance,
      balanceFormatted: token.balance_formatted,
      logo: token.logo,
    }));
}

// ============================================
// MAIN SCANNER FUNCTION
// ============================================

export async function scanWallet(wallet: string): Promise<ScanResult> {
  const startTime = performance.now();

  log.info({ wallet }, 'Starting wallet scan');

  // Validate wallet address
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    throw new Error('Invalid wallet address format');
  }

  // Use cache-or-fetch pattern
  const result = await getOrFetch<ScanResult>(
    cacheKey.scan(wallet),
    async () => {
      // Fetch token balances from Moralis
      const tokens = await fetchMoralisBalances(wallet);

      if (tokens.length === 0) {
        return {
          wallet,
          chainId: CHAIN_ID,
          tokens: [],
          dustTokens: [],
          dustValueUsd: 0,
          dustCount: 0,
          scannedAt: new Date().toISOString(),
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      // Get prices for all tokens
      const tokenAddresses = tokens.map((t) => t.address);
      const prices = await getTokenPrices(tokenAddresses);

      // Calculate USD values
      const tokensWithPrices = tokens.map((token) => {
        const price = prices[token.address.toLowerCase()] || 0;
        const balance = parseFloat(token.balanceFormatted || '0');
        const valueUsd = balance * price;

        return {
          ...token,
          valueUsd,
        };
      });

      // Filter dust tokens (> $0 and < $DUST_THRESHOLD_USD)
      const dustTokens = tokensWithPrices.filter(
        (t) => t.valueUsd !== undefined && t.valueUsd > 0 && t.valueUsd < DUST_THRESHOLD_USD
      );

      // Sort dust tokens by value (highest first)
      dustTokens.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

      const dustValueUsd = dustTokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0);

      return {
        wallet,
        chainId: CHAIN_ID,
        tokens: tokensWithPrices,
        dustTokens,
        dustValueUsd,
        dustCount: dustTokens.length,
        scannedAt: new Date().toISOString(),
        durationMs: Math.round(performance.now() - startTime),
      };
    },
    CACHE_TTL.SCAN_RESULT
  );

  log.info({
    wallet,
    tokenCount: result.tokens.length,
    dustCount: result.dustCount,
    dustValueUsd: result.dustValueUsd.toFixed(2),
    durationMs: result.durationMs,
  }, 'Wallet scan completed');

  return result;
}

// ============================================
// EXPORT FOR TESTING
// ============================================

export { isSpamToken, fetchMoralisBalances };
