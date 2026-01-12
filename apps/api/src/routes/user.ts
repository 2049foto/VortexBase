/**
 * VORTEX API - User Routes
 */

import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';

import { authMiddleware, type AuthUser } from '../middleware/auth';
import { db } from '../db/client';
import { users, referrals, consolidations, scans } from '../db/schema';
import { getUserStats, getTotalXp, getRecentScans, getUserRank } from '../db/queries';
import { nanoid } from 'nanoid';

export const userRoutes = new Elysia({ prefix: '/api/user' })
  .use(authMiddleware)

  // GET /api/user - Get current user profile
  .get('/', async (ctx) => {
    const user = (ctx as unknown as { user: AuthUser }).user;
    // Get full user data
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const stats = await getUserStats(user.id);
    const totalXp = await getTotalXp(user.id);
    const recentScans = await getRecentScans(user.id, 5);

    // Calculate level
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;

    // Get ranks
    const [weeklyRank, allTimeRank] = await Promise.all([
      getUserRank(user.id, 'weekly'),
      getUserRank(user.id, 'all_time'),
    ]);

    // Get referral info
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.referrerId, user.id),
    });

    // Count referrals
    const referralCount = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, user.id));

    return {
      success: true,
      data: {
        wallet: userData?.wallet,
        farcasterId: userData?.farcasterId,
        createdAt: userData?.createdAt,
        stats: {
          ...stats,
          totalXp,
          level,
        },
        ranks: {
          weekly: weeklyRank,
          allTime: allTimeRank,
        },
        referral: {
          code: referral?.referralCode || `VORTEX-${user.wallet.slice(2, 10).toUpperCase()}`,
          count: referralCount.length,
          earned: parseFloat(referral?.earned || '0'),
        },
        recentScans: recentScans.map((s) => ({
          id: s.id,
          dustCount: s.dustTokensCount,
          dustValueUsd: parseFloat(s.dustValueUsd),
          createdAt: s.createdAt,
        })),
      },
    };
  })

  // GET /api/user/consolidations - Get user consolidation history
  .get(
    '/consolidations',
    async (ctx) => {
      const { query } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      const limit = Math.min(query.limit || 20, 50);
      const offset = query.offset || 0;

      const userConsolidations = await db.query.consolidations.findMany({
        where: eq(consolidations.userId, user.id),
        orderBy: (c, { desc }) => [desc(c.createdAt)],
        limit,
        offset,
        with: {
          scan: true,
        },
      });

      return {
        success: true,
        data: {
          consolidations: userConsolidations.map((c) => ({
            id: c.id,
            status: c.status,
            txHash: c.txHash,
            inputTokens: c.inputTokens,
            outputToken: c.outputToken,
            outputAmount: c.outputAmount,
            protocolFee: c.protocolFee,
            createdAt: c.createdAt,
            completedAt: c.completedAt,
          })),
          limit,
          offset,
        },
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
        offset: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )

  // POST /api/user/referral - Apply referral code
  .post(
    '/referral',
    async (ctx) => {
      const { body } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      // Find referrer by code
      const existingReferral = await db.query.referrals.findFirst({
        where: eq(referrals.referralCode, body.code.toUpperCase()),
      });

      if (!existingReferral) {
        throw new Error('Invalid referral code');
      }

      if (existingReferral.referrerId === user.id) {
        throw new Error('Cannot refer yourself');
      }

      // Check if user already has a referrer
      const userReferral = await db.query.referrals.findFirst({
        where: eq(referrals.referredId, user.id),
      });

      if (userReferral) {
        throw new Error('Already referred by someone');
      }

      // Create referral relationship
      await db.insert(referrals).values({
        referrerId: existingReferral.referrerId,
        referredId: user.id,
        referralCode: `VORTEX-${nanoid(8).toUpperCase()}`,
      });

      return {
        success: true,
        data: {
          message: 'Referral applied successfully',
        },
      };
    },
    {
      body: t.Object({
        code: t.String({ minLength: 1 }),
      }),
    }
  );
