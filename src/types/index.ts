/**
 * VORTEX PROTOCOL - TYPE DEFINITIONS
 * Comprehensive TypeScript types for the entire application
 */

import type { Address, Hex } from 'viem';

// ============================================
// BLOCKCHAIN TYPES
// ============================================

export type ChainId = 1 | 8453 | 42161 | 10 | 137 | 56 | 43114 | 838592 | 324;

export interface Chain {
  id: ChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrl: string;
  iconUrl?: string;
}

// ============================================
// TOKEN TYPES
// ============================================

export interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  chainId: ChainId;
  logoUri?: string;
  verified?: boolean;
}

export interface TokenBalance extends Token {
  balance: bigint;
  balanceFormatted: string;
  priceUsd: number;
  valueUsd: number;
  change24h?: number;
}

export interface DustToken extends TokenBalance {
  isDust: boolean;
  riskScore?: RiskScore;
  isSelected: boolean;
}

// ============================================
// RISK SCORING TYPES
// ============================================

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface RiskIndicator {
  score: number;
  weight: number;
  confidence: number;
  details?: Record<string, unknown>;
}

export interface RiskScore {
  overall: number;
  confidence: number;
  level: RiskLevel;
  timestamp: Date;
  
  layers: {
    contractSafety: RiskIndicator & {
      indicators: {
        isOpenSource: boolean;
        isProxy: boolean;
        hasMultisig: boolean;
        ownerPrivileges: 'none' | 'limited' | 'full';
        hasHiddenMint: boolean;
        hasSelfDestruct: boolean;
        externalCalls: number;
        slitherWarnings: number;
      };
    };
    
    honeypotRisk: RiskIndicator & {
      indicators: {
        isHoneypot: boolean;
        buyTaxPercent: number;
        sellTaxPercent: number;
        canSell: boolean;
        simulationPassed: boolean;
      };
    };
    
    holderConcentration: RiskIndicator & {
      indicators: {
        top10HoldersPercent: number;
        giniCoefficient: number;
        whaleCount: number;
        devWalletPercent: number;
        burnedPercent: number;
      };
    };
    
    liquidityScore: RiskIndicator & {
      indicators: {
        totalLiquidityUSD: number;
        liquidityLockedPercent: number;
        liquidityLockDuration: number;
        volumeToLiquidityRatio: number;
        priceImpact1kUSD: number;
      };
    };
    
    communityScore: RiskIndicator & {
      indicators: {
        holderCount: number;
        holderGrowth7d: number;
        twitterFollowers: number;
        twitterMentions24h: number;
        discordMembers: number;
      };
    };
    
    auditStatus: RiskIndicator & {
      indicators: {
        isAudited: boolean;
        auditor?: string;
        auditScore?: number;
        criticalIssues: number;
        mediumIssues: number;
        lastAuditDate?: Date;
      };
    };
    
    volatility: RiskIndicator & {
      indicators: {
        stdDev7d: number;
        maxDrawdown30d: number;
        sharpeRatio: number;
        beta: number;
      };
    };
    
    volumeTrend: RiskIndicator & {
      indicators: {
        volume24h: number;
        volume7d: number;
        volumeChange7d: number;
        volumeRank: number;
        uniqueTraders24h: number;
      };
    };
    
    exchangeListings: RiskIndicator & {
      indicators: {
        dexCount: number;
        cexCount: number;
        uniswapLiquidity: number;
        curvePool: boolean;
        balancerPool: boolean;
      };
    };
    
    mevProtection: RiskIndicator & {
      indicators: {
        flashbotProtected: boolean;
        hasMEVResistance: boolean;
        frontrunRisk: number;
      };
    };
    
    gasEfficiency: RiskIndicator & {
      indicators: {
        avgGasCost: number;
        gasOptimized: boolean;
      };
    };
    
    carbonImpact: RiskIndicator & {
      indicators: {
        carbonFootprint: number;
      };
    };
  };
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  walletAddress: Address;
  farcasterFid?: number;
  displayName?: string;
  avatarUrl?: string;
  
  // Gamification
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  
  // Activity
  totalScans: number;
  totalConsolidations: number;
  totalGasSavedUsd: number;
  
