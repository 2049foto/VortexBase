/**
 * VORTEX API - Leaderboard Routes
 */

import { Elysia, t } from 'elysia';

import { optionalAuth, type AuthUser } from '../middleware/auth';
import { getLeaderboard, getUserRank } from '../db/queries';

export const leaderboardRoutes = new Elysia({ prefix: '/api/leaderboard' })
  .use(optionalAuth)

  // GET /api/leaderboard - Get leaderboard
  .get(
    '/',
    async (ctx) => {
      const { query } = ctx;
      const user = (ctx as unknown as { user: AuthUser | null }).user;
      
      const period = (query.period || 'weekly') as 'daily' | 'weekly' | 'all_time';
      const limit = Math.min(query.limit || 100, 100);

      const entries = await getLeaderboard(period, limit);

      let userRank: number | null = null;
      if (user) {
        userRank = await getUserRank(user.id, period);
      }

      return {
        success: true,
        data: {
          period,
          entries: entries.map((e) => ({
            rank: e.rank,
            wallet: e.user.wallet,
            farcasterId: e.user.farcasterId,
            xpTotal: e.xpTotal,
            gasSavedUsd: parseFloat(e.gasSavedUsd),
            consolidationsCount: e.consolidationsCount,
          })),
          userRank,
          lastUpdated: entries[0]?.lastUpdated || null,
        },
      };
    },
    {
      query: t.Object({
        period: t.Optional(t.Union([
          t.Literal('daily'),
          t.Literal('weekly'),
          t.Literal('all_time'),
        ])),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
    }
  );
