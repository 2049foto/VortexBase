/**
 * VORTEX PROTOCOL - PRICE SERVICE
 * Token price fetching from multiple sources
 */

import { CHAIN_IDS, API_ENDPOINTS, TIMEOUTS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { cacheGetOrSet, cacheTokenPrice, getCachedTokenPrice } from './cache';

// ============================================
// TYPES
// ============================================

interface TokenPrice {
  usd: number;
  usd_24h_change?: number;
}

interface DexScreenerPair {
  chainId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  volume: {
    h24: number;
  };
}

// ============================================
// CHAIN TO COINGECKO PLATFORM
// ============================================

const CHAIN_TO_PLATFORM: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: 'ethereum',
  [CHAIN_IDS.BASE]: 'base',
  [CHAIN_IDS.ARBITRUM]: 'arbitrum-one',
  [CHAIN_IDS.OPTIMISM]: 'optimistic-ethereum',
  [CHAIN_IDS.POLYGON]: 'polygon-pos',
  [CHAIN_IDS.BNB]: 'binance-smart-chain',
  [CHAIN_IDS.AVALANCHE]: 'avalanche',
  [CHAIN_IDS.ZKSYNC]: 'zksync',
};

const CHAIN_TO_DEXSCREENER: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: 'ethereum',
  [CHAIN_IDS.BASE]: 'base',
  [CHAIN_IDS.ARBITRUM]: 'arbitrum',
  [CHAIN_IDS.OPTIMISM]: 'optimism',
  [CHAIN_IDS.POLYGON]: 'polygon',
  [CHAIN_IDS.BNB]: 'bsc',
  [CHAIN_IDS.AVALANCHE]: 'avalanche',
  [CHAIN_IDS.ZKSYNC]: 'zksync',
};

// ============================================
// NATIVE TOKEN PRICES
// ============================================

const NATIVE_TOKEN_IDS: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: 'ethereum',
  [CHAIN_IDS.BASE]: 'ethereum', // Base uses ETH
  [CHAIN_IDS.ARBITRUM]: 'ethereum',
  [CHAIN_IDS.OPTIMISM]: 'ethereum',
  [CHAIN_IDS.POLYGON]: 'matic-network',
  [CHAIN_IDS.BNB]: 'binancecoin',
  [CHAIN_IDS.AVALANCHE]: 'avalanche-2',
  [CHAIN_IDS.ZKSYNC]: 'ethereum',
};

// ============================================
// FETCH UTILITIES
// ============================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = TIMEOUTS.API_REQUEST_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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
// COINGECKO PRICE FETCHING
// ============================================

async function fetchPriceFromCoinGecko(
  tokenAddress: string,
  chainId: number
): Promise<number | null> {
  const platform = CHAIN_TO_PLATFORM[chainId];
  if (!platform) return null;

  try {
    const url = `${API_ENDPOINTS.COINGECKO}/simple/token_price/${platform}?contract_addresses=${tokenAddress}&vs_currencies=usd`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const price = data[tokenAddress.toLowerCase()]?.usd;
    
    return typeof price === 'number' ? price : null;
  } catch (error) {
    logger.warn('CoinGecko price fetch failed', { tokenAddress, chainId });
    return null;
  }
}

// ============================================
// DEXSCREENER PRICE FETCHING
// ============================================

async function fetchPriceFromDexScreener(
  tokenAddress: string,
  chainId: number
): Promise<{ price: number; liquidity: number; volume24h: number } | null> {
  const chain = CHAIN_TO_DEXSCREENER[chainId];
  if (!chain) return null;

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const pairs: DexScreenerPair[] = data.pairs || [];
    
    // Filter pairs for correct chain and sort by liquidity
    const chainPairs = pairs
      .filter((p) => p.chainId === chain)
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    if (chainPairs.length === 0) {
      return null;
    }

    const bestPair = chainPairs[0]!;
    const price = parseFloat(bestPair.priceUsd);

    if (isNaN(price)) {
      return null;
    }

    return {
      price,
      liquidity: bestPair.liquidity?.usd || 0,
      volume24h: bestPair.volume?.h24 || 0,
    };
  } catch (error) {
    logger.warn('DexScreener price fetch failed', { tokenAddress, chainId });
    return null;
  }
}

