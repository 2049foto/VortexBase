/**
 * VORTEX PROTOCOL - REFERRAL API
 * Referral management endpoint
 */

import { NextRequest } from 'next/server';
import { eq, desc, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users, consolidations } from '@/lib/db/schema';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  getCacheHeaders,
} from '@/lib/api/response';
import { ethereumAddressSchema, formatZodError } from '@/lib/validation';
import { z } from 'zod';

export const runtime = 'edge';

// Get referral info
export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const addressResult = ethereumAddressSchema.safeParse(searchParams.get('address'));

    if (!addressResult.success) {
      return validationErrorResponse('Invalid wallet address');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, addressResult.data),
    });

    if (!user) {
      return notFoundResponse('User');
    }

    // Get referrals
    const referrals = await db.query.users.findMany({
      where: eq(users.referredBy, user.id),
      columns: {
        id: true,
        walletAddress: true,
        displayName: true,
        avatarUrl: true,
        totalConsolidations: true,
        createdAt: true,
      },
      orderBy: desc(users.createdAt),
      limit: 50,
    });

    // Calculate earnings breakdown
    const earningsResult = await db
      .select({
        totalEarnings: sql<number>`coalesce(sum(${consolidations.referralFeeUsd}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(consolidations)
      .where(eq(consolidations.referrerId, user.id));

    const earnings = earningsResult[0];

    logger.info('Referral info fetched', {
      ...requestContext,
      userId: user.id,
      referralCount: referrals.length,
    });

    return successResponse(
      {
        referralCode: user.referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${user.referralCode}`,
        stats: {
          totalReferrals: user.referralCount,
          activeReferrals: referrals.filter((r) => r.totalConsolidations > 0).length,
          totalEarningsUsd: parseFloat(String(user.referralEarningsUsd)) || 0,
          pendingEarningsUsd: 0, // Would need separate tracking
          consolidationsFromReferrals: earnings?.count || 0,
        },
        referrals: referrals.map((r) => ({
          id: r.id,
          walletAddress: r.walletAddress,
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
          consolidations: r.totalConsolidations,
          joinedAt: r.createdAt,
        })),
      },
      { headers: getCacheHeaders(60, 120) }
    );
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}

// Apply referral code
const applyReferralSchema = z.object({
  address: ethereumAddressSchema,
  referralCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    const body = await request.json();
    const parseResult = applyReferralSchema.safeParse(body);

    if (!parseResult.success) {
      return validationErrorResponse(formatZodError(parseResult.error));
    }

    const { address, referralCode } = parseResult.data;

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, address),
    });

    if (!user) {
      return notFoundResponse('User');
    }

    // Check if already referred
    if (user.referredBy) {
      return validationErrorResponse('User already has a referrer');
    }

    // Find referrer
    const referrer = await db.query.users.findFirst({
      where: eq(users.referralCode, referralCode.toUpperCase()),
    });

    if (!referrer) {
      return validationErrorResponse('Invalid referral code');
    }

    // Can't refer yourself
    if (referrer.id === user.id) {
      return validationErrorResponse('Cannot refer yourself');
    }

    // Apply referral
    await db
      .update(users)
      .set({ referredBy: referrer.id })
      .where(eq(users.id, user.id));

    // Increment referrer's count
    await db
      .update(users)
      .set({ referralCount: sql`${users.referralCount} + 1` })
      .where(eq(users.id, referrer.id));

    logger.info('Referral applied', {
      ...requestContext,
      userId: user.id,
      referrerId: referrer.id,
    });

    return successResponse({
      success: true,
      message: 'Referral code applied successfully',
      referrer: {
        displayName: referrer.displayName,
        referralCode: referrer.referralCode,
      },
    });
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}
