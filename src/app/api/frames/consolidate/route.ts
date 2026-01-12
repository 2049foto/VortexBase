/**
 * VORTEX PROTOCOL - FARCASTER FRAME: CONSOLIDATE
 * Transaction frame for dust consolidation
 */

import { NextRequest, NextResponse } from 'next/server';

import { validateFrameMessage, getTransactionFrameResponse } from '@/lib/frames';
import { getOrCreateUser } from '@/lib/db/queries';
import { scanWallet, getDustTokensForConsolidation } from '@/lib/services/scanner';
import { buildConsolidationTransaction } from '@/lib/services/swap';
import { CHAIN_IDS, BASE_TOKENS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate frame message
    const validation = await validateFrameMessage(body);
    
    if (!validation.isValid || !validation.message) {
      return NextResponse.json(
        { error: 'Invalid frame message' },
        { status: 400 }
      );
    }

    const { fid, connectedAddress } = validation.message;
    
    if (!connectedAddress) {
      return NextResponse.json(
        { error: 'Wallet not connected' },
        { status: 400 }
      );
    }

    logger.info('Frame consolidate request', { fid, address: connectedAddress });

    // Get user
    const user = await getOrCreateUser({
      walletAddress: connectedAddress,
      farcasterFid: fid,
    });

    // Scan wallet for dust tokens
    const scanResult = await scanWallet(connectedAddress, CHAIN_IDS.BASE);
    const dustTokens = getDustTokensForConsolidation(scanResult, {
      maxTokens: 10, // Limit for frame transaction
      excludeHighRisk: true,
    });

    if (dustTokens.length === 0) {
      return NextResponse.json(
        { error: 'No consolidatable dust tokens found' },
        { status: 400 }
      );
    }

    // Build consolidation transaction
    const consolidation = await buildConsolidationTransaction({
      chainId: CHAIN_IDS.BASE,
      tokensIn: dustTokens.map((t) => ({
        address: t.address,
        amount: t.balance,
      })),
      tokenOutAddress: BASE_TOKENS.USDC,
      fromAddress: connectedAddress,
      slippage: 0.5,
    });

    // For frame transactions, we return the first swap
    // In a full implementation, this would be a batched transaction
    const firstSwap = consolidation.swaps[0];
    
    if (!firstSwap) {
      return NextResponse.json(
        { error: 'Failed to build swap transaction' },
        { status: 500 }
      );
    }

    // Return transaction frame response
    return new NextResponse(
      getTransactionFrameResponse({
        chainId: 'eip155:8453', // Base
        method: 'eth_sendTransaction',
        params: {
          to: firstSwap.tx.to,
          data: firstSwap.tx.data,
          value: firstSwap.tx.value,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Frame consolidate error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Failed to build transaction' },
      { status: 500 }
    );
  }
}
