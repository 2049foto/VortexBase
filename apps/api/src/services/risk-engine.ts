/**
 * VORTEX API - Risk Engine
 * 12-layer risk scoring using GoPlus, Honeypot.is, DexScreener
 * 
 * Features:
 * - 5s timeout per API
 * - Parallel API calls
 * - Weighted risk aggregation
 * - Auto-exclude high risk (>75)
 * - Redis caching (TTL 180s)
 */

import { env, CHAIN_ID } from '../env';
import { getOrFetch, cacheKey, CACHE_TTL } from './cache';
import { log } from '../middleware/logger';

// ============================================
// CONFIGURATION
// ============================================

const API_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

// Risk thresholds - exported for testing
export const RISK_THRESHOLDS = {
  SAFE: 20,
  MEDIUM: 70,
  HIGH_RISK_EXCLUDE: 75,
} as const;

// For backwards compatibility
const RISK_THRESHOLD = RISK_THRESHOLDS;

// Safe tokens list - these always get score 0
export const SAFE_TOKENS = new Set([
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
  '0x4200000000000000000000000000000000000006', // WETH
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', // DAI
  '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22', // cbETH
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', // USDbC
]);

// Risk classification function - exported for testing
export type RiskClassification = 'safe' | 'medium' | 'high';

export function classifyRisk(score: number): RiskClassification {
  if (score < RISK_THRESHOLDS.SAFE) return 'safe';
  if (score < RISK_THRESHOLDS.MEDIUM) return 'medium';
  return 'high';
}

// ============================================
// TYPES
// ============================================

export interface RiskScore {
  total: number; // 0-100
  classification: 'safe' | 'medium' | 'high';
  layers: {
    contractSafety: number;
    honeypotRisk: number;
    liquidityScore: number;
    rugPullRisk: number;
    ownershipRisk: number;
    proxyRisk: number;
    mintRisk: number;
    taxRisk: number;
    holderDistribution: number;
    ageScore: number;
    volumeScore: number;
    auditStatus: number;
  };
  flags: string[];
  excluded: boolean;
}

// ============================================
// HELPERS
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      log.warn({ url }, 'Risk API timeout');
    } else {
      log.warn({ url, error: (error as Error).message }, 'Risk API failed');
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = MAX_RETRIES
): Promise<T | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fetchWithTimeout<T>(url, options);
    if (result !== null) {
      return result;
    }

    if (attempt < maxRetries) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  return null;
}

// ============================================
// GOPLUS API
// ============================================

interface GoPlusResult {
  is_honeypot?: string;
  is_proxy?: string;
  is_mintable?: string;
  can_take_back_ownership?: string;
  owner_change_balance?: string;
  hidden_owner?: string;
  selfdestruct?: string;
  buy_tax?: string;
  sell_tax?: string;
  holder_count?: string;
  total_supply?: string;
  creator_percent?: string;
  lp_holder_count?: string;
}

interface GoPlusResponse {
  code: number;
  result: Record<string, GoPlusResult>;
}

async function fetchGoPlusData(tokenAddress: string): Promise<GoPlusResult | null> {
  const url = `https://api.gopluslabs.io/api/v1/token_security/${CHAIN_ID}?contract_addresses=${tokenAddress}`;

  const response = await fetchWithRetry<GoPlusResponse>(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response || response.code !== 1) {
    return null;
  }

  return response.result?.[tokenAddress.toLowerCase()] || null;
}

// ============================================
// HONEYPOT.IS API
// ============================================

interface HoneypotResponse {
  honeypotResult?: { isHoneypot: boolean };
  simulationSuccess?: boolean;
  simulationResult?: {
    buyTax?: number;
    sellTax?: number;
  };
  pair?: {
    liquidity?: number;
  };
}

interface HoneypotResult {
  isHoneypot: boolean;
  simulationSuccess: boolean;
  buyTax: number;
  sellTax: number;
  liquidity: number;
}

