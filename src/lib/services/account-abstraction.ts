/**
 * VORTEX PROTOCOL - ACCOUNT ABSTRACTION SERVICE
 * ERC-4337 with Pimlico Bundler & Paymaster
 */

import {
  createPublicClient,
  http,
  encodeFunctionData,
  type Address,
  type Hex,
  type Chain,
} from 'viem';
import { base, mainnet, arbitrum, optimism, polygon } from 'viem/chains';

import { CHAIN_IDS, CONTRACTS, TIMEOUTS } from '@/lib/constants';
import { logger, createLogger } from '@/lib/logger';
import { ExternalServiceError, ErrorCodes } from '@/lib/errors';

const aaLogger = createLogger('account-abstraction');

// ============================================
// TYPES
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
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
}

export interface UserOperationReceipt {
  userOpHash: Hex;
  entryPoint: Address;
  sender: Address;
  nonce: bigint;
  paymaster?: Address;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  success: boolean;
  reason?: string;
  receipt: {
    transactionHash: Hex;
    blockNumber: bigint;
    blockHash: Hex;
    gasUsed: bigint;
  };
}

// ============================================
// CONSTANTS
// ============================================

const ENTRY_POINT_V07 = CONTRACTS.ENTRY_POINT_V07 as Address;

const PIMLICO_URLS: Record<number, string> = {
  [CHAIN_IDS.BASE]: process.env.NEXT_PUBLIC_PIMLICO_BASE_URL || '',
  [CHAIN_IDS.ETHEREUM]: process.env.PIMLICO_ETH_URL || '',
  [CHAIN_IDS.ARBITRUM]: process.env.PIMLICO_ARB_URL || '',
  [CHAIN_IDS.OPTIMISM]: process.env.PIMLICO_OPT_URL || '',
  [CHAIN_IDS.POLYGON]: process.env.NEXT_PUBLIC_PIMLICO_POLYGON_URL || '',
};

const CHAIN_CONFIGS: Record<number, Chain> = {
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.ETHEREUM]: mainnet,
  [CHAIN_IDS.ARBITRUM]: arbitrum,
  [CHAIN_IDS.OPTIMISM]: optimism,
  [CHAIN_IDS.POLYGON]: polygon,
};

// ============================================
// PIMLICO RPC
// ============================================

async function pimlicoRpc<T>(
  chainId: number,
  method: string,
  params: unknown[]
): Promise<T> {
  const url = PIMLICO_URLS[chainId];
  
  if (!url) {
    throw new ExternalServiceError(
      `Pimlico not configured for chain ${chainId}`,
      'pimlico',
      ErrorCodes.BUNDLER_ERROR
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.SWAP_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ExternalServiceError(
        `Pimlico HTTP error: ${response.status}`,
        'pimlico',
        ErrorCodes.BUNDLER_ERROR
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new ExternalServiceError(
        `Pimlico RPC error: ${data.error.message}`,
        'pimlico',
        ErrorCodes.BUNDLER_ERROR,
        { code: data.error.code, data: data.error.data }
      );
    }

    return data.result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    
    throw new ExternalServiceError(
      `Pimlico request failed: ${error instanceof Error ? error.message : String(error)}`,
      'pimlico',
      ErrorCodes.BUNDLER_ERROR
    );
  }
}

// ============================================
// GAS ESTIMATION
// ============================================

export async function estimateUserOperationGas(
  chainId: number,
  userOp: Partial<UserOperation>
): Promise<GasEstimate> {
  aaLogger.info('Estimating UserOperation gas', { chainId, sender: userOp.sender });

  // Format for RPC
  const formattedUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce ? `0x${userOp.nonce.toString(16)}` : '0x0',
    factory: userOp.factory || undefined,
    factoryData: userOp.factoryData || undefined,
    callData: userOp.callData || '0x',
    callGasLimit: '0x0',
    verificationGasLimit: '0x0',
    preVerificationGas: '0x0',
    maxFeePerGas: '0x0',
    maxPriorityFeePerGas: '0x0',
    paymaster: userOp.paymaster || undefined,
    paymasterData: userOp.paymasterData || undefined,
    signature: '0x' + '00'.repeat(65), // Dummy signature for estimation
  };

  const result = await pimlicoRpc<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    paymasterVerificationGasLimit?: string;
    paymasterPostOpGasLimit?: string;
  }>(chainId, 'eth_estimateUserOperationGas', [formattedUserOp, ENTRY_POINT_V07]);

  // Get current gas prices
  const gasPrices = await pimlicoRpc<{
    slow: { maxFeePerGas: string; maxPriorityFeePerGas: string };
    standard: { maxFeePerGas: string; maxPriorityFeePerGas: string };
    fast: { maxFeePerGas: string; maxPriorityFeePerGas: string };
  }>(chainId, 'pimlico_getUserOperationGasPrice', []);

  // Add 20% buffer for safety
  const addBuffer = (value: bigint, percent: number = 20): bigint => {
    return value + (value * BigInt(percent)) / 100n;
  };

  return {
    callGasLimit: addBuffer(BigInt(result.callGasLimit)),
    verificationGasLimit: addBuffer(BigInt(result.verificationGasLimit)),
    preVerificationGas: addBuffer(BigInt(result.preVerificationGas)),
    maxFeePerGas: BigInt(gasPrices.fast.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasPrices.fast.maxPriorityFeePerGas),
    paymasterVerificationGasLimit: result.paymasterVerificationGasLimit
      ? addBuffer(BigInt(result.paymasterVerificationGasLimit))
      : undefined,
    paymasterPostOpGasLimit: result.paymasterPostOpGasLimit
      ? addBuffer(BigInt(result.paymasterPostOpGasLimit))
      : undefined,
  };
}

