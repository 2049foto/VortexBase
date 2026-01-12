/**
 * VORTEX PROTOCOL - RISK ENGINE
 * 12-layer token risk assessment
 */

import { CHAIN_IDS, RISK_WEIGHTS, RISK_THRESHOLDS, API_ENDPOINTS, TIMEOUTS } from '@/lib/constants';
import { logger, createLogger } from '@/lib/logger';
import { cacheRiskScore, getCachedRiskScore } from './cache';

const riskLogger = createLogger('risk');

// ============================================
// TYPES
// ============================================

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface RiskIndicators {
  // Contract Safety
  isOpenSource: boolean;
  isProxy: boolean;
  hasMultisig: boolean;
  ownerPrivileges: 'none' | 'limited' | 'full';
  hasHiddenMint: boolean;
  hasSelfDestruct: boolean;
  
  // Honeypot
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  canSell: boolean;
  
  // Holder Distribution
  top10HoldersPercent: number;
  holderCount: number;
  
  // Liquidity
  totalLiquidityUsd: number;
  liquidityLocked: boolean;
  
  // Market
  volume24h: number;
  priceChange24h: number;
}

export interface RiskScore {
  overall: number;
  level: RiskLevel;
  confidence: number;
  indicators: Partial<RiskIndicators>;
  layerScores: {
    contractSafety: number;
    honeypotRisk: number;
    holderConcentration: number;
    liquidityScore: number;
    communityScore: number;
    auditStatus: number;
    volatility: number;
    volumeTrend: number;
    exchangeListings: number;
    mevProtection: number;
    gasEfficiency: number;
    carbonImpact: number;
  };
  timestamp: Date;
}

// ============================================
// CHAIN TO API FORMAT
// ============================================

const CHAIN_TO_GOPLUS: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: '1',
  [CHAIN_IDS.BASE]: '8453',
  [CHAIN_IDS.ARBITRUM]: '42161',
  [CHAIN_IDS.OPTIMISM]: '10',
  [CHAIN_IDS.POLYGON]: '137',
  [CHAIN_IDS.BNB]: '56',
  [CHAIN_IDS.AVALANCHE]: '43114',
  [CHAIN_IDS.ZKSYNC]: '324',
};

// ============================================
// GOPLUS API
// ============================================

interface GoPlusResponse {
  code: number;
  message: string;
  result: Record<string, GoPlusTokenData>;
}

interface GoPlusTokenData {
  is_open_source?: string;
  is_proxy?: string;
  is_mintable?: string;
  can_take_back_ownership?: string;
  owner_change_balance?: string;
  hidden_owner?: string;
  selfdestruct?: string;
  external_call?: string;
  buy_tax?: string;
  sell_tax?: string;
  is_honeypot?: string;
  honeypot_with_same_creator?: string;
  is_blacklisted?: string;
  is_whitelisted?: string;
  is_anti_whale?: string;
  anti_whale_modifiable?: string;
  cannot_buy?: string;
  cannot_sell_all?: string;
  slippage_modifiable?: string;
  personal_slippage_modifiable?: string;
  trading_cooldown?: string;
  transfer_pausable?: string;
  is_true_token?: string;
  is_airdrop_scam?: string;
  holder_count?: string;
  total_supply?: string;
  holders?: Array<{
    address: string;
    percent: string;
    is_locked: number;
    is_contract: number;
  }>;
  lp_holder_count?: string;
  lp_total_supply?: string;
  lp_holders?: Array<{
    address: string;
    percent: string;
    is_locked: number;
    is_contract: number;
  }>;
  creator_address?: string;
  creator_percent?: string;
  owner_address?: string;
  owner_percent?: string;
}

async function fetchGoPlusData(
  tokenAddress: string,
  chainId: number
): Promise<GoPlusTokenData | null> {
  const chain = CHAIN_TO_GOPLUS[chainId];
  if (!chain) return null;

  const appKey = process.env.GOPLUS_APP_KEY;
  const appSecret = process.env.GOPLUS_APP_SECRET;
  
  try {
    const url = `${API_ENDPOINTS.GOPLUS}/token_security/${chain}?contract_addresses=${tokenAddress}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // Add authentication if available
    if (appKey && appSecret) {
      headers['X-API-Key'] = appKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST_MS);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: GoPlusResponse = await response.json();
    
    if (data.code !== 1 || !data.result) {
      return null;
    }

    return data.result[tokenAddress.toLowerCase()] || null;
  } catch (error) {
    riskLogger.warn('GoPlus API call failed', { tokenAddress, chainId });
    return null;
  }
}

// ============================================
// HONEYPOT.IS API
// ============================================

interface HoneypotResponse {
  token: {
    address: string;
    name: string;
    symbol: string;
    totalHolders: number;
  };
  simulationResult: {
    buyTax: number;
    sellTax: number;
    transferTax: number;
    buyGas: string;
    sellGas: string;
  };
  honeypotResult: {
    isHoneypot: boolean;
  };
  simulationSuccess: boolean;
}

async function fetchHoneypotData(
  tokenAddress: string,
  chainId: number
): Promise<HoneypotResponse | null> {
  // Honeypot.is supports Ethereum and BSC primarily
  if (chainId !== CHAIN_IDS.ETHEREUM && chainId !== CHAIN_IDS.BNB && chainId !== CHAIN_IDS.BASE) {
    return null;
  }

  try {
    const chainParam = chainId === CHAIN_IDS.ETHEREUM ? '1' : chainId === CHAIN_IDS.BNB ? '56' : '8453';
    const url = `${API_ENDPOINTS.HONEYPOT}/IsHoneypot?address=${tokenAddress}&chainID=${chainParam}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.HONEYPOT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    riskLogger.warn('Honeypot API call failed', { tokenAddress, chainId });
    return null;
  }
}