async function fetchHoneypotData(tokenAddress: string): Promise<HoneypotResult | null> {
  const url = `https://api.honeypot.is/v2/IsHoneypot?address=${tokenAddress}&chainID=${CHAIN_ID}`;

  const response = await fetchWithRetry<HoneypotResponse>(url);

  if (!response) {
    return null;
  }

  return {
    isHoneypot: response.honeypotResult?.isHoneypot ?? false,
    simulationSuccess: response.simulationSuccess ?? true,
    buyTax: response.simulationResult?.buyTax ?? 0,
    sellTax: response.simulationResult?.sellTax ?? 0,
    liquidity: response.pair?.liquidity ?? 0,
  };
}

// ============================================
// DEXSCREENER API
// ============================================

interface DexScreenerPair {
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  fdv?: number;
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

interface DexScreenerResult {
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  fdv: number;
}

async function fetchDexScreenerData(tokenAddress: string): Promise<DexScreenerResult | null> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;

  const response = await fetchWithRetry<DexScreenerResponse>(url);

  if (!response || !response.pairs || response.pairs.length === 0) {
    return null;
  }

  const pair = response.pairs[0];
  return {
    liquidity: pair.liquidity?.usd ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    priceChange24h: pair.priceChange?.h24 ?? 0,
    fdv: pair.fdv ?? 0,
  };
}

// ============================================
// RISK SCORING LOGIC
// ============================================

