/**
 * VORTEX PROTOCOL - SCAN QUERIES
 * Database operations for scans
 */

import { eq, desc, sql, and, gte, count } from 'drizzle-orm';

import { db } from '../index';
import { scans, users, type Scan, type NewScan } from '../schema';
import { incrementUserXp, incrementUserStats, updateUserStreak } from './users';
import { XP_REWARDS } from '@/lib/constants';

// ============================================
// CREATE
// ============================================

export async function createScan(data: NewScan): Promise<Scan> {
  const [scan] = await db.insert(scans).values(data).returning();
  return scan!;
}

// ============================================
// READ
// ============================================

export async function getScanById(id: string): Promise<Scan | null> {
  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, id),
  });
  return scan ?? null;
}

export async function getScansByUserId(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ scans: Scan[]; total: number }> {
  const { limit = 20, offset = 0 } = options ?? {};

  const results = await db.query.scans.findMany({
    where: eq(scans.userId, userId),
    orderBy: desc(scans.createdAt),
    limit,
    offset,
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(scans)
    .where(eq(scans.userId, userId));

  return {
    scans: results,
    total: countResult?.count ?? 0,
  };
}

export async function getLatestScanForWallet(
  walletAddress: string,
  chainId: number
): Promise<Scan | null> {
  const scan = await db.query.scans.findFirst({
    where: and(
      eq(scans.walletAddress, walletAddress.toLowerCase()),
      eq(scans.chainId, chainId)
    ),
    orderBy: desc(scans.createdAt),
  });
  return scan ?? null;
}

export async function getScanCountToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: count() })
    .from(scans)
    .where(and(eq(scans.userId, userId), gte(scans.createdAt, today)));

  return result?.count ?? 0;
}

// ============================================
// UPDATE
// ============================================

export async function updateScan(
  id: string,
  data: Partial<Omit<NewScan, 'id' | 'userId' | 'createdAt'>>
): Promise<Scan | null> {
  const [updated] = await db.update(scans).set(data).where(eq(scans.id, id)).returning();
  return updated ?? null;
}

export async function completeScan(
  id: string,
  data: {
    totalTokens: number;
    dustTokens: number;
    totalValueUsd: number;
    dustValueUsd: number;
    consolidatableValueUsd: number;
    tokensData: Scan['tokensData'];
    scanDurationMs: number;
    rpcProvider: string;
    rpcCallCount?: number;
  }
): Promise<Scan | null> {
  const scan = await getScanById(id);
  if (!scan) return null;

  // Award XP for scan
  const xpAwarded = XP_REWARDS.SCAN;

  const [updated] = await db
    .update(scans)
    .set({
      ...data,
      status: 'completed',
      completedAt: new Date(),
      xpAwarded,
    })
    .where(eq(scans.id, id))
    .returning();

  if (updated) {
    // Update user stats
    await incrementUserXp(scan.userId, xpAwarded);
    await incrementUserStats(scan.userId, { scans: 1 });
    await updateUserStreak(scan.userId);
  }

  return updated ?? null;
}

export async function failScan(
  id: string,
  error: { message: string; code?: string }
): Promise<Scan | null> {
  const [updated] = await db
    .update(scans)
    .set({
      status: 'failed',
      errorMessage: error.message,
      errorCode: error.code,
      completedAt: new Date(),
    })
    .where(eq(scans.id, id))
    .returning();

  return updated ?? null;
}

// ============================================
// STATS
// ============================================

export async function getScanStats(options?: {
  userId?: string;
  chainId?: number;
  since?: Date;
}): Promise<{
  totalScans: number;
  completedScans: number;
  failedScans: number;
  avgDurationMs: number;
  avgDustTokens: number;
  totalDustValueUsd: number;
}> {
  const conditions = [];

  if (options?.userId) {
    conditions.push(eq(scans.userId, options.userId));
  }
  if (options?.chainId) {
    conditions.push(eq(scans.chainId, options.chainId));
  }
  if (options?.since) {
    conditions.push(gte(scans.createdAt, options.since));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      totalScans: count(),
      completedScans: sql<number>`count(*) filter (where ${scans.status} = 'completed')`,
      failedScans: sql<number>`count(*) filter (where ${scans.status} = 'failed')`,
      avgDurationMs: sql<number>`avg(${scans.scanDurationMs})`,
      avgDustTokens: sql<number>`avg(${scans.dustTokens})`,
      totalDustValueUsd: sql<number>`sum(${scans.dustValueUsd})`,
    })
    .from(scans)
    .where(whereClause);

  return {
    totalScans: stats?.totalScans ?? 0,
    completedScans: stats?.completedScans ?? 0,
    failedScans: stats?.failedScans ?? 0,
    avgDurationMs: Math.round(stats?.avgDurationMs ?? 0),
    avgDustTokens: Math.round(stats?.avgDustTokens ?? 0),
    totalDustValueUsd: stats?.totalDustValueUsd ?? 0,
  };
}