// ============================================
// DEXSCREENER DATA
// ============================================

interface DexScreenerData {
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  txCount24h: number;
}

async function fetchDexScreenerData(
  tokenAddress: string,
  chainId: number
): Promise<DexScreenerData | null> {
  const chainMap: Record<number, string> = {
    [CHAIN_IDS.ETHEREUM]: 'ethereum',
    [CHAIN_IDS.BASE]: 'base',
    [CHAIN_IDS.ARBITRUM]: 'arbitrum',
    [CHAIN_IDS.OPTIMISM]: 'optimism',
    [CHAIN_IDS.POLYGON]: 'polygon',
    [CHAIN_IDS.BNB]: 'bsc',
    [CHAIN_IDS.AVALANCHE]: 'avalanche',
    [CHAIN_IDS.ZKSYNC]: 'zksync',
  };

  const chain = chainMap[chainId];
  if (!chain) return null;

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const pairs = (data.pairs || []).filter((p: { chainId: string }) => p.chainId === chain);
    
    if (pairs.length === 0) {
      return null;
    }

    // Aggregate data from all pairs
    let totalLiquidity = 0;
    let totalVolume = 0;
    let totalTxCount = 0;
    let priceChange = 0;

    for (const pair of pairs) {
      totalLiquidity += pair.liquidity?.usd || 0;
      totalVolume += pair.volume?.h24 || 0;
      totalTxCount += (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
      priceChange = pair.priceChange?.h24 || 0; // Use last pair's price change
    }

    return {
      liquidity: totalLiquidity,
      volume24h: totalVolume,
      priceChange24h: priceChange,
      txCount24h: totalTxCount,
    };
  } catch (error) {
    riskLogger.warn('DexScreener API call failed', { tokenAddress, chainId });
    return null;
  }
}

// ============================================
// SCORE CALCULATIONS
// ============================================

function calculateContractSafetyScore(goplus: GoPlusTokenData | null): number {
  if (!goplus) return 50; // Neutral if no data

  let score = 100;

  // Critical red flags (each -30)
  if (goplus.is_honeypot === '1') score -= 50;
  if (goplus.selfdestruct === '1') score -= 30;
  if (goplus.hidden_owner === '1') score -= 30;
  
  // Major red flags (each -20)
  if (goplus.is_mintable === '1') score -= 20;
  if (goplus.can_take_back_ownership === '1') score -= 20;
  if (goplus.owner_change_balance === '1') score -= 20;
  if (goplus.external_call === '1') score -= 15;
  
  // Moderate flags (each -10)
  if (goplus.is_proxy === '1') score -= 10;
  if (goplus.transfer_pausable === '1') score -= 10;
  if (goplus.trading_cooldown === '1') score -= 10;
  
  // Positive signals
  if (goplus.is_open_source === '1') score += 10;
  if (goplus.is_true_token === '1') score += 5;

  return Math.max(0, Math.min(100, score));
}