// ============================================
// PAYMASTER SPONSORSHIP
// ============================================

export async function sponsorUserOperation(
  chainId: number,
  userOp: Partial<UserOperation>
): Promise<{
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
}> {
  aaLogger.info('Requesting gas sponsorship', { chainId, sender: userOp.sender });

  // Format UserOperation for paymaster
  const formattedUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce ? `0x${userOp.nonce.toString(16)}` : '0x0',
    factory: userOp.factory || undefined,
    factoryData: userOp.factoryData || undefined,
    callData: userOp.callData || '0x',
    callGasLimit: userOp.callGasLimit ? `0x${userOp.callGasLimit.toString(16)}` : '0x0',
    verificationGasLimit: userOp.verificationGasLimit
      ? `0x${userOp.verificationGasLimit.toString(16)}`
      : '0x0',
    preVerificationGas: userOp.preVerificationGas
      ? `0x${userOp.preVerificationGas.toString(16)}`
      : '0x0',
    maxFeePerGas: userOp.maxFeePerGas ? `0x${userOp.maxFeePerGas.toString(16)}` : '0x0',
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas
      ? `0x${userOp.maxPriorityFeePerGas.toString(16)}`
      : '0x0',
    signature: '0x' + '00'.repeat(65),
  };

  const result = await pimlicoRpc<{
    paymaster: Address;
    paymasterData: Hex;
    paymasterVerificationGasLimit: string;
    paymasterPostOpGasLimit: string;
  }>(chainId, 'pm_sponsorUserOperation', [
    formattedUserOp,
    ENTRY_POINT_V07,
    { sponsorshipPolicyId: 'sp_vortex_mainnet' }, // Vortex sponsorship policy
  ]);

  return {
    paymaster: result.paymaster,
    paymasterData: result.paymasterData,
    paymasterVerificationGasLimit: BigInt(result.paymasterVerificationGasLimit),
    paymasterPostOpGasLimit: BigInt(result.paymasterPostOpGasLimit),
  };
}

// ============================================
// SEND USER OPERATION
// ============================================

export async function sendUserOperation(
  chainId: number,
  userOp: UserOperation
): Promise<Hex> {
  aaLogger.info('Sending UserOperation', { chainId, sender: userOp.sender });

  // Format UserOperation for RPC
  const formattedUserOp = {
    sender: userOp.sender,
    nonce: `0x${userOp.nonce.toString(16)}`,
    factory: userOp.factory || undefined,
    factoryData: userOp.factoryData || undefined,
    callData: userOp.callData,
    callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
    verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
    preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
    maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
    maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
    paymaster: userOp.paymaster || undefined,
    paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit
      ? `0x${userOp.paymasterVerificationGasLimit.toString(16)}`
      : undefined,
    paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit
      ? `0x${userOp.paymasterPostOpGasLimit.toString(16)}`
      : undefined,
    paymasterData: userOp.paymasterData || undefined,
    signature: userOp.signature,
  };

  const userOpHash = await pimlicoRpc<Hex>(chainId, 'eth_sendUserOperation', [
    formattedUserOp,
    ENTRY_POINT_V07,
  ]);

  aaLogger.info('UserOperation sent', { chainId, userOpHash });
  return userOpHash;
}

// ============================================
// GET USER OPERATION RECEIPT
// ============================================

