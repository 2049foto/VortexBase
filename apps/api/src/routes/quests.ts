/**
 * VORTEX API - Quest Routes
 */

import { Elysia, t } from 'elysia';
import { eq, and, gte, isNull } from 'drizzle-orm';

import { authMiddleware, optionalAuth, type AuthUser } from '../middleware/auth';
import { db } from '../db/client';
import { quests, questCompletions } from '../db/schema';
import { getActiveQuests, getUserQuestProgress, awardXp } from '../db/queries';
import { NotFoundError, ValidationError } from '../middleware/error-handler';

export const questRoutes = new Elysia({ prefix: '/api/quests' })

  // GET /api/quests - Get active quests
  .use(optionalAuth)
  .get('/', async (ctx) => {
    const user = (ctx as unknown as { user: AuthUser | null }).user;
    const activeQuests = await getActiveQuests();
    const userProgress: Map<string, { completed: boolean; claimed: boolean }> = new Map();

    if (user) {
      const completions = await getUserQuestProgress(user.id);
      completions.forEach((c) => {
        userProgress.set(c.questId, {
          completed: true,
          claimed: c.claimedAt !== null,
        });
      });
    }

    return {
      success: true,
      data: {
        quests: activeQuests.map((q) => {
          const progress = userProgress.get(q.id);
          return {
            id: q.id,
            key: q.questKey,
            title: q.title,
            description: q.description,
            type: q.type,
            rewardXp: q.rewardXp,
            condition: q.condition,
            completed: progress?.completed ?? false,
            claimed: progress?.claimed ?? false,
          };
        }),
      },
    };
  })

  // POST /api/quests/:id/claim - Claim quest reward
  .use(authMiddleware)
  .post(
    '/:id/claim',
    async (ctx) => {
      const { params } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      // Get quest
      const quest = await db.query.quests.findFirst({
        where: eq(quests.id, params.id),
      });

      if (!quest) {
        throw new NotFoundError('Quest');
      }

      // Check if already completed and not claimed
      const existingCompletion = await db.query.questCompletions.findFirst({
        where: and(
          eq(questCompletions.userId, user.id),
          eq(questCompletions.questId, params.id)
        ),
      });

      if (!existingCompletion) {
        throw new ValidationError('Quest not completed');
      }

      if (existingCompletion.claimedAt !== null) {
        throw new ValidationError('Quest already claimed');
      }

      // Mark as claimed
      await db
        .update(questCompletions)
        .set({
          claimedAt: new Date(),
        })
        .where(eq(questCompletions.id, existingCompletion.id));

      // Award XP
      await awardXp(user.id, quest.rewardXp, 'quest_claim', quest.id);

      return {
        success: true,
        data: {
          questId: quest.id,
          xpAwarded: quest.rewardXp,
          message: 'Quest reward claimed!',
        },
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    }
  );