function calculateHoneypotScore(
  goplus: GoPlusTokenData | null,
  honeypot: HoneypotResponse | null
): number {
  let score = 100;

  // GoPlus honeypot detection
  if (goplus?.is_honeypot === '1') score -= 80;
  if (goplus?.cannot_sell_all === '1') score -= 60;
  if (goplus?.cannot_buy === '1') score -= 40;

  // Tax analysis from GoPlus
  const buyTax = parseFloat(goplus?.buy_tax || '0') * 100;
  const sellTax = parseFloat(goplus?.sell_tax || '0') * 100;
  
  if (buyTax > 10 || sellTax > 10) score -= 30;
  else if (buyTax > 5 || sellTax > 5) score -= 15;
  else if (buyTax > 2 || sellTax > 2) score -= 5;

  // Honeypot.is verification
  if (honeypot) {
    if (honeypot.honeypotResult?.isHoneypot) score -= 50;
    if (!honeypot.simulationSuccess) score -= 20;
    
    const hpBuyTax = honeypot.simulationResult?.buyTax || 0;
    const hpSellTax = honeypot.simulationResult?.sellTax || 0;
    
    if (hpBuyTax > 10 || hpSellTax > 10) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateHolderConcentrationScore(goplus: GoPlusTokenData | null): number {
  if (!goplus?.holders || goplus.holders.length === 0) return 50;

  let score = 100;

  // Calculate top 10 holders percentage
  const top10Percent = goplus.holders
    .slice(0, 10)
    .reduce((sum, h) => sum + parseFloat(h.percent || '0'), 0) * 100;

  if (top10Percent > 80) score -= 60;
  else if (top10Percent > 60) score -= 40;
  else if (top10Percent > 40) score -= 20;
  else if (top10Percent > 20) score -= 10;

  // Holder count
  const holderCount = parseInt(goplus.holder_count || '0');
  if (holderCount < 10) score -= 40;
  else if (holderCount < 50) score -= 20;
  else if (holderCount < 100) score -= 10;
  else if (holderCount > 1000) score += 10;

  // Creator/owner holdings
  const creatorPercent = parseFloat(goplus.creator_percent || '0') * 100;
  const ownerPercent = parseFloat(goplus.owner_percent || '0') * 100;
  
  if (creatorPercent > 50 || ownerPercent > 50) score -= 30;
  else if (creatorPercent > 20 || ownerPercent > 20) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function calculateLiquidityScore(dexData: DexScreenerData | null): number {
  if (!dexData) return 30; // Low score if no DEX data

  let score = 50; // Start at neutral

  // Liquidity
  if (dexData.liquidity >= 100000) score += 30;
  else if (dexData.liquidity >= 50000) score += 20;
  else if (dexData.liquidity >= 15000) score += 10;
  else if (dexData.liquidity < 5000) score -= 20;

  // Volume
  if (dexData.volume24h >= 100000) score += 15;
  else if (dexData.volume24h >= 10000) score += 10;
  else if (dexData.volume24h < 1000) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function calculateVolatilityScore(dexData: DexScreenerData | null): number {
  if (!dexData) return 50;

  let score = 100;
  const absChange = Math.abs(dexData.priceChange24h);

  if (absChange > 50) score -= 50;
  else if (absChange > 30) score -= 30;
  else if (absChange > 20) score -= 20;
  else if (absChange > 10) score -= 10;
  else if (absChange < 5) score += 10;

  return Math.max(0, Math.min(100, score));
}

// ============================================
// RISK LEVEL DETERMINATION
// ============================================

function determineRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.SAFE) return 'safe';
  if (score <= RISK_THRESHOLDS.LOW) return 'low';
  if (score <= RISK_THRESHOLDS.MED) return 'medium';
  if (score <= RISK_THRESHOLDS.HIGH) return 'high';
  return 'critical';
}

// ============================================
// MAIN RISK ASSESSMENT FUNCTION
// ============================================

export async function assessTokenRisk(
  tokenAddress: string,
  chainId: number
): Promise<RiskScore> {
  const normalizedAddress = tokenAddress.toLowerCase();

  // Check cache first
  const cached = await getCachedRiskScore(normalizedAddress, chainId);
  if (cached) {
    return {
      overall: cached.overall,
      level: cached.level as RiskLevel,
      confidence: cached.confidence,
      indicators: {},
      layerScores: {
        contractSafety: 0,
        honeypotRisk: 0,
        holderConcentration: 0,
        liquidityScore: 0,
        communityScore: 0,
        auditStatus: 0,
        volatility: 0,
        volumeTrend: 0,
        exchangeListings: 0,
        mevProtection: 0,
        gasEfficiency: 0,
        carbonImpact: 0,
      },
      timestamp: new Date(),
    };
  }

  riskLogger.info('Assessing token risk', { tokenAddress: normalizedAddress, chainId });

  // Fetch data from all sources in parallel
  const [goPlusData, honeypotData, dexData] = await Promise.all([
    fetchGoPlusData(normalizedAddress, chainId),
    fetchHoneypotData(normalizedAddress, chainId),
    fetchDexScreenerData(normalizedAddress, chainId),
  ]);

  // Calculate layer scores
  const layerScores = {
    contractSafety: calculateContractSafetyScore(goPlusData),
    honeypotRisk: calculateHoneypotScore(goPlusData, honeypotData),
    holderConcentration: calculateHolderConcentrationScore(goPlusData),
    liquidityScore: calculateLiquidityScore(dexData),
    communityScore: 50, // Would need social API
    auditStatus: 50, // Would need audit database
    volatility: calculateVolatilityScore(dexData),
    volumeTrend: dexData ? Math.min(100, 50 + dexData.volume24h / 1000) : 50,
    exchangeListings: 50, // Would need exchange APIs
    mevProtection: 50, // Would need MEV analysis
    gasEfficiency: 50, // Standard for now
    carbonImpact: 50, // Standard for now
  };

  // Calculate weighted overall score (inverted - higher = more risky)
  const weightedScore =
    (100 - layerScores.contractSafety) * RISK_WEIGHTS.CONTRACT_SAFETY +
    (100 - layerScores.honeypotRisk) * RISK_WEIGHTS.HONEYPOT +
    (100 - layerScores.holderConcentration) * RISK_WEIGHTS.HOLDER_CONCENTRATION +
    (100 - layerScores.liquidityScore) * RISK_WEIGHTS.LIQUIDITY +
    (100 - layerScores.communityScore) * RISK_WEIGHTS.COMMUNITY +
    (100 - layerScores.auditStatus) * RISK_WEIGHTS.AUDIT +
    (100 - layerScores.volatility) * RISK_WEIGHTS.VOLATILITY +
    (100 - layerScores.volumeTrend) * RISK_WEIGHTS.VOLUME +
    (100 - layerScores.exchangeListings) * RISK_WEIGHTS.EXCHANGE_LISTINGS +
    (100 - layerScores.mevProtection) * RISK_WEIGHTS.MEV_PROTECTION +
    (100 - layerScores.gasEfficiency) * RISK_WEIGHTS.GAS_EFFICIENCY +
    (100 - layerScores.carbonImpact) * RISK_WEIGHTS.CARBON_IMPACT;

  const overall = Math.round(weightedScore);
  const level = determineRiskLevel(overall);

  // Calculate confidence based on data availability
  let confidence = 0;
  if (goPlusData) confidence += 0.4;
  if (honeypotData) confidence += 0.3;
  if (dexData) confidence += 0.3;

  // Build indicators
  const indicators: Partial<RiskIndicators> = {};
  
  if (goPlusData) {
    indicators.isOpenSource = goPlusData.is_open_source === '1';
    indicators.isProxy = goPlusData.is_proxy === '1';
    indicators.hasHiddenMint = goPlusData.is_mintable === '1';
    indicators.hasSelfDestruct = goPlusData.selfdestruct === '1';
    indicators.isHoneypot = goPlusData.is_honeypot === '1';
    indicators.buyTax = parseFloat(goPlusData.buy_tax || '0') * 100;
    indicators.sellTax = parseFloat(goPlusData.sell_tax || '0') * 100;
    indicators.canSell = goPlusData.cannot_sell_all !== '1';
    indicators.holderCount = parseInt(goPlusData.holder_count || '0');
    
    if (goPlusData.holders && goPlusData.holders.length > 0) {
      indicators.top10HoldersPercent = goPlusData.holders
        .slice(0, 10)
        .reduce((sum, h) => sum + parseFloat(h.percent || '0'), 0) * 100;
    }
  }

  if (dexData) {
    indicators.totalLiquidityUsd = dexData.liquidity;
    indicators.volume24h = dexData.volume24h;
    indicators.priceChange24h = dexData.priceChange24h;
  }

  const result: RiskScore = {
    overall,
    level,
    confidence,
    indicators,
    layerScores,
    timestamp: new Date(),
  };

  // Cache the result
  await cacheRiskScore(normalizedAddress, chainId, {
    overall,
    level,
    confidence,
  });

  riskLogger.info('Risk assessment completed', {
    tokenAddress: normalizedAddress,
    chainId,
    overall,
    level,
    confidence,
  });

  return result;
}

// ============================================
// BATCH RISK ASSESSMENT
// ============================================

export async function assessMultipleTokensRisk(
  tokens: Array<{ address: string; chainId: number }>
): Promise<Map<string, RiskScore>> {
  const results = new Map<string, RiskScore>();

  // Process in batches to avoid rate limits
  const batchSize = 5;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((token) => assessTokenRisk(token.address, token.chainId))
    );

    batchResults.forEach((result, index) => {
      const token = batch[index]!;
      const key = `${token.chainId}:${token.address.toLowerCase()}`;

      if (result.status === 'fulfilled') {
        results.set(key, result.value);
      } else {
        // Return a default high-risk score on failure
        results.set(key, {
          overall: 70,
          level: 'high',
          confidence: 0,
          indicators: {},
          layerScores: {
            contractSafety: 30,
            honeypotRisk: 30,
            holderConcentration: 50,
            liquidityScore: 30,
            communityScore: 50,
            auditStatus: 50,
            volatility: 50,
            volumeTrend: 50,
            exchangeListings: 50,
            mevProtection: 50,
            gasEfficiency: 50,
            carbonImpact: 50,
          },
          timestamp: new Date(),
        });
      }
    });

    // Small delay between batches
    if (i + batchSize < tokens.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}
