/**
 * VORTEX PROTOCOL - SCANNER SERVICE
 * Wallet scanning using Moralis API
 */

import { CHAIN_IDS, LIMITS, API_ENDPOINTS, TIMEOUTS } from '@/lib/constants';
import { logger, createLogger } from '@/lib/logger';
import { ExternalServiceError, ErrorCodes } from '@/lib/errors';
import { getTokenPrices, calculateUsdValue } from './price';
import { getCachedRiskScore } from './cache';

const scanLogger = createLogger('scanner');

// ============================================
// TYPES
// ============================================

export interface ScannedToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // BigInt as string
  balanceFormatted: string;
  priceUsd: number;
  valueUsd: number;
  logoUri?: string;
  isDust: boolean;
  riskScore?: number;
  riskLevel?: string;
}

export interface ScanResult {
  walletAddress: string;
  chainId: number;
  tokens: ScannedToken[];
  totalTokens: number;
  dustTokens: number;
  totalValueUsd: number;
  dustValueUsd: number;
  consolidatableValueUsd: number;
  scanDurationMs: number;
  rpcProvider: string;
}

// ============================================
// MORALIS TOKEN BALANCE FETCHING
// ============================================

interface MoralisTokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  logo?: string;
  thumbnail?: string;
  possible_spam: boolean;
}

async function fetchTokenBalancesFromMoralis(
  walletAddress: string,
  chainId: number
): Promise<MoralisTokenBalance[]> {
  const apiKey = process.env.MORALIS_API_KEY;
  
  if (!apiKey) {
    throw new ExternalServiceError(
      'Moralis API key not configured',
      'moralis',
      ErrorCodes.API_ERROR
    );
  }

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
  if (!chain) {
    throw new ExternalServiceError(
      `Chain ${chainId} not supported by Moralis`,
      'moralis',
      ErrorCodes.INVALID_CHAIN
    );
  }

  const url = `${API_ENDPOINTS.MORALIS}/${walletAddress}/erc20?chain=${chain}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.SCAN_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalServiceError(
        `Moralis API error: ${response.status} - ${errorText}`,
        'moralis',
        ErrorCodes.API_ERROR
      );
    }

    const data = await response.json();
    return data.result || data || [];
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    
    throw new ExternalServiceError(
      `Failed to fetch token balances: ${error instanceof Error ? error.message : String(error)}`,
      'moralis',
      ErrorCodes.API_ERROR
    );
  }
}

// ============================================
// DUST THRESHOLD CALCULATION
// ============================================

function isDustToken(valueUsd: number): boolean {
  return valueUsd > 0 && valueUsd < LIMITS.MIN_SWAP_VALUE_USD;
}

function isConsolidatable(valueUsd: number, riskScore?: number): boolean {
  // Must be above minimum dust value
  if (valueUsd < LIMITS.MIN_DUST_VALUE_USD) {
    return false;
  }
  
  // Must not be high risk (score > 50)
  if (riskScore !== undefined && riskScore > 50) {
    return false;
  }
  
  return true;
}

// ============================================
// MAIN SCAN FUNCTION
// ============================================

export async function scanWallet(
  walletAddress: string,
  chainId: number
): Promise<ScanResult> {
  const startTime = performance.now();
  const normalizedAddress = walletAddress.toLowerCase();

  scanLogger.info('Starting wallet scan', { walletAddress: normalizedAddress, chainId });

  // Fetch token balances from Moralis
  const moralisTokens = await fetchTokenBalancesFromMoralis(normalizedAddress, chainId);
  
  // Filter out spam tokens and zero balances
  const validTokens = moralisTokens.filter(
    (token) => !token.possible_spam && BigInt(token.balance) > 0n
  );

  scanLogger.info('Fetched token balances', { 
    total: moralisTokens.length, 
    valid: validTokens.length 
  });

  // Get prices for all tokens
  const tokenAddresses = validTokens.map((t) => t.token_address);
  const prices = await getTokenPrices(tokenAddresses, chainId);

  // Build scanned tokens array
  const tokens: ScannedToken[] = [];
  let totalValueUsd = 0;
  let dustValueUsd = 0;
  let consolidatableValueUsd = 0;
  let dustCount = 0;

  for (const token of validTokens) {
    const address = token.token_address.toLowerCase();
    const balance = BigInt(token.balance);
    const priceUsd = prices.get(address) ?? 0;
    const valueUsd = calculateUsdValue(balance, token.decimals, priceUsd);
    
    // Check for cached risk score
    const cachedRisk = await getCachedRiskScore(address, chainId);
    
    const isDust = isDustToken(valueUsd);
    const canConsolidate = isConsolidatable(valueUsd, cachedRisk?.overall);

    if (isDust) {
      dustCount++;
      dustValueUsd += valueUsd;
      
      if (canConsolidate) {
        consolidatableValueUsd += valueUsd;
      }
    }

    totalValueUsd += valueUsd;

    // Format balance for display
    const divisor = 10 ** token.decimals;
    const balanceFormatted = (Number(balance) / divisor).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });

    tokens.push({
      address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      balance: balance.toString(),
      balanceFormatted,
      priceUsd,
      valueUsd,
      logoUri: token.logo || token.thumbnail,
      isDust,
      riskScore: cachedRisk?.overall,
      riskLevel: cachedRisk?.level,
    });
  }

  // Sort tokens: dust tokens first (by value desc), then non-dust (by value desc)
  tokens.sort((a, b) => {
    if (a.isDust !== b.isDust) {
      return a.isDust ? -1 : 1;
    }
    return b.valueUsd - a.valueUsd;
  });

  const scanDurationMs = Math.round(performance.now() - startTime);

  scanLogger.info('Wallet scan completed', {
    walletAddress: normalizedAddress,
    chainId,
    totalTokens: tokens.length,
    dustTokens: dustCount,
    totalValueUsd,
    dustValueUsd,
    consolidatableValueUsd,
    scanDurationMs,
  });

  return {
    walletAddress: normalizedAddress,
    chainId,
    tokens,
    totalTokens: tokens.length,
    dustTokens: dustCount,
    totalValueUsd,
    dustValueUsd,
    consolidatableValueUsd,
    scanDurationMs,
    rpcProvider: 'moralis',
  };
}

// ============================================
// GET DUST TOKENS FOR CONSOLIDATION
// ============================================

export function getDustTokensForConsolidation(
  scanResult: ScanResult,
  options?: {
    maxTokens?: number;
    excludeHighRisk?: boolean;
    minValueUsd?: number;
  }
): ScannedToken[] {
  const {
    maxTokens = LIMITS.MAX_BATCH_SIZE,
    excludeHighRisk = true,
    minValueUsd = LIMITS.MIN_DUST_VALUE_USD,
  } = options ?? {};

  return scanResult.tokens
    .filter((token) => {
      if (!token.isDust) return false;
      if (token.valueUsd < minValueUsd) return false;
      if (excludeHighRisk && token.riskScore !== undefined && token.riskScore > 50) {
        return false;
      }
      return true;
    })
    .slice(0, maxTokens);
}