function calculateScore(
  goplus: GoPlusResult | null,
  honeypot: HoneypotResult | null,
  dexscreener: DexScreenerResult | null
): RiskScore {
  const flags: string[] = [];

  // Layer 1: Contract Safety (GoPlus)
  let contractSafety = 0;
  if (goplus) {
    if (goplus.hidden_owner === '1') {
      contractSafety += 25;
      flags.push('hidden_owner');
    }
    if (goplus.selfdestruct === '1') {
      contractSafety += 25;
      flags.push('selfdestruct');
    }
  }

  // Layer 2: Honeypot Risk
  let honeypotRisk = 0;
  if (honeypot?.isHoneypot) {
    honeypotRisk = 100;
    flags.push('honeypot');
  } else if (honeypot && !honeypot.simulationSuccess) {
    honeypotRisk = 50;
    flags.push('simulation_failed');
  }

  // Layer 3: Liquidity Score
  let liquidityScore = 0;
  const liquidity = dexscreener?.liquidity || honeypot?.liquidity || 0;
  if (liquidity < 1000) {
    liquidityScore = 80;
    flags.push('low_liquidity');
  } else if (liquidity < 10000) {
    liquidityScore = 50;
  } else if (liquidity < 100000) {
    liquidityScore = 20;
  }

  // Layer 4: Rug Pull Risk
  let rugPullRisk = 0;
  if (goplus) {
    if (goplus.can_take_back_ownership === '1') {
      rugPullRisk += 30;
      flags.push('can_take_ownership');
    }
    if (goplus.owner_change_balance === '1') {
      rugPullRisk += 30;
      flags.push('owner_can_change_balance');
    }
  }

  // Layer 5: Ownership Risk
  let ownershipRisk = 0;
  if (goplus) {
    const creatorPercent = parseFloat(goplus.creator_percent || '0');
    if (creatorPercent > 50) {
      ownershipRisk = 60;
      flags.push('high_creator_concentration');
    } else if (creatorPercent > 20) {
      ownershipRisk = 30;
    }
  }

  // Layer 6: Proxy Risk
  let proxyRisk = 0;
  if (goplus?.is_proxy === '1') {
    proxyRisk = 20;
    flags.push('is_proxy');
  }

  // Layer 7: Mint Risk
  let mintRisk = 0;
  if (goplus?.is_mintable === '1') {
    mintRisk = 30;
    flags.push('is_mintable');
  }

  // Layer 8: Tax Risk
  let taxRisk = 0;
  const buyTax = honeypot?.buyTax || parseFloat(goplus?.buy_tax || '0');
  const sellTax = honeypot?.sellTax || parseFloat(goplus?.sell_tax || '0');
  if (buyTax > 10 || sellTax > 10) {
    taxRisk = 50;
    flags.push('high_tax');
  } else if (buyTax > 5 || sellTax > 5) {
    taxRisk = 25;
  }

  // Layer 9: Holder Distribution
  let holderDistribution = 0;
  if (goplus) {
    const holderCount = parseInt(goplus.holder_count || '0');
    if (holderCount < 50) {
      holderDistribution = 50;
      flags.push('few_holders');
    } else if (holderCount < 200) {
      holderDistribution = 25;
    }
  }

  // Layer 10: Age Score (simplified)
  const ageScore = 0;

  // Layer 11: Volume Score
  let volumeScore = 0;
  if (dexscreener) {
    if (dexscreener.volume24h < 100) {
      volumeScore = 40;
      flags.push('low_volume');
    } else if (dexscreener.volume24h < 1000) {
      volumeScore = 20;
    }
  }

  // Layer 12: Audit Status (simplified)
  const auditStatus = 0;

  // Calculate weighted average
  const weights = {
    contractSafety: 0.15,
    honeypotRisk: 0.20,
    liquidityScore: 0.10,
    rugPullRisk: 0.15,
    ownershipRisk: 0.10,
    proxyRisk: 0.05,
    mintRisk: 0.05,
    taxRisk: 0.08,
    holderDistribution: 0.05,
    ageScore: 0.02,
    volumeScore: 0.03,
    auditStatus: 0.02,
  };

  const layers = {
    contractSafety,
    honeypotRisk,
    liquidityScore,
    rugPullRisk,
    ownershipRisk,
    proxyRisk,
    mintRisk,
    taxRisk,
    holderDistribution,
    ageScore,
    volumeScore,
    auditStatus,
  };

  const total = Math.round(
    Object.entries(layers).reduce((sum, [key, value]) => {
      return sum + value * weights[key as keyof typeof weights];
    }, 0)
  );

  // Classification
  let classification: 'safe' | 'medium' | 'high' = 'safe';
  if (total > RISK_THRESHOLD.MEDIUM) {
    classification = 'high';
  } else if (total > RISK_THRESHOLD.SAFE) {
    classification = 'medium';
  }

  // Auto-exclude high risk
  const excluded = total > RISK_THRESHOLD.HIGH_RISK_EXCLUDE || honeypot?.isHoneypot === true;

  return {
    total,
    classification,
    layers,
    flags,
    excluded,
  };
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Calculate risk score for a single token
 */
export async function calculateRiskScore(tokenAddress: string): Promise<RiskScore> {
  // Validate address
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    throw new Error('Invalid token address format');
  }

  return getOrFetch<RiskScore>(
    cacheKey.risk(tokenAddress),
    async () => {
      const startTime = performance.now();

      // Fetch all data in parallel
      const [goplus, honeypot, dexscreener] = await Promise.all([
        fetchGoPlusData(tokenAddress),
        fetchHoneypotData(tokenAddress),
        fetchDexScreenerData(tokenAddress),
      ]);

      const score = calculateScore(goplus, honeypot, dexscreener);

      const durationMs = Math.round(performance.now() - startTime);
      log.info({
        token: tokenAddress,
        score: score.total,
        classification: score.classification,
        excluded: score.excluded,
        flagCount: score.flags.length,
        durationMs,
      }, 'Risk score calculated');

      return score;
    },
    CACHE_TTL.RISK_SCORE
  );
}

/**
 * Calculate risk scores for multiple tokens in batch
 */
export async function calculateBatchRiskScores(
  tokenAddresses: string[]
): Promise<Record<string, RiskScore>> {
  const results: Record<string, RiskScore> = {};

  // Process in parallel with concurrency limit
  const batchSize = 5;
  
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((addr) => 
        calculateRiskScore(addr).catch((error) => {
          log.error({ token: addr, error: (error as Error).message }, 'Failed to calculate risk');
          // Return safe score on error
          return {
            total: 0,
            classification: 'safe' as const,
            layers: {
              contractSafety: 0,
              honeypotRisk: 0,
              liquidityScore: 0,
              rugPullRisk: 0,
              ownershipRisk: 0,
              proxyRisk: 0,
              mintRisk: 0,
              taxRisk: 0,
              holderDistribution: 0,
              ageScore: 0,
              volumeScore: 0,
              auditStatus: 0,
            },
            flags: ['error_calculating'],
            excluded: false,
          };
        })
      )
    );

    batch.forEach((addr, idx) => {
      results[addr.toLowerCase()] = batchResults[idx];
    });
  }

  return results;
}

// ============================================
// EXPORTS
// ============================================

export { RISK_THRESHOLD };
