/**
 * VORTEX PROTOCOL - USER QUERIES
 * Database operations for users
 */

import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';

import { db } from '../index';
import { users, type User, type NewUser } from '../schema';
import { generateReferralCode } from '@/lib/utils';

// ============================================
// CREATE
// ============================================

export async function createUser(data: {
  walletAddress: string;
  farcasterFid?: number;
  farcasterUsername?: string;
  displayName?: string;
  avatarUrl?: string;
  referredByCode?: string;
}): Promise<User> {
  const { walletAddress, referredByCode, ...rest } = data;

  // Find referrer if code provided
  let referredBy: string | undefined;
  if (referredByCode) {
    const referrer = await db.query.users.findFirst({
      where: eq(users.referralCode, referredByCode),
      columns: { id: true },
    });
    referredBy = referrer?.id;
  }

  const [user] = await db
    .insert(users)
    .values({
      walletAddress: walletAddress.toLowerCase(),
      referralCode: generateReferralCode(walletAddress),
      referredBy,
      ...rest,
    })
    .returning();

  // Increment referrer's count if applicable
  if (referredBy) {
    await db
      .update(users)
      .set({
        referralCount: sql`${users.referralCount} + 1`,
      })
      .where(eq(users.id, referredBy));
  }

  return user!;
}

// ============================================
// READ
// ============================================

export async function getUserById(id: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user ?? null;
}

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress.toLowerCase()),
  });
  return user ?? null;
}

export async function getUserByFarcasterFid(fid: number): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.farcasterFid, fid),
  });
  return user ?? null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.referralCode, code),
  });
  return user ?? null;
}

export async function getOrCreateUser(data: {
  walletAddress: string;
  farcasterFid?: number;
  farcasterUsername?: string;
  displayName?: string;
  avatarUrl?: string;
  referredByCode?: string;
}): Promise<User> {
  const existing = await getUserByWallet(data.walletAddress);
  if (existing) {
    return existing;
  }
  return createUser(data);
}

// ============================================
// UPDATE
// ============================================

export async function updateUser(
  id: string,
  data: Partial<Omit<NewUser, 'id' | 'walletAddress' | 'createdAt'>>
): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function updateUserByWallet(
  walletAddress: string,
  data: Partial<Omit<NewUser, 'id' | 'walletAddress' | 'createdAt'>>
): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.walletAddress, walletAddress.toLowerCase()))
    .returning();
  return updated ?? null;
}

export async function incrementUserXp(
  userId: string,
  xpAmount: number
): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set({
      totalXp: sql`${users.totalXp} + ${xpAmount}`,
      weeklyXp: sql`${users.weeklyXp} + ${xpAmount}`,
      monthlyXp: sql`${users.monthlyXp} + ${xpAmount}`,
    })
    .where(eq(users.id, userId))
    .returning();
  return updated ?? null;
}

export async function updateUserStreak(userId: string): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const now = new Date();
  const lastStreak = user.lastStreakDate;
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  let newStreak = 1;

  if (lastStreak) {
    if (lastStreak >= oneDayAgo) {
      // Already logged today, no change
      return user;
    } else if (lastStreak >= twoDaysAgo) {
      // Continue streak
      newStreak = user.currentStreak + 1;
    }
    // else: streak broken, reset to 1
  }

  const [updated] = await db
    .update(users)
    .set({
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastStreakDate: now,
      lastActiveAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
}

export async function incrementUserStats(
  userId: string,
  stats: {
    scans?: number;
    consolidations?: number;
    tokensConsolidated?: number;
    valueConsolidatedUsd?: number;
    gasSavedUsd?: number;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {
    lastActiveAt: new Date(),
  };

  if (stats.scans) {
    updates.totalScans = sql`${users.totalScans} + ${stats.scans}`;
  }
  if (stats.consolidations) {
    updates.totalConsolidations = sql`${users.totalConsolidations} + ${stats.consolidations}`;
  }
  if (stats.tokensConsolidated) {
    updates.totalTokensConsolidated = sql`${users.totalTokensConsolidated} + ${stats.tokensConsolidated}`;
  }
  if (stats.valueConsolidatedUsd) {
    updates.totalValueConsolidatedUsd = sql`${users.totalValueConsolidatedUsd} + ${stats.valueConsolidatedUsd}`;
  }
  if (stats.gasSavedUsd) {
    updates.totalGasSavedUsd = sql`${users.totalGasSavedUsd} + ${stats.gasSavedUsd}`;
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function addReferralEarnings(
  userId: string,
  amountUsd: number
): Promise<void> {
  await db
    .update(users)
    .set({
      referralEarningsUsd: sql`${users.referralEarningsUsd} + ${amountUsd}`,
    })
    .where(eq(users.id, userId));
}

// ============================================
// LEADERBOARD
// ============================================

export async function getLeaderboard(options: {
  period: 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  offset?: number;
}): Promise<{
  entries: Array<{
    rank: number;
    user: Pick<
      User,
      'id' | 'walletAddress' | 'displayName' | 'avatarUrl' | 'farcasterFid' | 'totalXp' | 'weeklyXp'
    >;
  }>;
  total: number;
}> {
  const { period, limit = 25, offset = 0 } = options;

  const xpColumn = period === 'weekly' ? users.weeklyXp : period === 'monthly' ? users.monthlyXp : users.totalXp;

  const results = await db
    .select({
      id: users.id,
      walletAddress: users.walletAddress,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      farcasterFid: users.farcasterFid,
      totalXp: users.totalXp,
      weeklyXp: users.weeklyXp,
      xp: xpColumn,
    })
    .from(users)
    .where(and(eq(users.isActive, true), eq(users.isBanned, false)))
    .orderBy(desc(xpColumn))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.isActive, true), eq(users.isBanned, false)));

  return {
    entries: results.map((row, index) => ({
      rank: offset + index + 1,
      user: {
        id: row.id,
        walletAddress: row.walletAddress,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        farcasterFid: row.farcasterFid,
        totalXp: row.totalXp,
        weeklyXp: row.weeklyXp,
      },
    })),
    total: countResult?.count ?? 0,
  };
}

export async function getUserRank(
  userId: string,
  period: 'weekly' | 'monthly' | 'all_time' = 'all_time'
): Promise<number | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const xpColumn = period === 'weekly' ? users.weeklyXp : period === 'monthly' ? users.monthlyXp : users.totalXp;
  const userXp =
    period === 'weekly' ? user.weeklyXp : period === 'monthly' ? user.monthlyXp : user.totalXp;

  const [result] = await db
    .select({ count: sql<number>`count(*) + 1` })
    .from(users)
    .where(
      and(eq(users.isActive, true), eq(users.isBanned, false), sql`${xpColumn} > ${userXp}`)
    );

  return result?.count ?? null;
}

// ============================================
// MAINTENANCE
// ============================================

export async function resetWeeklyXp(): Promise<void> {
  await db.update(users).set({ weeklyXp: 0 });
}

export async function resetMonthlyXp(): Promise<void> {
  await db.update(users).set({ monthlyXp: 0 });
}

export async function setUserNonce(userId: string, nonce: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await db
    .update(users)
    .set({ nonce, nonceExpiresAt: expiresAt })
    .where(eq(users.id, userId));
}

export async function clearUserNonce(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ nonce: null, nonceExpiresAt: null })
    .where(eq(users.id, userId));
}
