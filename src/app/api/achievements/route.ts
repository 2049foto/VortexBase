/**
 * VORTEX PROTOCOL - ACHIEVEMENTS API
 * Achievement management endpoint
 */

import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { achievements, userAchievements, users } from '@/lib/db/schema';
import { logger, createRequestContext } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  getCacheHeaders,
} from '@/lib/api/response';
import { ethereumAddressSchema } from '@/lib/validation';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const addressParam = searchParams.get('address');

    // Get all achievements
    const allAchievements = await db.query.achievements.findMany({
      orderBy: [achievements.category, achievements.tier, achievements.sortOrder],
    });

    // If address provided, get user's unlocked achievements
    let unlockedIds: Set<string> = new Set();
    let unlockedAchievements: Array<{ achievementId: string; unlockedAt: Date }> = [];

    if (addressParam) {
      const addressResult = ethereumAddressSchema.safeParse(addressParam);
      
      if (addressResult.success) {
        const user = await db.query.users.findFirst({
          where: eq(users.walletAddress, addressResult.data),
        });

        if (user) {
          const unlocked = await db.query.userAchievements.findMany({
            where: eq(userAchievements.userId, user.id),
            orderBy: desc(userAchievements.unlockedAt),
          });

          unlocked.forEach((u) => {
            unlockedIds.add(u.achievementId);
            unlockedAchievements.push({
              achievementId: u.achievementId,
              unlockedAt: u.unlockedAt,
            });
          });
        }
      }
    }

    // Combine achievements with unlock status
    const achievementsWithStatus = allAchievements
      .filter((a) => !a.isSecret || unlockedIds.has(a.id))
      .map((achievement) => {
        const unlockInfo = unlockedAchievements.find(
          (u) => u.achievementId === achievement.id
        );
        return {
          id: achievement.id,
          name: achievement.name,
          title: achievement.title,
          description: achievement.description,
          category: achievement.category,
          tier: achievement.tier,
          xpReward: achievement.xpReward,
          badgeUrl: achievement.badgeUrl,
          isSecret: achievement.isSecret,
          isUnlocked: unlockedIds.has(achievement.id),
          unlockedAt: unlockInfo?.unlockedAt,
        };
      });

    // Group by category
    const grouped = achievementsWithStatus.reduce(
      (acc, achievement) => {
        const category = achievement.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(achievement);
        return acc;
      },
      {} as Record<string, typeof achievementsWithStatus>
    );

    // Stats
    const stats = {
      total: allAchievements.filter((a) => !a.isSecret).length,
      unlocked: unlockedIds.size,
      totalXpEarned: unlockedAchievements.reduce((sum, u) => {
        const achievement = allAchievements.find((a) => a.id === u.achievementId);
        return sum + (achievement?.xpReward || 0);
      }, 0),
    };

    logger.info('Achievements fetched', {
      ...requestContext,
      achievementsCount: achievementsWithStatus.length,
      unlockedCount: unlockedIds.size,
    });

    return successResponse(
      { achievements: achievementsWithStatus, grouped, stats },
      { headers: getCacheHeaders(120, 300) }
    );
  } catch (error) {
    return errorResponse(error, requestContext);
  }
}
