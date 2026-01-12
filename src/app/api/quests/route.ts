/**
 * VORTEX PROTOCOL - QUESTS API
 * Quest management endpoint
 */

import { NextRequest } from 'next/server';
import { eq, and, sql, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { quests, userQuests, users } from '@/lib/db/schema';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  getCacheHeaders,
} from '@/lib/api/response';
import { ethereumAddressSchema } from '@/lib/validation';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const addressParam = searchParams.get('address');

    // Get all active quests
    const activeQuests = await db.query.quests.findMany({
      where: eq(quests.isActive, true),
      orderBy: [quests.sortOrder, desc(quests.xpReward)],
    });

    // If address provided, get user's progress
    let userProgress: Map<string, { status: string; progress: number; target: number }> = new Map();

    if (addressParam) {
      const addressResult = ethereumAddressSchema.safeParse(addressParam);
      
      if (addressResult.success) {
        const user = await db.query.users.findFirst({
          where: eq(users.walletAddress, addressResult.data),
        });

        if (user) {
          const progress = await db.query.userQuests.findMany({
            where: eq(userQuests.userId, user.id),
          });

          progress.forEach((p) => {
            userProgress.set(p.questId, {
              status: p.status,
              progress: p.currentProgress,
              target: p.targetProgress,
            });
          });
        }
      }
    }

    // Combine quests with progress
    const questsWithProgress = activeQuests.map((quest) => {
      const progress = userProgress.get(quest.id);
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        difficulty: quest.difficulty,
        xpReward: quest.xpReward,
        targetValue: quest.targetValue,
        isRecurring: quest.isRecurring,
        recurringPeriod: quest.recurringPeriod,
        iconUrl: quest.iconUrl,
        badgeUrl: quest.badgeUrl,
        userStatus: progress?.status || 'available',
        userProgress: progress?.progress || 0,
        targetProgress: progress?.target || quest.targetValue,
      };
    });

    // Group by type
    const grouped = {
      daily: questsWithProgress.filter((q) => q.recurringPeriod === 'daily'),
      weekly: questsWithProgress.filter((q) => q.recurringPeriod === 'weekly'),
      oneTime: questsWithProgress.filter((q) => !q.isRecurring),
    };

    logger.info('Quests fetched', {
      ...requestContext,
      questsCount: activeQuests.length,
    });

    return successResponse(
      { quests: questsWithProgress, grouped },
      { headers: getCacheHeaders(60, 120) }
    );
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}
