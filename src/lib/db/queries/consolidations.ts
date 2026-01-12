/**
 * VORTEX PROTOCOL - CONSOLIDATION QUERIES
 * Database operations for consolidations
 */

import { eq, desc, sql, and, gte, count } from 'drizzle-orm';

import { db } from '../index';
import {
  consolidations,
  users,
  type Consolidation,
  type NewConsolidation,
} from '../schema';
import { incrementUserXp, incrementUserStats, addReferralEarnings } from './users';
import { XP_REWARDS, PROTOCOL_FEES } from '@/lib/constants';

// ============================================
// CREATE
// ============================================

export async function createConsolidation(data: NewConsolidation): Promise<Consolidation> {
  const [consolidation] = await db.insert(consolidations).values(data).returning();
  return consolidation!;
}

// ============================================
// READ
// ============================================

export async function getConsolidationById(id: string): Promise<Consolidation | null> {
  const consolidation = await db.query.consolidations.findFirst({
    where: eq(consolidations.id, id),
  });
  return consolidation ?? null;
}

export async function getConsolidationByUserOpHash(
  userOpHash: string
): Promise<Consolidation | null> {
  const consolidation = await db.query.consolidations.findFirst({
    where: eq(consolidations.userOpHash, userOpHash),
  });
  return consolidation ?? null;
}

export async function getConsolidationByTxHash(txHash: string): Promise<Consolidation | null> {
  const consolidation = await db.query.consolidations.findFirst({
    where: eq(consolidations.txHash, txHash),
  });
  return consolidation ?? null;
}

