/**
 * VORTEX PROTOCOL - FARCASTER FRAME: LEADERBOARD
 * Frame endpoint for leaderboard display
 */

import { NextRequest, NextResponse } from 'next/server';

import { validateFrameMessage, getFrameHtmlResponse } from '@/lib/frames';
import { getLeaderboard, getUserRank } from '@/lib/db/queries';
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

    const { fid, buttonIndex } = validation.message;

    // Determine which period to show
    let period: 'weekly' | 'monthly' | 'all_time' = 'weekly';
    if (buttonIndex === 2) {
      period = 'monthly';
    } else if (buttonIndex === 3) {
      period = 'all_time';
    }

    logger.info('Frame leaderboard request', { fid, period });

    // Get leaderboard data
    const leaderboard = await getLeaderboard({ period, limit: 10 });

    // Build image URL with leaderboard data
    const topUsers = leaderboard.entries.slice(0, 5);
    const imageParams = new URLSearchParams({
      period,
      total: leaderboard.total.toString(),
      data: JSON.stringify(topUsers.map((e) => ({
        rank: e.rank,
        name: e.user.displayName || `User ${e.rank}`,
        xp: e.user.totalXp,
      }))),
    });

    return new NextResponse(
      getFrameHtmlResponse({
        image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/leaderboard?${imageParams.toString()}`,
        buttons: [
          {
            label: '📅 Weekly',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/leaderboard`,
          },
          {
            label: '📆 Monthly',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/leaderboard`,
          },
          {
            label: '🏆 All Time',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/leaderboard`,
          },
          {
            label: '🔍 Scan Wallet',
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
  } catch (error) {
    logger.error('Frame leaderboard error', error instanceof Error ? error : new Error(String(error)));
    
    return new NextResponse(
      getFrameHtmlResponse({
        image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/error`,
        buttons: [
          {
            label: '🔄 Try Again',
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
}
