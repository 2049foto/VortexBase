import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Get stored auth token
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vortex_token');
}

/**
 * Set auth token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vortex_token', token);
}

/**
 * Clear auth token
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('vortex_token');
  localStorage.removeItem('vortex_refresh_token');
}

/**
 * Set refresh token
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vortex_refresh_token', token);
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vortex_refresh_token');
}

/**
 * Sleep helper for retry delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create Axios instance with interceptors
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: inject JWT
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: handle 401 and retry logic
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: number };

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      // Retry logic for 5xx errors
      if (
        error.response &&
        error.response.status >= 500 &&
        originalRequest &&
        (!originalRequest._retry || originalRequest._retry < MAX_RETRIES)
      ) {
        originalRequest._retry = (originalRequest._retry || 0) + 1;
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retry - 1);
        
        await sleep(delay);
        return client.request(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface NonceResponse {
  nonce: string;
  message: string;
  expiresAt: number;
}

export interface User {
  wallet: string;
  farcasterId?: number;
  createdAt: string;
  stats: {
    totalXp: number;
    totalScans: number;
    totalConsolidations: number;
    gasSavedUsd: number;
    level: number;
  };
  ranks: {
    weekly: number | null;
    allTime: number | null;
  };
  referral: {
    code: string;
    count: number;
    earned: number;
  };
}

export interface DustToken {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  valueUsd: number;
  riskScore: number;
  riskClassification: 'safe' | 'medium' | 'high';
  excluded: boolean;
  logo?: string;
}

export interface ScanResult {
  scanId: string;
  wallet: string;
  chainId: number;
  dustTokens: DustToken[];
  dustValueUsd: number;
  dustCount: number;
  excludedCount: number;
  xpAwarded: number;
  durationMs: number;
}

export interface ConsolidationQuote {
  consolidationId: string;
  userOp: Record<string, unknown>;
  quote: {
    inputTokens: number;
    outputToken: string;
    totalOutputAmount: string;
    protocolFee: string;
    netOutputAmount: string;
  };
  message: string;
}

export interface ConsolidationResult {
  consolidationId: string;
  txHash: string;
  userOpHash: string;
  xpAwarded: number;
  message: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  farcasterId?: number;
  xpTotal: number;
  gasSavedUsd: number;
  consolidationsCount: number;
}

export interface LeaderboardResponse {
  period: string;
  entries: LeaderboardEntry[];
  userRank: number | null;
  lastUpdated: string | null;
}

export interface Quest {
  id: string;
  key: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'event';
  rewardXp: number;
  condition: {
    type: string;
    target: number;
    period?: string;
  };
  completed: boolean;
  claimed: boolean;
}

export interface XpSummary {
  totalXp: number;
  level: number;
  xpProgress: number;
  xpNeeded: number;
  progressPercent: number;
  recentTransactions: Array<{
    xpAmount: number;
    reason: string;
    createdAt: string;
  }>;
  breakdown: Record<string, number>;
}

// ============================================
// API FUNCTIONS
// ============================================

export const api = {
  // Auth
  async getNonce(wallet: string): Promise<NonceResponse> {
    const res = await apiClient.get<ApiResponse<NonceResponse>>(`/api/auth/nonce?wallet=${wallet}`);
    return res.data.data;
  },

  async verify(wallet: string, message: string, signature: string, fid?: number): Promise<AuthTokens> {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/api/auth/verify', {
      wallet,
      message,
      signature,
      fid,
    });
    return res.data.data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/api/auth/refresh', {
      refreshToken,
    });
    return res.data.data;
  },

  // User
  async getUser(): Promise<User> {
    const res = await apiClient.get<ApiResponse<{ data: User }>>('/api/user');
    return res.data.data as unknown as User;
  },

  async getConsolidations(limit = 20, offset = 0) {
    const res = await apiClient.get<ApiResponse<{ consolidations: unknown[] }>>(`/api/user/consolidations?limit=${limit}&offset=${offset}`);
    return res.data.data.consolidations;
  },

  // Scan
  async scan(wallet: string): Promise<ScanResult> {
    const res = await apiClient.post<ApiResponse<ScanResult>>('/api/scan', { wallet });
    return res.data.data;
  },

  // Risk
  async getRisk(tokenAddress: string) {
    const res = await apiClient.get<ApiResponse<{ token: string; total: number; classification: string }>>(`/api/risk/${tokenAddress}`);
    return res.data.data;
  },

  // Consolidate
  async buildConsolidation(data: {
    scanId: string;
    inputTokens: Array<{ address: string; amount: string }>;
    outputToken: string;
    slippage?: number;
  }): Promise<ConsolidationQuote> {
    const res = await apiClient.post<ApiResponse<ConsolidationQuote>>('/api/consolidate', data);
    return res.data.data;
  },

  async submitConsolidation(consolidationId: string, signedUserOp: unknown): Promise<ConsolidationResult> {
    const res = await apiClient.post<ApiResponse<ConsolidationResult>>('/api/consolidate/submit', {
      consolidationId,
      signedUserOp,
    });
    return res.data.data;
  },

  // Leaderboard
  async getLeaderboard(period: 'daily' | 'weekly' | 'all_time' = 'weekly', limit = 100): Promise<LeaderboardResponse> {
    const res = await apiClient.get<ApiResponse<LeaderboardResponse>>(`/api/leaderboard?period=${period}&limit=${limit}`);
    return res.data.data;
  },

  // XP
  async getXp(): Promise<XpSummary> {
    const res = await apiClient.get<ApiResponse<XpSummary>>('/api/xp');
    return res.data.data;
  },

  // Quests
  async getQuests(): Promise<{ quests: Quest[] }> {
    const res = await apiClient.get<ApiResponse<{ quests: Quest[] }>>('/api/quests');
    return res.data.data;
  },

  async claimQuest(questId: string): Promise<{ questId: string; xpAwarded: number }> {
    const res = await apiClient.post<ApiResponse<{ questId: string; xpAwarded: number }>>(`/api/quests/${questId}/claim`);
    return res.data.data;
  },

  // Health
  async health() {
    const res = await apiClient.get<ApiResponse<{ status: string }>>('/api/health');
    return res.data.data;
  },
};
