/**
 * VORTEX API - Account Abstraction Service
 * Pimlico bundler + EntryPoint v0.7
 * 
 * Features:
 * - UserOp building
 * - Gas estimation via Pimlico
 * - Paymaster sponsorship (gasless for users)
 * - 5s timeout
 */

import {
  encodeFunctionData,
  type Address,
  type Hex,
  parseAbi,
} from 'viem';

import { env, CONTRACTS, CHAIN_ID } from '../env';
import { log } from '../middleware/logger';

// ============================================
// CONFIGURATION
// ============================================

const PIMLICO_RPC = `https://api.pimlico.io/v2/${CHAIN_ID}/rpc?apikey=${env.PIMLICO_API_KEY}`;
const AA_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

// EntryPoint v0.7 address
export const ENTRYPOINT_ADDRESS = CONTRACTS.ENTRYPOINT as Address;

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

export interface UserOpResult {
  userOpHash: Hex;
  success: boolean;
  transactionHash?: Hex;
  error?: string;
}

export interface GasEstimate {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
}

export interface GasPrice {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface PaymasterData {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
}

// ============================================
// HELPERS
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = AA_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

async function pimlicoRpc<T>(
  method: string,
  params: unknown[]
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(PIMLICO_RPC, {
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
      });

      if (!response.ok) {
        throw new Error(`Pimlico HTTP error: ${response.status}`);
      }

      const data: JsonRpcResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`Pimlico RPC error: ${data.error.message}`);
      }

      return data.result as T;
    } catch (error) {
      lastError = error as Error;

      if (lastError.name === 'AbortError') {
        lastError = new Error('Pimlico request timeout');
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        log.warn({ method, attempt, delay, error: lastError.message }, 'Pimlico call failed, retrying');
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================
// ERC20 HELPERS
// ============================================

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

export function buildApproveCallData(
  spender: Address,
  amount: bigint
): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount],
  });
}

export function buildTransferCallData(
  to: Address,
  amount: bigint
): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });
}

// ============================================
// GAS ESTIMATION
// ============================================

interface PimlicoGasEstimate {
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
}

export async function estimateUserOpGas(
  userOp: Partial<UserOperation>
): Promise<GasEstimate> {
  const startTime = performance.now();

  // Prepare userOp for estimation
  const estimationUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce ? `0x${userOp.nonce.toString(16)}` : '0x0',
    callData: userOp.callData || '0x',
    signature: '0x' + 'ff'.repeat(65), // Dummy signature for estimation
  };

  const result = await pimlicoRpc<PimlicoGasEstimate>(
    'eth_estimateUserOperationGas',
    [estimationUserOp, ENTRYPOINT_ADDRESS]
  );

  const gasEstimate: GasEstimate = {
    callGasLimit: BigInt(result.callGasLimit),
    verificationGasLimit: BigInt(result.verificationGasLimit),
    preVerificationGas: BigInt(result.preVerificationGas),
  };

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({ ...gasEstimate, durationMs }, 'Gas estimated');

  return gasEstimate;
}

// ============================================
// GAS PRICE
// ============================================

interface PimlicoGasPrice {
  slow: { maxFeePerGas: Hex; maxPriorityFeePerGas: Hex };
  standard: { maxFeePerGas: Hex; maxPriorityFeePerGas: Hex };
  fast: { maxFeePerGas: Hex; maxPriorityFeePerGas: Hex };
}

export async function getGasPrice(): Promise<GasPrice> {
  const result = await pimlicoRpc<PimlicoGasPrice>(
    'pimlico_getUserOperationGasPrice',
    []
  );

  return {
    maxFeePerGas: BigInt(result.fast.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(result.fast.maxPriorityFeePerGas),
  };
}

// ============================================
// PAYMASTER
// ============================================

interface PimlicoPaymasterResult {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: Hex;
  paymasterPostOpGasLimit: Hex;
}

export async function getPaymasterData(
  userOp: Partial<UserOperation>
): Promise<PaymasterData> {
  const startTime = performance.now();

  // Prepare userOp for paymaster
  const paymasterUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce ? `0x${userOp.nonce.toString(16)}` : '0x0',
    callData: userOp.callData || '0x',
    callGasLimit: userOp.callGasLimit ? `0x${userOp.callGasLimit.toString(16)}` : '0x0',
    verificationGasLimit: userOp.verificationGasLimit ? `0x${userOp.verificationGasLimit.toString(16)}` : '0x0',
    preVerificationGas: userOp.preVerificationGas ? `0x${userOp.preVerificationGas.toString(16)}` : '0x0',
    maxFeePerGas: userOp.maxFeePerGas ? `0x${userOp.maxFeePerGas.toString(16)}` : '0x0',
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas ? `0x${userOp.maxPriorityFeePerGas.toString(16)}` : '0x0',
    signature: '0x' + 'ff'.repeat(65), // Dummy signature
  };

  const result = await pimlicoRpc<PimlicoPaymasterResult>(
    'pm_sponsorUserOperation',
    [paymasterUserOp, ENTRYPOINT_ADDRESS]
  );

  const paymasterData: PaymasterData = {
    paymaster: result.paymaster,
    paymasterData: result.paymasterData,
    paymasterVerificationGasLimit: BigInt(result.paymasterVerificationGasLimit),
    paymasterPostOpGasLimit: BigInt(result.paymasterPostOpGasLimit),
  };

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({ paymaster: result.paymaster, durationMs }, 'Paymaster data retrieved');

  return paymasterData;
}

