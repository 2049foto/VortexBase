/**
 * VORTEX API - RPC Service with Failover
 * Alchemy (primary) → QuickNode → Ankr/Public
 * 
 * Features:
 * - Automatic failover on error
 * - 5s timeout per call
 * - Exponential backoff retry (2x)
 * - Latency logging
 */

import { createPublicClient, http, type Hex, type Address } from 'viem';
import { base } from 'viem/chains';

import { RPC_URLS, CHAIN_ID } from '../env';
import { log } from '../middleware/logger';

// ============================================
// CONFIGURATION
// ============================================

const RPC_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Exported config for testing
export const RPC_CONFIG = {
  TIMEOUT_MS: RPC_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS: INITIAL_RETRY_DELAY_MS,
} as const;

interface RpcConfig {
  name: string;
  url: string | null;
}

// RPC providers in priority order (filter out null URLs)
const rpcProviders: Array<{ name: string; url: string }> = [
  { name: 'Alchemy', url: RPC_URLS.PRIMARY },
  RPC_URLS.FALLBACK_1 ? { name: 'QuickNode', url: RPC_URLS.FALLBACK_1 } : null,
  RPC_URLS.FALLBACK_2 ? { name: 'Ankr', url: RPC_URLS.FALLBACK_2 } : null,
].filter((p): p is { name: string; url: string } => p !== null);

let currentProviderIndex = 0;

// ============================================
// CLIENT MANAGEMENT
// ============================================

function createClient(url: string) {
  return createPublicClient({
    chain: base,
    transport: http(url, {
      timeout: RPC_TIMEOUT_MS,
      retryCount: 0, // We handle retries ourselves
    }),
  });
}

/**
 * Get a viem client using the primary RPC provider
 * Used for simple operations that don't need failover
 */
export function getClient() {
  const provider = rpcProviders[currentProviderIndex] || rpcProviders[0];
  return createClient(provider.url);
}

// ============================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  providerName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const startTime = performance.now();
      const result = await fn();
      const latency = Math.round(performance.now() - startTime);
      
      log.debug({ provider: providerName, latency: `${latency}ms`, attempt }, 'RPC call succeeded');
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        log.warn({ 
          provider: providerName, 
          attempt: attempt + 1, 
          maxRetries,
          delay: `${delay}ms`,
          error: lastError.message 
        }, 'RPC call failed, retrying');
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

// ============================================
// FAILOVER LOGIC
// ============================================

export async function withRpcFallback<T>(
  fn: (client: ReturnType<typeof createClient>) => Promise<T>,
  operationName: string = 'RPC call'
): Promise<T> {
  const errors: Array<{ provider: string; error: string }> = [];
  
  for (let i = 0; i < rpcProviders.length; i++) {
    const providerIndex = (currentProviderIndex + i) % rpcProviders.length;
    const provider = rpcProviders[providerIndex];
    
    try {
      const client = createClient(provider.url);
      
      const result = await withRetry(
        () => fn(client),
        provider.name
      );
      
      // Update current provider if we switched
      if (providerIndex !== currentProviderIndex) {
        log.info({ 
          from: rpcProviders[currentProviderIndex].name,
          to: provider.name,
          operation: operationName
        }, 'RPC failover occurred');
        currentProviderIndex = providerIndex;
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ provider: provider.name, error: errorMessage });
      log.warn({ 
        provider: provider.name, 
        error: errorMessage,
        operation: operationName
      }, 'RPC provider failed');
    }
  }
  
  // All providers failed
  const errorDetails = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
  log.error({ errors, operation: operationName }, 'All RPC providers failed');
  throw new Error(`All RPC providers failed for ${operationName}: ${errorDetails}`);
}

// ============================================
// PUBLIC CLIENT ACCESS
// ============================================

export function getPublicClient() {
  if (rpcProviders.length === 0) {
    throw new Error('No RPC endpoints available');
  }
  const provider = rpcProviders[currentProviderIndex] ?? rpcProviders[0];
  return createClient(provider.url);
}

// ============================================
// COMMON RPC METHODS
// ============================================

export async function getChainId(): Promise<number> {
  return withRpcFallback(
    (client) => client.getChainId(),
    'eth_chainId'
  );
}

export async function getBlockNumber(): Promise<bigint> {
  return withRpcFallback(
    (client) => client.getBlockNumber(),
    'eth_blockNumber'
  );
}

export async function getBalance(address: Address): Promise<bigint> {
  return withRpcFallback(
    (client) => client.getBalance({ address }),
    'eth_getBalance'
  );
}

export async function call(params: {
  to: Address;
  data: Hex;
}): Promise<Hex> {
  return withRpcFallback(
    (client) => client.call({
      to: params.to,
      data: params.data,
    }).then(r => r.data as Hex),
    'eth_call'
  );
}

export async function getTransactionReceipt(hash: Hex) {
  return withRpcFallback(
    (client) => client.getTransactionReceipt({ hash }),
    'eth_getTransactionReceipt'
  );
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkRpcHealth(): Promise<{
  healthy: boolean;
  provider: string;
  blockNumber: bigint;
  chainId: number;
  latencyMs: number;
}> {
  const startTime = performance.now();
  
  try {
    const [chainId, blockNumber] = await Promise.all([
      getChainId(),
      getBlockNumber(),
    ]);
    
    const latencyMs = Math.round(performance.now() - startTime);
    const provider = rpcProviders[currentProviderIndex].name;
    
    // Verify we're on Base
    if (chainId !== CHAIN_ID) {
      throw new Error(`Wrong chain: expected ${CHAIN_ID}, got ${chainId}`);
    }
    
    return {
      healthy: true,
      provider,
      blockNumber,
      chainId,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      healthy: false,
      provider: 'none',
      blockNumber: 0n,
      chainId: 0,
      latencyMs,
    };
  }
}