// ============================================
// MORALIS PRICE FETCHING
// ============================================

async function fetchPriceFromMoralis(
  tokenAddress: string,
  chainId: number
): Promise<number | null> {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) return null;

  // Map chain ID to Moralis chain format
  const chainMap: Record<number, string> = {
    [CHAIN_IDS.ETHEREUM]: '0x1',
    [CHAIN_IDS.BASE]: '0x2105',
    [CHAIN_IDS.ARBITRUM]: '0xa4b1',
    [CHAIN_IDS.OPTIMISM]: '0xa',
    [CHAIN_IDS.POLYGON]: '0x89',
    [CHAIN_IDS.BNB]: '0x38',
    [CHAIN_IDS.AVALANCHE]: '0xa86a',
  };

  const chain = chainMap[chainId];
  if (!chain) return null;

  try {
    const url = `${API_ENDPOINTS.MORALIS}/erc20/${tokenAddress}/price?chain=${chain}`;
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.usdPrice || null;
  } catch (error) {
    logger.warn('Moralis price fetch failed', { tokenAddress, chainId });
    return null;
  }
}

// ============================================
// MAIN PRICE FUNCTION
// ============================================

export async function getTokenPrice(
  tokenAddress: string,
  chainId: number
): Promise<number> {
  const normalizedAddress = tokenAddress.toLowerCase();
  
  // Check cache first
  const cached = await getCachedTokenPrice(normalizedAddress, chainId);
  if (cached !== null) {
    return cached;
  }

  // Try multiple sources in order of reliability
  let price: number | null = null;

  // 1. Try Moralis (most reliable for supported chains)
  price = await fetchPriceFromMoralis(normalizedAddress, chainId);
  
  // 2. Fallback to DexScreener
  if (price === null) {
    const dexData = await fetchPriceFromDexScreener(normalizedAddress, chainId);
    price = dexData?.price ?? null;
  }

  // 3. Fallback to CoinGecko
  if (price === null) {
    price = await fetchPriceFromCoinGecko(normalizedAddress, chainId);
  }

  // Default to 0 if no price found
  const finalPrice = price ?? 0;
  
  // Cache the price
  if (finalPrice > 0) {
    await cacheTokenPrice(normalizedAddress, chainId, finalPrice);
  }

  return finalPrice;
}

// ============================================
// BATCH PRICE FETCHING
// ============================================

export async function getTokenPrices(
  tokenAddresses: string[],
  chainId: number
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  // Fetch in parallel with concurrency limit
  const batchSize = 10;
  
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map((addr) => getTokenPrice(addr, chainId))
    );
    
    results.forEach((result, index) => {
      const address = batch[index]!.toLowerCase();
      if (result.status === 'fulfilled') {
        prices.set(address, result.value);
      } else {
        prices.set(address, 0);
      }
    });
  }

  return prices;
}

// ============================================
// NATIVE TOKEN PRICE
// ============================================

export async function getNativeTokenPrice(chainId: number): Promise<number> {
  const cacheKey = `native:${chainId}`;
  
  return cacheGetOrSet(
    cacheKey,
    async () => {
      const coinId = NATIVE_TOKEN_IDS[chainId];
      if (!coinId) return 0;

      try {
        const url = `${API_ENDPOINTS.COINGECKO}/simple/price?ids=${coinId}&vs_currencies=usd`;
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
          return 0;
        }

        const data = await response.json();
        return data[coinId]?.usd ?? 0;
      } catch (error) {
        logger.warn('Native token price fetch failed', { chainId, coinId });
        return 0;
      }
    },
    60 // Cache for 1 minute
  );
}

// ============================================
// USD VALUE CALCULATION
// ============================================

export function calculateUsdValue(
  balance: bigint,
  decimals: number,
  priceUsd: number
): number {
  if (balance === 0n || priceUsd === 0) {
    return 0;
  }

  const divisor = 10 ** decimals;
  const balanceNumber = Number(balance) / divisor;
  return balanceNumber * priceUsd;
}
