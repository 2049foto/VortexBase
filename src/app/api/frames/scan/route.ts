/**
 * VORTEX PROTOCOL - FARCASTER FRAME: SCAN
 * Frame endpoint for wallet scanning
 */

import { NextRequest, NextResponse } from 'next/server';

import { validateFrameMessage, getFrameHtmlResponse } from '@/lib/frames';
import { getOrCreateUser } from '@/lib/db/queries';
import { scanWallet } from '@/lib/services/scanner';
import { formatUSD } from '@/lib/utils';
import { CHAIN_IDS } from '@/lib/constants';
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
    
    // Need wallet address to scan
    if (!connectedAddress) {
      return new NextResponse(
        getFrameHtmlResponse({
          image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/connect-wallet`,
          buttons: [
            {
              label: '🔗 Connect Wallet',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/scan`,
            },
          ],
          postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/scan`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    logger.info('Frame scan request', { fid, address: connectedAddress });

    // Get or create user
    const user = await getOrCreateUser({
      walletAddress: connectedAddress,
      farcasterFid: fid,
    });

    // Perform scan
    const scanResult = await scanWallet(connectedAddress, CHAIN_IDS.BASE);

    // Generate response frame
    const dustCount = scanResult.dustTokens;
    const dustValue = scanResult.dustValueUsd;

    if (dustCount === 0) {
      // No dust found
      return new NextResponse(
        getFrameHtmlResponse({
          image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/no-dust?address=${connectedAddress}`,
          buttons: [
            {
              label: '🔄 Scan Again',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/scan`,
            },
            {
              label: '🏆 Leaderboard',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/leaderboard`,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Dust found - show consolidation option
    return new NextResponse(
      getFrameHtmlResponse({
        image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/dust-found?count=${dustCount}&value=${dustValue.toFixed(2)}&address=${connectedAddress}`,
        buttons: [
          {
            label: `🧹 Clean ${dustCount} Tokens (${formatUSD(dustValue)})`,
            action: 'tx',
            target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/consolidate`,
          },
          {
            label: '📊 View Details',
            action: 'link',
            target: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?address=${connectedAddress}`,
          },
        ],
        state: JSON.stringify({
          scanId: scanResult.walletAddress,
          dustCount,
          dustValue,
        }),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    logger.error('Frame scan error', error instanceof Error ? error : new Error(String(error)));
    
    return new NextResponse(
      getFrameHtmlResponse({
        image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/error`,
        buttons: [
          {
            label: '🔄 Try Again',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/scan`,
          },
        ],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
