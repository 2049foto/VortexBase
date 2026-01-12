/**
 * VORTEX PROTOCOL - RPC SERVICE
 * Multi-provider RPC with fallback
 */

import { createPublicClient, http, type PublicClient, type Chain } from 'viem';
import { base, mainnet, arbitrum, optimism, polygon, bsc, avalanche, zkSync } from 'viem/chains';

import { CHAIN_IDS, TIMEOUTS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { ExternalServiceError, ErrorCodes } from '@/lib/errors';

// ============================================
// CHAIN CONFIGURATIONS
// ============================================

const CHAIN_CONFIGS: Record<number, Chain> = {
  [CHAIN_IDS.ETHEREUM]: mainnet,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.ARBITRUM]: arbitrum,
  [CHAIN_IDS.OPTIMISM]: optimism,
  [CHAIN_IDS.POLYGON]: polygon,
  [CHAIN_IDS.BNB]: bsc,
  [CHAIN_IDS.AVALANCHE]: avalanche,
  [CHAIN_IDS.ZKSYNC]: zkSync,
};

// ============================================
// RPC ENDPOINTS (Prioritized)
// ============================================

function getRpcEndpoints(chainId: number): string[] {
  switch (chainId) {
    case CHAIN_IDS.BASE:
      return [
        process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS,
        process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC,
        process.env.NEXT_PUBLIC_INFURA_BASE_HTTPS,
        process.env.BASE_PUBLIC_RPC,
        process.env.BASE_PUBLIC_RPC_2,
        'https://mainnet.base.org',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.ETHEREUM:
      return [
        process.env.ALCHEMY_ETH_RPC,
        process.env.INFURA_ETH_HTTPS,
        process.env.ETH_PUBLIC_RPC,
        'https://eth.llamarpc.com',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.ARBITRUM:
      return [
        process.env.ALCHEMY_ARB_RPC,
        process.env.INFURA_ARB_HTTPS,
        process.env.ARB_PUBLIC_RPC,
        'https://arb1.arbitrum.io/rpc',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.OPTIMISM:
      return [
        process.env.ALCHEMY_OPT_RPC,
        process.env.INFURA_OPT_HTTPS,
        process.env.OPT_PUBLIC_RPC,
        'https://mainnet.optimism.io',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.POLYGON:
      return [
        process.env.ALCHEMY_POLYGON_RPC,
        process.env.INFURA_POLYGON_HTTPS,
        process.env.POLYGON_PUBLIC_RPC,
        'https://polygon-rpc.com',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.BNB:
      return [
        process.env.ALCHEMY_BNB_RPC,
        process.env.INFURA_BNB_HTTPS,
        process.env.BNB_PUBLIC_RPC,
        'https://bsc-dataseed.binance.org',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.AVALANCHE:
      return [
        process.env.ALCHEMY_AVAX_RPC,
        process.env.INFURA_AVAX_HTTPS,
        process.env.AVAX_PUBLIC_RPC,
        'https://api.avax.network/ext/bc/C/rpc',
      ].filter(Boolean) as string[];

    case CHAIN_IDS.ZKSYNC:
      return [
        process.env.ALCHEMY_ZKSYNC_RPC,
        process.env.INFURA_ZKSYNC_HTTPS,
        process.env.ZKSYNC_PUBLIC_RPC,
        'https://mainnet.era.zksync.io',
      ].filter(Boolean) as string[];

    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

// ============================================
// CLIENT CACHE
// ============================================

const clientCache = new Map<string, PublicClient>();

function getClientKey(chainId: number, rpcUrl: string): string {
  return `${chainId}:${rpcUrl}`;
}

// ============================================
// CREATE CLIENT
// ============================================

function createClient(chainId: number, rpcUrl: string): PublicClient {
  const key = getClientKey(chainId, rpcUrl);
  
  if (clientCache.has(key)) {
    return clientCache.get(key)!;
  }

  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl, {
      timeout: TIMEOUTS.RPC_MS,
      retryCount: 0, // We handle retries ourselves
    }),
  });

  clientCache.set(key, client);
  return client;
}

// ============================================
// GET CLIENT WITH FALLBACK
// ============================================

export async function getPublicClient(chainId: number): Promise<PublicClient> {
  const endpoints = getRpcEndpoints(chainId);
  
  if (endpoints.length === 0) {
    throw new ExternalServiceError(
      `No RPC endpoints configured for chain ${chainId}`,
      'rpc',
      ErrorCodes.RPC_ERROR
    );
  }

  // Return first available endpoint (already prioritized)
  return createClient(chainId, endpoints[0]!);
}

// ============================================
// EXECUTE WITH FALLBACK
// ============================================

export async function executeWithFallback<T>(
  chainId: number,
  operation: (client: PublicClient) => Promise<T>,
  operationName: string
): Promise<{ result: T; provider: string }> {
  const endpoints = getRpcEndpoints(chainId);
  const errors: Error[] = [];

  for (const endpoint of endpoints) {
    try {
      const client = createClient(chainId, endpoint);
      const result = await operation(client);
      
      // Extract provider name for logging
      const provider = endpoint.includes('quicknode')
        ? 'quicknode'
        : endpoint.includes('alchemy')
        ? 'alchemy'
        : endpoint.includes('infura')
        ? 'infura'
        : 'public';

      return { result, provider };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      
      logger.warn(`RPC call failed on ${endpoint}`, {
        chainId,
        operation: operationName,
        error: err.message,
      });
      
      // Continue to next endpoint
    }
  }

  // All endpoints failed
  const errorMessages = errors.map((e) => e.message).join('; ');
  throw new ExternalServiceError(
    `All RPC endpoints failed for ${operationName}: ${errorMessages}`,
    'rpc',
    ErrorCodes.RPC_ERROR,
    { chainId, errors: errors.map((e) => e.message) }
  );
}

// ============================================
// COMMON RPC OPERATIONS
// ============================================

export async function getBlockNumber(chainId: number): Promise<bigint> {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.getBlockNumber(),
    'getBlockNumber'
  );
  return result;
}

export async function getBalance(
  chainId: number,
  address: `0x${string}`
): Promise<bigint> {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.getBalance({ address }),
    'getBalance'
  );
  return result;
}

export async function getGasPrice(chainId: number): Promise<bigint> {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.getGasPrice(),
    'getGasPrice'
  );
  return result;
}

export async function estimateGas(
  chainId: number,
  params: {
    account: `0x${string}`;
    to: `0x${string}`;
    data?: `0x${string}`;
    value?: bigint;
  }
): Promise<bigint> {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.estimateGas(params),
    'estimateGas'
  );
  return result;
}

export async function readContract<T>(
  chainId: number,
  params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }
): Promise<T> {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.readContract(params) as Promise<T>,
    `readContract:${params.functionName}`
  );
  return result;
}

export async function getTransaction(
  chainId: number,
  hash: `0x${string}`
) {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.getTransaction({ hash }),
    'getTransaction'
  );
  return result;
}

export async function getTransactionReceipt(
  chainId: number,
  hash: `0x${string}`
) {
  const { result } = await executeWithFallback(
    chainId,
    (client) => client.getTransactionReceipt({ hash }),
    'getTransactionReceipt'
  );
  return result;
}

export async function waitForTransactionReceipt(
  chainId: number,
  hash: `0x${string}`,
  options?: { timeout?: number; confirmations?: number }
) {
  const { result } = await executeWithFallback(
    chainId,
    (client) =>
      client.waitForTransactionReceipt({
        hash,
        timeout: options?.timeout ?? 60_000,
        confirmations: options?.confirmations ?? 1,
      }),
    'waitForTransactionReceipt'
  );
  return result;
}