export async function getConsolidationsByUserId(
  userId: string,
  options?: { limit?: number; offset?: number; status?: Consolidation['status'] }
): Promise<{ consolidations: Consolidation[]; total: number }> {
  const { limit = 20, offset = 0, status } = options ?? {};

  const conditions = [eq(consolidations.userId, userId)];
  if (status) {
    conditions.push(eq(consolidations.status, status));
  }

  const results = await db.query.consolidations.findMany({
    where: and(...conditions),
    orderBy: desc(consolidations.createdAt),
    limit,
    offset,
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(consolidations)
    .where(and(...conditions));

  return {
    consolidations: results,
    total: countResult?.count ?? 0,
  };
}

export async function getPendingConsolidations(): Promise<Consolidation[]> {
  return db.query.consolidations.findMany({
    where: eq(consolidations.status, 'submitted'),
    orderBy: consolidations.submittedAt,
  });
}

// ============================================
// UPDATE
// ============================================

export async function updateConsolidation(
  id: string,
  data: Partial<Omit<NewConsolidation, 'id' | 'userId' | 'createdAt'>>
): Promise<Consolidation | null> {
  const [updated] = await db
    .update(consolidations)
    .set(data)
    .where(eq(consolidations.id, id))
    .returning();
  return updated ?? null;
}

export async function markConsolidationSimulated(
  id: string,
  passed: boolean,
  error?: string
): Promise<Consolidation | null> {
  const [updated] = await db
    .update(consolidations)
    .set({
      status: passed ? 'pending' : 'failed',
      simulationPassed: passed,
      simulationError: error,
      simulatedAt: new Date(),
    })
    .where(eq(consolidations.id, id))
    .returning();
  return updated ?? null;
}

export async function markConsolidationSubmitted(
  id: string,
  userOpHash: string
): Promise<Consolidation | null> {
  const [updated] = await db
    .update(consolidations)
    .set({
      status: 'submitted',
      userOpHash,
      submittedAt: new Date(),
    })
    .where(eq(consolidations.id, id))
    .returning();
  return updated ?? null;
}

export async function confirmConsolidation(
  id: string,
  data: {
    txHash: string;
    blockNumber: bigint;
    blockTimestamp?: Date;
    amountOut: string;
    amountOutUsd: number;
    gasUsedWei: string;
    gasActualUsd: number;
    gasSavedUsd: number;
    protocolFeeUsd: number;
  }
): Promise<Consolidation | null> {
  const consolidation = await getConsolidationById(id);
  if (!consolidation) return null;

  // Calculate XP based on number of tokens consolidated
  const tokensCount = consolidation.tokensIn.length;
  const xpAwarded = XP_REWARDS.CLEAN * tokensCount;

  const [updated] = await db
    .update(consolidations)
    .set({
      status: 'confirmed',
      ...data,
      xpAwarded,
      confirmedAt: new Date(),
    })
    .where(eq(consolidations.id, id))
    .returning();

  if (updated) {
    // Update user stats
    await incrementUserXp(consolidation.userId, xpAwarded);
    await incrementUserStats(consolidation.userId, {
      consolidations: 1,
      tokensConsolidated: tokensCount,
      valueConsolidatedUsd: data.amountOutUsd,
      gasSavedUsd: data.gasSavedUsd,
    });

    // Handle referral earnings
    if (consolidation.referrerId && data.protocolFeeUsd > 0) {
      const referralFee = data.protocolFeeUsd * PROTOCOL_FEES.REFERRAL_SHARE;
      await addReferralEarnings(consolidation.referrerId, referralFee);
      await db
        .update(consolidations)
        .set({ referralFeeUsd: String(referralFee) })
        .where(eq(consolidations.id, id));
    }
  }

  return updated ?? null;
}

export async function failConsolidation(
  id: string,
  error: { message: string; code?: string }
): Promise<Consolidation | null> {
  const consolidation = await getConsolidationById(id);
  if (!consolidation) return null;

  const newRetryCount = (consolidation.retryCount ?? 0) + 1;

  const [updated] = await db
    .update(consolidations)
    .set({
      status: 'failed',
      errorMessage: error.message,
      errorCode: error.code,
      retryCount: newRetryCount,
    })
    .where(eq(consolidations.id, id))
    .returning();

  return updated ?? null;
}

// ============================================
// STATS
// ============================================

export async function getConsolidationStats(options?: {
  userId?: string;
  chainId?: number;
  since?: Date;
}): Promise<{
  totalConsolidations: number;
  confirmedConsolidations: number;
  failedConsolidations: number;
  totalValueUsd: number;
  totalGasSavedUsd: number;
  totalProtocolFeesUsd: number;
  avgTokensPerConsolidation: number;
}> {
  const conditions = [];

  if (options?.userId) {
    conditions.push(eq(consolidations.userId, options.userId));
  }
  if (options?.chainId) {
    conditions.push(eq(consolidations.chainId, options.chainId));
  }
  if (options?.since) {
    conditions.push(gte(consolidations.createdAt, options.since));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      totalConsolidations: count(),
      confirmedConsolidations: sql<number>`count(*) filter (where ${consolidations.status} = 'confirmed')`,
      failedConsolidations: sql<number>`count(*) filter (where ${consolidations.status} = 'failed')`,
      totalValueUsd: sql<number>`sum(${consolidations.amountOutUsd}) filter (where ${consolidations.status} = 'confirmed')`,
      totalGasSavedUsd: sql<number>`sum(${consolidations.gasSavedUsd}) filter (where ${consolidations.status} = 'confirmed')`,
      totalProtocolFeesUsd: sql<number>`sum(${consolidations.protocolFeeUsd}) filter (where ${consolidations.status} = 'confirmed')`,
      avgTokensPerConsolidation: sql<number>`avg(array_length(${consolidations.tokensIn}, 1))`,
    })
    .from(consolidations)
    .where(whereClause);

  return {
    totalConsolidations: stats?.totalConsolidations ?? 0,
    confirmedConsolidations: stats?.confirmedConsolidations ?? 0,
    failedConsolidations: stats?.failedConsolidations ?? 0,
    totalValueUsd: stats?.totalValueUsd ?? 0,
    totalGasSavedUsd: stats?.totalGasSavedUsd ?? 0,
    totalProtocolFeesUsd: stats?.totalProtocolFeesUsd ?? 0,
    avgTokensPerConsolidation: Math.round(stats?.avgTokensPerConsolidation ?? 0),
  };
}

export async function getRecentConsolidations(limit = 10): Promise<Consolidation[]> {
  return db.query.consolidations.findMany({
    where: eq(consolidations.status, 'confirmed'),
    orderBy: desc(consolidations.confirmedAt),
    limit,
  });
}
