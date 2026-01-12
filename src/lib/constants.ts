/**
 * VORTEX PROTOCOL - CONSTANTS & CONFIGURATION
 * Centralized configuration for the entire application
 */

// ============================================
// CHAIN CONFIGURATION
// ============================================

export const CHAIN_IDS = {
  ETHEREUM: 1,
  BASE: 8453,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  BNB: 56,
  AVALANCHE: 43114,
  MONAD: 838592,
  ZKSYNC: 324,
  SOLANA: 'mainnet-beta',
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: 'Ethereum',
  [CHAIN_IDS.BASE]: 'Base',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
  [CHAIN_IDS.OPTIMISM]: 'Optimism',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.BNB]: 'BNB Chain',
  [CHAIN_IDS.AVALANCHE]: 'Avalanche',
  [CHAIN_IDS.MONAD]: 'Monad',
  [CHAIN_IDS.ZKSYNC]: 'zkSync Era',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; decimals: number; name: string }> = {
  [CHAIN_IDS.ETHEREUM]: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  [CHAIN_IDS.BASE]: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  [CHAIN_IDS.ARBITRUM]: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  [CHAIN_IDS.OPTIMISM]: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  [CHAIN_IDS.POLYGON]: { symbol: 'MATIC', decimals: 18, name: 'Polygon' },
  [CHAIN_IDS.BNB]: { symbol: 'BNB', decimals: 18, name: 'BNB' },
  [CHAIN_IDS.AVALANCHE]: { symbol: 'AVAX', decimals: 18, name: 'Avalanche' },
  [CHAIN_IDS.MONAD]: { symbol: 'MON', decimals: 18, name: 'Monad' },
  [CHAIN_IDS.ZKSYNC]: { symbol: 'ETH', decimals: 18, name: 'Ether' },
};

// ============================================
// TOKEN ADDRESSES (BASE MAINNET)
// ============================================

export const BASE_TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
  USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
} as const;

// ============================================
// CONTRACT ADDRESSES
// ============================================

export const CONTRACTS = {
  // Account Abstraction
  ENTRY_POINT_V07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  
  // 1inch Router v6
  ONEINCH_ROUTER: '0x111111125421cA6dc452d289314280a0f8842A65',
  
  // Protocol
  ADMIN_WALLET: '0xAdFB2776EB40e5218784386aa576ca9E08450127',
} as const;

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // GoPlus Security
  GOPLUS: 'https://api.gopluslabs.io/api/v1',
  
  // Honeypot Detection
  HONEYPOT: 'https://api.honeypot.is/v2',
  
  // DexScreener
  DEXSCREENER: 'https://api.dexscreener.com',
  
  // 1inch
  ONEINCH: 'https://api.1inch.dev',
  
  // 0x Protocol
  ZEROX: 'https://api.0x.org',
  
  // Moralis
  MORALIS: 'https://deep-index.moralis.io/api/v2.2',
  
  // Jupiter (Solana)
  JUPITER: 'https://quote-api.jup.ag/v6',
  
  // CoinGecko
  COINGECKO: 'https://api.coingecko.com/api/v3',
  
  // Pimlico
  PIMLICO: 'https://api.pimlico.io/v2',
  
  // Tenderly
  TENDERLY: 'https://api.tenderly.co/api/v1',
} as const;

// ============================================
// RISK SCORING CONFIGURATION
// ============================================

export const RISK_THRESHOLDS = {
  SAFE: 15,
  LOW: 30,
  MEDIUM: 50,
  HIGH: 70,
} as const;

export const RISK_WEIGHTS = {
  CONTRACT_SAFETY: 0.22,
  HONEYPOT: 0.18,
  HOLDER_CONCENTRATION: 0.18,
  LIQUIDITY: 0.13,
  COMMUNITY: 0.22,
  AUDIT: 0.09,
  VOLATILITY: 0.05,
  VOLUME: 0.05,
  MEV_PROTECTION: 0.05,
  EXCHANGE_LISTINGS: 0.03,
  GAS_EFFICIENCY: 0.02,
  CARBON_IMPACT: 0.01,
} as const;

// ============================================
// GAMIFICATION CONFIGURATION
// ============================================

export const XP_REWARDS = {
  SCAN: 10,
  CLEAN: 50,
  QUEST_EASY: 75,
  QUEST_MEDIUM: 150,
  QUEST_HARD: 375,
  REFERRAL_BONUS: 200,
  REFERRED_BONUS: 100,
  SHARE_FARCASTER: 75,
} as const;

export const STREAK_MULTIPLIERS = {
  WEEK_1: 1.2,
  WEEK_2: 1.5,
  MONTH_1: 2.0,
} as const;

export const LEADERBOARD_CONFIG = {
  TOP_WINNERS: 25,
  PRIZE_POOL_ETH: 0.15,
  RESET_FREQUENCY: 'weekly',
} as const;

// ============================================
// PROTOCOL FEES
// ============================================

export const PROTOCOL_FEES = {
  BASE_PERCENT: 0.8,
  MIN_PERCENT: 0.2,
  MAX_PERCENT: 0.6,
  REFERRAL_SHARE: 0.1, // 10% of fees to referrer
} as const;

// ============================================
// OPERATIONAL LIMITS
// ============================================

export const LIMITS = {
  MIN_SWAP_VALUE_USD: 1,
  MIN_DUST_VALUE_USD: 0.1,
  MAX_BATCH_SIZE: 20,
  MAX_SLIPPAGE_PERCENT: 0.5,
  DEXSCREENER_MIN_LIQUIDITY: 15000,
  DEXSCREENER_MAX_VOLATILITY: 0.5,
  DEXSCREENER_MIN_HOLDERS: 10,
} as const;

// ============================================
// TIMEOUTS & PERFORMANCE
// ============================================

export const TIMEOUTS = {
  SCAN_MS: 5000,
  SWAP_MS: 10000,
  RPC_MS: 3000,
  DATABASE_QUERY_MS: 1000,
  API_REQUEST_MS: 5000,
  HONEYPOT_MS: 2000,
} as const;

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 100,
  MAX_DELAY_MS: 5000,
} as const;

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMITS = {
  SCAN_PER_MINUTE: 100,
  SWAP_PER_MINUTE: 50,
  MAX_CONCURRENT_RPC: 10,
  MAX_CONCURRENT_API: 20,
} as const;

// ============================================
// CACHE TTLs (seconds)
// ============================================

export const CACHE_TTL = {
  SCAN: 300,
  PRICE: 60,
  QUEST: 3600,
  RISK_SCORE: 180,
  TOKEN_METADATA: 1800,
  USER_PROFILE: 600,
  LEADERBOARD: 120,
} as const;

export const CACHE_PREFIX = 'vortex:v1:' as const;

// ============================================
// UI CONFIGURATION
// ============================================

export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 250,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 20,
} as const;

// ============================================
// EXTERNAL LINKS
// ============================================

export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/2049foto/Vortex-',
  TWITTER: 'https://twitter.com/vortexprotocol',
  DISCORD: 'https://discord.gg/vortex',
  DOCS: 'https://docs.vortexprotocol.xyz',
  FARCASTER: 'https://warpcast.com/vortex',
} as const;