export async function getUserOperationReceipt(
  chainId: number,
  userOpHash: Hex
): Promise<UserOperationReceipt | null> {
  const result = await pimlicoRpc<{
    userOpHash: Hex;
    entryPoint: Address;
    sender: Address;
    nonce: string;
    paymaster?: Address;
    actualGasCost: string;
    actualGasUsed: string;
    success: boolean;
    reason?: string;
    receipt: {
      transactionHash: Hex;
      blockNumber: string;
      blockHash: Hex;
      gasUsed: string;
    };
  } | null>(chainId, 'eth_getUserOperationReceipt', [userOpHash]);

  if (!result) {
    return null;
  }

  return {
    userOpHash: result.userOpHash,
    entryPoint: result.entryPoint,
    sender: result.sender,
    nonce: BigInt(result.nonce),
    paymaster: result.paymaster,
    actualGasCost: BigInt(result.actualGasCost),
    actualGasUsed: BigInt(result.actualGasUsed),
    success: result.success,
    reason: result.reason,
    receipt: {
      transactionHash: result.receipt.transactionHash,
      blockNumber: BigInt(result.receipt.blockNumber),
      blockHash: result.receipt.blockHash,
      gasUsed: BigInt(result.receipt.gasUsed),
    },
  };
}

// ============================================
// WAIT FOR USER OPERATION
// ============================================

export async function waitForUserOperation(
  chainId: number,
  userOpHash: Hex,
  options?: {
    timeout?: number;
    pollingInterval?: number;
  }
): Promise<UserOperationReceipt> {
  const { timeout = 60000, pollingInterval = 2000 } = options ?? {};
  const startTime = Date.now();

  aaLogger.info('Waiting for UserOperation', { chainId, userOpHash });

  while (Date.now() - startTime < timeout) {
    const receipt = await getUserOperationReceipt(chainId, userOpHash);

    if (receipt) {
      aaLogger.info('UserOperation confirmed', {
        chainId,
        userOpHash,
        success: receipt.success,
        txHash: receipt.receipt.transactionHash,
      });
      return receipt;
    }

    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }

  throw new ExternalServiceError(
    `UserOperation timeout after ${timeout}ms`,
    'pimlico',
    ErrorCodes.RPC_TIMEOUT,
    { userOpHash }
  );
}

// ============================================
// GET NONCE
// ============================================

export async function getAccountNonce(
  chainId: number,
  accountAddress: Address,
  key: bigint = 0n
): Promise<bigint> {
  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  // Read nonce from EntryPoint
  const nonce = await client.readContract({
    address: ENTRY_POINT_V07,
    abi: [
      {
        name: 'getNonce',
        type: 'function',
        inputs: [
          { name: 'sender', type: 'address' },
          { name: 'key', type: 'uint192' },
        ],
        outputs: [{ name: 'nonce', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'getNonce',
    args: [accountAddress, key],
  });

  return nonce;
}

// ============================================
// ENCODE BATCH CALL
// ============================================

export function encodeBatchCalls(
  calls: Array<{
    to: Address;
    value?: bigint;
    data?: Hex;
  }>
): Hex {
  // Encode for a standard batch execution (depends on smart account implementation)
  // This is for a simple executeBatch function
  const targets = calls.map((c) => c.to);
  const values = calls.map((c) => c.value ?? 0n);
  const datas = calls.map((c) => c.data ?? '0x');

  return encodeFunctionData({
    abi: [
      {
        name: 'executeBatch',
        type: 'function',
        inputs: [
          { name: 'targets', type: 'address[]' },
          { name: 'values', type: 'uint256[]' },
          { name: 'datas', type: 'bytes[]' },
        ],
        outputs: [],
        stateMutability: 'payable',
      },
    ],
    functionName: 'executeBatch',
    args: [targets, values, datas as readonly Hex[]],
  });
}

// ============================================
// CALCULATE GAS COST IN USD
// ============================================

export async function calculateGasCostUsd(
  chainId: number,
  gasEstimate: GasEstimate,
  nativeTokenPriceUsd: number
): Promise<number> {
  const totalGas =
    gasEstimate.callGasLimit +
    gasEstimate.verificationGasLimit +
    gasEstimate.preVerificationGas +
    (gasEstimate.paymasterVerificationGasLimit ?? 0n) +
    (gasEstimate.paymasterPostOpGasLimit ?? 0n);

  const gasCostWei = totalGas * gasEstimate.maxFeePerGas;
  const gasCostEth = Number(gasCostWei) / 1e18;
  
  return gasCostEth * nativeTokenPriceUsd;
}
