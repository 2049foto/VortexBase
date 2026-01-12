/**
 * VORTEX API - Common Database Queries
 */

import { eq, desc, sql, and, gte, lte, sum, count } from 'drizzle-orm';

import { db } from './client';
import {
  users,
  scans,
  dustTokens,
  consolidations,
  xpTransactions,
  leaderboards,
  quests,
  questCompletions,
  referrals,
  authNonces,
  auditLogs,
  type User,
  type Scan,
  type ScanResultJson,
} from './schema';

// ============================================
// USERS
// ============================================

export async function getUserByWallet(wallet: string): Promise<User | undefined> {
  const result = await db.query.users.findFirst({
    where: eq(users.wallet, wallet.toLowerCase()),
  });
  return result;
}

export async function getOrCreateUser(wallet: string, fid?: number): Promise<User> {
  const existing = await getUserByWallet(wallet);
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      wallet: wallet.toLowerCase(),
      farcasterId: fid,
    })
    .returning();

  return created!;
}

export async function getUserStats(userId: string) {
  // Total XP
  const [xpResult] = await db
    .select({ total: sum(xpTransactions.xpAmount) })
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, userId));

  // Total scans
  const [scansResult] = await db
    .select({ count: count() })
    .from(scans)
    .where(eq(scans.userId, userId));

  // Total consolidations (successful)
  const [consolidationsResult] = await db
    .select({ count: count() })
    .from(consolidations)
    .where(
      and(
        eq(consolidations.userId, userId),
        eq(consolidations.status, 'success')
      )
    );

  // Gas saved (sum of protocol fees as proxy)
  const [gasSavedResult] = await db
    .select({ total: sum(consolidations.protocolFee) })
    .from(consolidations)
    .where(
      and(
        eq(consolidations.userId, userId),
        eq(consolidations.status, 'success')
      )
    );

  return {
    totalXp: Number(xpResult?.total || 0),
    totalScans: Number(scansResult?.count || 0),
    totalConsolidations: Number(consolidationsResult?.count || 0),
    gasSavedUsd: Number(gasSavedResult?.total || 0),
  };
}

// ============================================
// SCANS
// ============================================

export async function createScan(data: {
  userId: string;
  wallet: string;
  dustTokensCount: number;
  dustValueUsd: number;
  scanResult: ScanResultJson;
}): Promise<Scan> {
  const [scan] = await db
    .insert(scans)
    .values({
      userId: data.userId,
      wallet: data.wallet.toLowerCase(),
      chainId: 8453, // Base only
      dustTokensCount: data.dustTokensCount,
      dustValueUsd: data.dustValueUsd.toString(),
      scanResult: data.scanResult,
    })
    .returning();

  return scan!;
}

export async function getRecentScans(userId: string, limit = 5) {
  return db.query.scans.findMany({
    where: eq(scans.userId, userId),
    orderBy: desc(scans.createdAt),
    limit,
    with: {
      dustTokens: true,
    },
  });
}

// ============================================
// XP
// ============================================

export async function awardXp(
  userId: string,
  amount: number,
  reason: 'scan' | 'share' | 'consolidate' | 'quest_claim' | 'referral' | 'streak',
  referenceId?: string
): Promise<void> {
  await db.insert(xpTransactions).values({
    userId,
    xpAmount: amount,
    reason,
    referenceId,
  });
}

export async function getTotalXp(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: sum(xpTransactions.xpAmount) })
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, userId));

  return Number(result?.total || 0);
}

// ============================================
// LEADERBOARD
// ============================================

export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'all_time',
  limit = 100
) {
  // Get from cache table or compute
  const entries = await db.query.leaderboards.findMany({
    where: eq(leaderboards.period, period),
    orderBy: leaderboards.rank,
    limit,
    with: {
      user: true,
    },
  });

  return entries;
}

export async function getUserRank(
  userId: string,
  period: 'daily' | 'weekly' | 'all_time'
): Promise<number | null> {
  const entry = await db.query.leaderboards.findFirst({
    where: and(
      eq(leaderboards.userId, userId),
      eq(leaderboards.period, period)
    ),
  });

  return entry?.rank ?? null;
}

// ============================================
// QUESTS
// ============================================

export async function getActiveQuests() {
  const now = new Date();

  return db.query.quests.findMany({
    where: and(lte(quests.activeFrom, now)),
  });
}

export async function getUserQuestProgress(userId: string) {
  const completions = await db.query.questCompletions.findMany({
    where: eq(questCompletions.userId, userId),
    with: {
      quest: true,
    },
  });

  return completions;
}

// ============================================
// AUTH NONCES
// ============================================

export async function createNonce(wallet: string, nonce: string, ttlSeconds = 300) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await db
    .delete(authNonces)
    .where(eq(authNonces.wallet, wallet.toLowerCase()));

  await db.insert(authNonces).values({
    wallet: wallet.toLowerCase(),
    nonce,
    expiresAt,
  });
}

export async function verifyNonce(wallet: string, nonce: string): Promise<boolean> {
  const record = await db.query.authNonces.findFirst({
    where: and(
      eq(authNonces.wallet, wallet.toLowerCase()),
      eq(authNonces.nonce, nonce),
      gte(authNonces.expiresAt, new Date())
    ),
  });

  if (record) {
    await db.delete(authNonces).where(eq(authNonces.id, record.id));
    return true;
  }

  return false;
}

// ============================================
// AUDIT LOGS
// ============================================

export async function logAudit(
  action: string,
  details?: Record<string, unknown>,
  userId?: string
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    details,
  });
}
