/**
 * VORTEX API - Bundler Service
 * Pimlico bundler submission + polling
 * 
 * This service wraps account-abstraction functions with
 * database integration for tracking consolidation status.
 */

import { eq } from 'drizzle-orm';
import type { Hex } from 'viem';

import {
  submitUserOperation,
  waitForUserOperation,
  type UserOperation,
  type UserOpResult,
} from './account-abstraction';
import { db } from '../db/client';
import { consolidations } from '../db/schema';
import { awardXp } from '../db/queries';
import { log } from '../middleware/logger';

// ============================================
// TYPES
// ============================================

export interface BundlerSubmitResult {
  userOpHash: string;
  success: boolean;
  error?: string;
}

export interface BundlerReceiptResult {
  userOpHash: string;
  transactionHash?: string;
  blockNumber?: number;
  success: boolean;
  error?: string;
}

export interface ConsolidationResult {
  consolidationId: string;
  userOpHash: string;
  transactionHash?: string;
  success: boolean;
  xpAwarded?: number;
  error?: string;
}

// ============================================
// BUNDLER FUNCTIONS
// ============================================

/**
 * Submit a signed UserOp to the bundler
 * Updates consolidation record with userOpHash
 */
export async function submitUserOp(
  consolidationId: string,
  signedUserOp: UserOperation
): Promise<BundlerSubmitResult> {
  log.info({ consolidationId }, 'Submitting UserOp to bundler');

  // Submit to bundler
  const result = await submitUserOperation(signedUserOp);

  if (!result.success) {
    // Update consolidation as failed
    await db
      .update(consolidations)
      .set({
        status: 'failed',
        errorMessage: result.error,
      })
      .where(eq(consolidations.id, consolidationId));

    log.error({
      consolidationId,
      error: result.error,
    }, 'UserOp submission failed');

    return {
      userOpHash: '',
      success: false,
      error: result.error,
    };
  }

  // Update consolidation with userOpHash
  await db
    .update(consolidations)
    .set({
      useropHash: result.userOpHash,
    })
    .where(eq(consolidations.id, consolidationId));

  log.info({
    consolidationId,
    userOpHash: result.userOpHash,
  }, 'UserOp submitted successfully');

  return {
    userOpHash: result.userOpHash,
    success: true,
  };
}

/**
 * Poll for UserOp receipt
 * Polls every 2 seconds for up to 45 seconds
 */
export async function pollUserOpReceipt(
  userOpHash: Hex,
  timeoutMs: number = 45000
): Promise<BundlerReceiptResult> {
  log.info({ userOpHash, timeoutMs }, 'Polling for UserOp receipt');

  const result = await waitForUserOperation(userOpHash, timeoutMs);

  if (!result.success) {
    return {
      userOpHash,
      success: false,
      error: result.error || 'Transaction failed',
    };
  }

  return {
    userOpHash,
    transactionHash: result.transactionHash,
    success: true,
  };
}

/**
 * Complete the consolidation flow:
 * 1. Submit UserOp
 * 2. Poll for receipt
 * 3. Update database
 * 4. Award XP
 */
export async function executeConsolidation(
  consolidationId: string,
  userId: string,
  signedUserOp: UserOperation
): Promise<ConsolidationResult> {
  const startTime = performance.now();

  try {
    // Step 1: Submit UserOp
    const submitResult = await submitUserOp(consolidationId, signedUserOp);

    if (!submitResult.success) {
      return {
        consolidationId,
        userOpHash: '',
        success: false,
        error: submitResult.error,
      };
    }

    // Step 2: Poll for receipt
    const receiptResult = await pollUserOpReceipt(
      submitResult.userOpHash as Hex
    );

    if (!receiptResult.success) {
      // Update consolidation as failed
      await db
        .update(consolidations)
        .set({
          status: 'failed',
          errorMessage: receiptResult.error,
        })
        .where(eq(consolidations.id, consolidationId));

      return {
        consolidationId,
        userOpHash: submitResult.userOpHash,
        success: false,
        error: receiptResult.error,
      };
    }

    // Step 3: Update consolidation as successful
    await db
      .update(consolidations)
      .set({
        status: 'success',
        txHash: receiptResult.transactionHash,
        completedAt: new Date(),
      })
      .where(eq(consolidations.id, consolidationId));

    // Step 4: Award XP
    const XP_CONSOLIDATE = 150;
    await awardXp(userId, XP_CONSOLIDATE, 'consolidate', consolidationId);

    const durationMs = Math.round(performance.now() - startTime);

    log.info({
      consolidationId,
      userOpHash: submitResult.userOpHash,
      txHash: receiptResult.transactionHash,
      xpAwarded: XP_CONSOLIDATE,
      durationMs,
    }, 'Consolidation completed successfully');

    return {
      consolidationId,
      userOpHash: submitResult.userOpHash,
      transactionHash: receiptResult.transactionHash,
      success: true,
      xpAwarded: XP_CONSOLIDATE,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update consolidation as failed
    await db
      .update(consolidations)
      .set({
        status: 'failed',
        errorMessage,
      })
      .where(eq(consolidations.id, consolidationId));

    log.error({
      consolidationId,
      error: errorMessage,
    }, 'Consolidation execution failed');

    return {
      consolidationId,
      userOpHash: '',
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get consolidation status by userOpHash
 */
export async function getConsolidationByUserOpHash(userOpHash: string) {
  return db.query.consolidations.findFirst({
    where: eq(consolidations.useropHash, userOpHash),
  });
}

/**
 * Get pending consolidations for a user
 */
export async function getPendingConsolidations(userId: string) {
  return db.query.consolidations.findMany({
    where: (c, { and, eq }) =>
      and(eq(c.userId, userId), eq(c.status, 'pending')),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    limit: 10,
  });
}
