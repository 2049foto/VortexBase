/**
 * VORTEX API - XP Routes
 */

import { Elysia, t } from 'elysia';
import { eq, desc, sql, sum, and, gte } from 'drizzle-orm';

import { authMiddleware, type AuthUser } from '../middleware/auth';
import { db } from '../db/client';
import { xpTransactions } from '../db/schema';
import { getTotalXp } from '../db/queries';

export const xpRoutes = new Elysia({ prefix: '/api/xp' })
  .use(authMiddleware)

  // GET /api/xp - Get user XP summary
  .get('/', async (ctx) => {
    const user = (ctx as unknown as { user: AuthUser }).user;
    const totalXp = await getTotalXp(user.id);

    // Calculate level (sqrt-based progression)
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
    const xpForNextLevel = Math.pow(level, 2) * 100;
    const xpProgress = totalXp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    // Get recent XP transactions
    const recent = await db.query.xpTransactions.findMany({
      where: eq(xpTransactions.userId, user.id),
      orderBy: desc(xpTransactions.createdAt),
      limit: 10,
    });

    // Get XP by reason
    const byReason = await db
      .select({
        reason: xpTransactions.reason,
        total: sum(xpTransactions.xpAmount),
      })
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, user.id))
      .groupBy(xpTransactions.reason);

    return {
      success: true,
      data: {
        totalXp,
        level,
        xpProgress,
        xpNeeded,
        progressPercent: Math.round((xpProgress / xpNeeded) * 100),
        recentTransactions: recent.map((t) => ({
          xpAmount: t.xpAmount,
          reason: t.reason,
          createdAt: t.createdAt,
        })),
        breakdown: byReason.reduce(
          (acc, r) => {
            acc[r.reason] = Number(r.total || 0);
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  })

  // GET /api/xp/history - Get XP transaction history
  .get(
    '/history',
    async (ctx) => {
      const { query } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      const limit = Math.min(query.limit || 50, 100);
      const offset = query.offset || 0;

      const transactions = await db.query.xpTransactions.findMany({
        where: eq(xpTransactions.userId, user.id),
        orderBy: desc(xpTransactions.createdAt),
        limit,
        offset,
      });

      return {
        success: true,
        data: {
          transactions: transactions.map((t) => ({
            id: t.id,
            xpAmount: t.xpAmount,
            reason: t.reason,
            referenceId: t.referenceId,
            createdAt: t.createdAt,
          })),
          limit,
          offset,
        },
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  );