  // Referrals
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralEarningsUsd: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

export interface UserStats {
  rank: number;
  totalUsers: number;
  percentile: number;
  weeklyXp: number;
  monthlyXp: number;
}

// ============================================
// SCAN TYPES
// ============================================

export type ScanStatus = 'pending' | 'scanning' | 'completed' | 'failed';

export interface ScanResult {
  id: string;
  userId: string;
  walletAddress: Address;
  chainId: ChainId;
  status: ScanStatus;
  
  // Results
  totalTokens: number;
  dustTokens: number;
  totalValueUsd: number;
  dustValueUsd: number;
  tokens: DustToken[];
  
  // Performance
  scanDurationMs: number;
  rpcProvider: string;
  
  errorMessage?: string;
  createdAt: Date;
}

// ============================================
// CONSOLIDATION TYPES
// ============================================

export type ConsolidationStatus = 'pending' | 'simulating' | 'submitted' | 'confirmed' | 'failed';

export interface ConsolidationRequest {
  userId: string;
  chainId: ChainId;
  tokensIn: Address[];
  tokenOut: Address;
  amountsIn: bigint[];
  slippage: number;
}

export interface ConsolidationResult {
  id: string;
  userId: string;
  scanId?: string;
  chainId: ChainId;
  status: ConsolidationStatus;
  
  // Transaction details
  tokensIn: Address[];
  tokenOut: Address;
  amountsIn: string[];
  amountOut: string;
  amountOutUsd: number;
  
  // Costs & fees
  gasSavedUsd: number;
  protocolFeeUsd: number;
  protocolFeePercent: number;
  
  // Blockchain references
  userOpHash?: Hex;
  txHash?: Hex;
  blockNumber?: bigint;
  
  errorMessage?: string;
  
  // Timing
  createdAt: Date;
  submittedAt?: Date;
  confirmedAt?: Date;
}

// ============================================
// SWAP TYPES
// ============================================

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: bigint;
  toAmount: bigint;
  toAmountMin: bigint;
  
  priceImpact: number;
  slippage: number;
  gasEstimate: bigint;
  gasEstimateUsd: number;
  
  route: SwapRoute[];
  protocols: string[];
  
  validUntil: Date;
}

export interface SwapRoute {
  fromToken: Address;
  toToken: Address;
  protocol: string;
  poolAddress: Address;
  fee: number;
  portion: number;
}

// ============================================
// ACCOUNT ABSTRACTION TYPES
// ============================================

export interface UserOperation {
  sender: Address;
  nonce: bigint;
  factory?: Address;
  factoryData?: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymaster?: Address;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
  paymasterData?: Hex;
  signature: Hex;
}

export interface GasEstimate {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  totalGasUsd: number;
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    displayName?: string;
    walletAddress: Address;
    avatarUrl?: string;
    farcasterFid?: number;
  };
  totalXp: number;
  weeklyXp: number;
  totalConsolidations: number;
  totalGasSavedUsd: number;
  currentStreak: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalParticipants: number;
  prizePoolEth: number;
  resetDate: Date;
  userRank?: number;
}

// ============================================
// QUEST TYPES
// ============================================

export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'expired';
export type QuestType = 'scan' | 'consolidate' | 'refer' | 'streak' | 'volume' | 'social';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  xpReward: number;
  
  requirements: {
    target: number;
    current: number;
  };
  
  status: QuestStatus;
  expiresAt?: Date;
  completedAt?: Date;
}

// ============================================
// FARCASTER TYPES
// ============================================

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: Address[];
}

export interface FarcasterFrame {
  version: 'vNext';
  image: string;
  imageAspectRatio?: '1.91:1' | '1:1';
  buttons?: FarcasterButton[];
  inputText?: string;
  state?: string;
  postUrl?: string;
}

export interface FarcasterButton {
  index: 1 | 2 | 3 | 4;
  label: string;
  action: 'post' | 'post_redirect' | 'link' | 'mint' | 'tx';
  target?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: number;
    requestId: string;
    cached?: boolean;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// ERROR TYPES
// ============================================

export class VortexError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VortexError';
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_CHAIN: 'INVALID_CHAIN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Business logic errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TOKEN_NOT_SUPPORTED: 'TOKEN_NOT_SUPPORTED',
  HIGH_RISK_TOKEN: 'HIGH_RISK_TOKEN',
  SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
  
  // External service errors
  RPC_ERROR: 'RPC_ERROR',
  API_ERROR: 'API_ERROR',
  BUNDLER_ERROR: 'BUNDLER_ERROR',
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