// ============================================
// BUILD COMPLETE USEROP
// ============================================

export async function buildUserOp(
  sender: Address,
  callData: Hex,
  nonce: bigint = 0n
): Promise<Omit<UserOperation, 'signature'>> {
  const startTime = performance.now();

  // Get gas estimate
  const gasEstimate = await estimateUserOpGas({
    sender,
    nonce,
    callData,
  });

  // Get gas price
  const gasPrice = await getGasPrice();

  // Get paymaster sponsorship
  const paymasterData = await getPaymasterData({
    sender,
    nonce,
    callData,
    ...gasEstimate,
    ...gasPrice,
  });

  const userOp: Omit<UserOperation, 'signature'> = {
    sender,
    nonce,
    callData,
    callGasLimit: gasEstimate.callGasLimit,
    verificationGasLimit: gasEstimate.verificationGasLimit,
    preVerificationGas: gasEstimate.preVerificationGas,
    maxFeePerGas: gasPrice.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    paymaster: paymasterData.paymaster,
    paymasterData: paymasterData.paymasterData,
    paymasterVerificationGasLimit: paymasterData.paymasterVerificationGasLimit,
    paymasterPostOpGasLimit: paymasterData.paymasterPostOpGasLimit,
  };

  const durationMs = Math.round(performance.now() - startTime);
  log.info({
    sender,
    callGasLimit: gasEstimate.callGasLimit.toString(),
    paymaster: paymasterData.paymaster,
    durationMs,
  }, 'UserOp built');

  return userOp;
}

// ============================================
// USEROP SUBMISSION
// ============================================

export async function submitUserOperation(
  signedUserOp: UserOperation
): Promise<UserOpResult> {
  const startTime = performance.now();

  try {
    // Convert bigints to hex for RPC
    const userOpForRpc = {
      sender: signedUserOp.sender,
      nonce: `0x${signedUserOp.nonce.toString(16)}`,
      callData: signedUserOp.callData,
      callGasLimit: `0x${signedUserOp.callGasLimit.toString(16)}`,
      verificationGasLimit: `0x${signedUserOp.verificationGasLimit.toString(16)}`,
      preVerificationGas: `0x${signedUserOp.preVerificationGas.toString(16)}`,
      maxFeePerGas: `0x${signedUserOp.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${signedUserOp.maxPriorityFeePerGas.toString(16)}`,
      paymaster: signedUserOp.paymaster,
      paymasterData: signedUserOp.paymasterData,
      paymasterVerificationGasLimit: signedUserOp.paymasterVerificationGasLimit
        ? `0x${signedUserOp.paymasterVerificationGasLimit.toString(16)}`
        : undefined,
      paymasterPostOpGasLimit: signedUserOp.paymasterPostOpGasLimit
        ? `0x${signedUserOp.paymasterPostOpGasLimit.toString(16)}`
        : undefined,
      signature: signedUserOp.signature,
    };

    const userOpHash = await pimlicoRpc<Hex>(
      'eth_sendUserOperation',
      [userOpForRpc, ENTRYPOINT_ADDRESS]
    );

    const durationMs = Math.round(performance.now() - startTime);
    log.info({ userOpHash, durationMs }, 'UserOp submitted');

    return {
      userOpHash,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error({ error: errorMessage }, 'Failed to submit UserOp');

    return {
      userOpHash: '0x' as Hex,
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// USEROP RECEIPT POLLING
// ============================================

interface UserOpReceipt {
  userOpHash: Hex;
  success: boolean;
  actualGasCost: Hex;
  actualGasUsed: Hex;
  receipt: {
    transactionHash: Hex;
    blockNumber: Hex;
  };
}

export async function waitForUserOperation(
  userOpHash: Hex,
  timeoutMs: number = 45000
): Promise<UserOpResult> {
  const startTime = Date.now();
  const pollInterval = 2000;

  log.info({ userOpHash, timeoutMs }, 'Waiting for UserOp receipt');

  while (Date.now() - startTime < timeoutMs) {
    try {
      const receipt = await pimlicoRpc<UserOpReceipt | null>(
        'eth_getUserOperationReceipt',
        [userOpHash]
      );

      if (receipt) {
        const durationMs = Date.now() - startTime;
        log.info({
          userOpHash,
          txHash: receipt.receipt.transactionHash,
          success: receipt.success,
          durationMs,
        }, 'UserOp receipt received');

        return {
          userOpHash,
          success: receipt.success,
          transactionHash: receipt.receipt.transactionHash,
        };
      }
    } catch {
      // Not yet mined, continue polling
    }

    await sleep(pollInterval);
  }

  log.warn({ userOpHash, timeoutMs }, 'Timeout waiting for UserOp receipt');

  return {
    userOpHash,
    success: false,
    error: 'Timeout waiting for transaction',
  };
}
