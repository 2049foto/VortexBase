/**
 * VORTEX PROTOCOL - SWAP SERVICE
 * 1inch DEX Aggregator Integration
 */

import { encodeFunctionData, type Address } from 'viem';

import { CHAIN_IDS, API_ENDPOINTS, CONTRACTS, LIMITS, TIMEOUTS } from '@/lib/constants';
import { logger, createLogger } from '@/lib/logger';
import { ExternalServiceError, BusinessError, ErrorCodes } from '@/lib/errors';
import { getTokenPrice } from './price';

const swapLogger = createLogger('swap');

// ============================================
// TYPES
// ============================================

export interface SwapQuote {
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  estimatedGas: string;
  protocols: string[][];
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

export interface SwapResult {
  quote: SwapQuote;
  tx: SwapTransaction;
}

// ============================================
// 1INCH API
// ============================================

const ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v6.0';

async function fetch1inch(
  endpoint: string,
  chainId: number,
  params: Record<string, string>
): Promise<Response> {
  const apiKey = process.env.ONEINCH_API_KEY;
  
  if (!apiKey) {
    throw new ExternalServiceError(
      '1inch API key not configured',
      '1inch',
      ErrorCodes.API_ERROR
    );
  }

  const searchParams = new URLSearchParams(params);
  const url = `${ONEINCH_BASE_URL}/${chainId}${endpoint}?${searchParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================
// GET SWAP QUOTE
// ============================================

export async function getSwapQuote(params: {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage?: number;
}): Promise<SwapQuote> {
  const {
    chainId,
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage = 0.5,
  } = params;

  swapLogger.info('Getting swap quote', {
    chainId,
    fromToken: fromTokenAddress,
    toToken: toTokenAddress,
    amount,
  });

  try {
    const response = await fetch1inch('/quote', chainId, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      includeProtocols: 'true',
      includeGas: 'true',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ExternalServiceError(
        `1inch quote failed: ${errorData.description || response.statusText}`,
        '1inch',
        ErrorCodes.API_ERROR,
        { status: response.status, error: errorData }
      );
    }

    const data = await response.json();

    // Calculate minimum amount with slippage
    const toAmount = BigInt(data.dstAmount);
    const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
    const toAmountMin = (toAmount * slippageMultiplier) / 10000n;

    // Calculate price impact
    const fromDecimals = data.srcToken?.decimals ?? 18;
    const toDecimals = data.dstToken?.decimals ?? 18;
    
    const fromAmountNormalized = Number(BigInt(amount)) / 10 ** fromDecimals;
    const toAmountNormalized = Number(toAmount) / 10 ** toDecimals;
    
    // Get prices for impact calculation
    const fromPrice = await getTokenPrice(fromTokenAddress, chainId);
    const toPrice = await getTokenPrice(toTokenAddress, chainId);
    
    let priceImpact = 0;
    if (fromPrice > 0 && toPrice > 0) {
      const expectedValue = fromAmountNormalized * fromPrice;
      const actualValue = toAmountNormalized * toPrice;
      priceImpact = ((expectedValue - actualValue) / expectedValue) * 100;
    }

    return {
      fromToken: {
        address: fromTokenAddress.toLowerCase(),
        symbol: data.srcToken?.symbol || 'UNKNOWN',
        decimals: fromDecimals,
      },
      toToken: {
        address: toTokenAddress.toLowerCase(),
        symbol: data.dstToken?.symbol || 'UNKNOWN',
        decimals: toDecimals,
      },
      fromAmount: amount,
      toAmount: data.dstAmount,
      toAmountMin: toAmountMin.toString(),
      priceImpact: Math.max(0, priceImpact),
      estimatedGas: data.gas?.toString() || '200000',
      protocols: data.protocols || [],
    };
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    throw new ExternalServiceError(
      `Failed to get swap quote: ${error instanceof Error ? error.message : String(error)}`,
      '1inch',
      ErrorCodes.API_ERROR
    );
  }
}

// ============================================
// BUILD SWAP TRANSACTION
// ============================================

export async function buildSwapTransaction(params: {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
  referrer?: string;
  fee?: number;
}): Promise<SwapResult> {
  const {
    chainId,
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromAddress,
    slippage = 0.5,
    disableEstimate = false,
    allowPartialFill = true,
    referrer = CONTRACTS.ADMIN_WALLET,
    fee = 0.8, // 0.8% protocol fee
  } = params;

  swapLogger.info('Building swap transaction', {
    chainId,
    fromToken: fromTokenAddress,
    toToken: toTokenAddress,
    amount,
    fromAddress,
  });

  // First get a quote
  const quote = await getSwapQuote({
    chainId,
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
  });

  // Check price impact
  if (quote.priceImpact > 5) {
    throw new BusinessError(
      `Price impact too high: ${quote.priceImpact.toFixed(2)}%`,
      ErrorCodes.PRICE_IMPACT_TOO_HIGH,
      { priceImpact: quote.priceImpact }
    );
  }

  try {
    // Build the actual swap transaction
    const swapParams: Record<string, string> = {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      from: fromAddress,
      slippage: slippage.toString(),
      disableEstimate: disableEstimate.toString(),
      allowPartialFill: allowPartialFill.toString(),
    };

    // Add referrer fee if specified
    if (referrer && fee > 0) {
      swapParams.referrer = referrer;
      swapParams.fee = fee.toString();
    }

    const response = await fetch1inch('/swap', chainId, swapParams);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ExternalServiceError(
        `1inch swap build failed: ${errorData.description || response.statusText}`,
        '1inch',
        ErrorCodes.API_ERROR,
        { status: response.status, error: errorData }
      );
    }

    const data = await response.json();

    return {
      quote,
      tx: {
        from: data.tx.from,
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gas: data.tx.gas?.toString() || quote.estimatedGas,
        gasPrice: data.tx.gasPrice,
      },
    };
  } catch (error) {
    if (error instanceof ExternalServiceError || error instanceof BusinessError) {
      throw error;
    }
    throw new ExternalServiceError(
      `Failed to build swap transaction: ${error instanceof Error ? error.message : String(error)}`,
      '1inch',
      ErrorCodes.API_ERROR
    );
  }
}

// ============================================
// MULTI-TOKEN SWAP (CONSOLIDATION)
// ============================================

export interface ConsolidationQuote {
  tokensIn: Array<{
    address: string;
    symbol: string;
    amount: string;
    valueUsd: number;
  }>;
  tokenOut: {
    address: string;
    symbol: string;
    totalAmount: string;
    totalValueUsd: number;
  };
  totalInputValueUsd: number;
  totalOutputValueUsd: number;
  priceImpact: number;
  estimatedGasTotal: string;
  protocolFeeUsd: number;
  swaps: SwapResult[];
}

export async function buildConsolidationTransaction(params: {
  chainId: number;
  tokensIn: Array<{ address: string; amount: string }>;
  tokenOutAddress: string;
  fromAddress: string;
  slippage?: number;
}): Promise<ConsolidationQuote> {
  const {
    chainId,
    tokensIn,
    tokenOutAddress,
    fromAddress,
    slippage = 0.5,
  } = params;

  if (tokensIn.length > LIMITS.MAX_BATCH_SIZE) {
    throw new BusinessError(
      `Too many tokens: ${tokensIn.length}. Maximum is ${LIMITS.MAX_BATCH_SIZE}`,
      ErrorCodes.MAX_BATCH_EXCEEDED
    );
  }

  swapLogger.info('Building consolidation transaction', {
    chainId,
    tokensCount: tokensIn.length,
    tokenOut: tokenOutAddress,
    fromAddress,
  });

  const swaps: SwapResult[] = [];
  let totalInputValueUsd = 0;
  let totalOutputAmount = 0n;
  let totalGas = 0n;
  const tokensInData: ConsolidationQuote['tokensIn'] = [];

  // Build individual swaps
  for (const tokenIn of tokensIn) {
    try {
      const swapResult = await buildSwapTransaction({
        chainId,
        fromTokenAddress: tokenIn.address,
        toTokenAddress: tokenOutAddress,
        amount: tokenIn.amount,
        fromAddress,
        slippage,
      });

      swaps.push(swapResult);

      const inputPrice = await getTokenPrice(tokenIn.address, chainId);
      const inputDecimals = swapResult.quote.fromToken.decimals;
      const inputValueUsd =
        (Number(BigInt(tokenIn.amount)) / 10 ** inputDecimals) * inputPrice;

      tokensInData.push({
        address: tokenIn.address.toLowerCase(),
        symbol: swapResult.quote.fromToken.symbol,
        amount: tokenIn.amount,
        valueUsd: inputValueUsd,
      });

      totalInputValueUsd += inputValueUsd;
      totalOutputAmount += BigInt(swapResult.quote.toAmount);
      totalGas += BigInt(swapResult.tx.gas);
    } catch (error) {
      swapLogger.warn('Swap failed for token, skipping', {
        token: tokenIn.address,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with other tokens
    }
  }

  if (swaps.length === 0) {
    throw new BusinessError(
      'No swaps could be executed',
      ErrorCodes.INSUFFICIENT_BALANCE
    );
  }

  // Get output token price
  const outputPrice = await getTokenPrice(tokenOutAddress, chainId);
  const outputDecimals = swaps[0]!.quote.toToken.decimals;
  const totalOutputValueUsd =
    (Number(totalOutputAmount) / 10 ** outputDecimals) * outputPrice;

  // Calculate overall price impact
  const priceImpact =
    totalInputValueUsd > 0
      ? ((totalInputValueUsd - totalOutputValueUsd) / totalInputValueUsd) * 100
      : 0;

  // Calculate protocol fee
  const protocolFeeUsd = totalOutputValueUsd * (LIMITS.MAX_SLIPPAGE_PERCENT / 100);

  return {
    tokensIn: tokensInData,
    tokenOut: {
      address: tokenOutAddress.toLowerCase(),
      symbol: swaps[0]!.quote.toToken.symbol,
      totalAmount: totalOutputAmount.toString(),
      totalValueUsd: totalOutputValueUsd,
    },
    totalInputValueUsd,
    totalOutputValueUsd,
    priceImpact: Math.max(0, priceImpact),
    estimatedGasTotal: totalGas.toString(),
    protocolFeeUsd,
    swaps,
  };
}

// ============================================
// TOKEN APPROVAL CHECK
// ============================================

const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

export function encodeApproveData(
  spender: Address,
  amount: bigint = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') // Max uint256
): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount],
  });
}

// 1inch Router addresses by chain
const ONEINCH_ROUTER_ADDRESSES: Record<number, Address> = {
  [CHAIN_IDS.ETHEREUM]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.BASE]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.ARBITRUM]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.OPTIMISM]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.POLYGON]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.BNB]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.AVALANCHE]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [CHAIN_IDS.ZKSYNC]: '0x6fd4383cb451173D5f9304F041C7BCBf27d561fF', // Different on zkSync
};

export function get1inchRouterAddress(chainId: number): Address {
  const address = ONEINCH_ROUTER_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`1inch router not available on chain ${chainId}`);
  }
  return address;
}
