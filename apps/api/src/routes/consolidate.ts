/**
 * VORTEX API - Consolidation Routes
 */

import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';

import { authMiddleware, type AuthUser } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rate-limit';
import { buildMultiSwapTransaction } from '../services/swap';
import {
  estimateUserOpGas,
  getGasPrice,
  getPaymasterData,
  submitUserOperation,
  waitForUserOperation,
  type UserOperation,
} from '../services/account-abstraction';
import { db } from '../db/client';
import { consolidations, scans } from '../db/schema';
import { awardXp } from '../db/queries';
import { CONTRACTS, PROTOCOL_FEE } from '../env';
import { NotFoundError, ValidationError } from '../middleware/error-handler';

export const consolidateRoutes = new Elysia({ prefix: '/api' })
  .use(createRateLimiter('consolidate'))
  .use(authMiddleware)

  // POST /api/consolidate - Build consolidation UserOp
  .post(
    '/consolidate',
    async (ctx) => {
      const { body } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      // Get scan
      const [scan] = await db
        .select()
        .from(scans)
        .where(eq(scans.id, body.scanId));

      if (!scan) {
        throw new NotFoundError('Scan');
      }

      if (scan.userId !== user.id) {
        throw new ValidationError('Scan does not belong to user');
      }

      // Build swap transactions
      const swaps = await buildMultiSwapTransaction(
        body.inputTokens.map((t) => ({
          address: t.address,
          amount: t.amount,
        })),
        body.outputToken,
        user.wallet,
        body.slippage || 0.5
      );

      // Calculate total output and fee
      const totalOutput = swaps.reduce(
        (sum, s) => sum + BigInt(s.quote.toAmount),
        0n
      );
      const protocolFeeAmount = (totalOutput * BigInt(Math.floor(PROTOCOL_FEE * 10000))) / 10000n;
      const netOutput = totalOutput - protocolFeeAmount;

      // Estimate gas
      const gasEstimate = await estimateUserOpGas({
        sender: user.wallet as `0x${string}`,
        callData: swaps[0]?.tx.data as `0x${string}`,
      });

      const gasPrice = await getGasPrice();

      // Get paymaster sponsorship
      const paymasterData = await getPaymasterData({
        sender: user.wallet as `0x${string}`,
        callData: swaps[0]?.tx.data as `0x${string}`,
        ...gasEstimate,
        ...gasPrice,
      });

      // Create consolidation record
      const [consolidation] = await db
        .insert(consolidations)
        .values({
          userId: user.id,
          scanId: body.scanId,
          inputTokens: body.inputTokens.map((t) => t.address),
          outputToken: body.outputToken,
          outputAmount: netOutput.toString(),
          protocolFee: (Number(protocolFeeAmount) / 1e18).toString(),
          status: 'pending',
        })
        .returning();

      return {
        success: true,
        data: {
          consolidationId: consolidation!.id,
          userOp: {
            sender: user.wallet,
            callData: swaps[0]?.tx.data,
            ...gasEstimate,
            ...gasPrice,
            ...paymasterData,
          },
          quote: {
            inputTokens: body.inputTokens.length,
            outputToken: body.outputToken,
            totalOutputAmount: totalOutput.toString(),
            protocolFee: protocolFeeAmount.toString(),
            netOutputAmount: netOutput.toString(),
          },
          message: 'Sign the UserOperation to proceed',
        },
      };
    },
    {
      body: t.Object({
        scanId: t.String({ format: 'uuid' }),
        inputTokens: t.Array(
          t.Object({
            address: t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
            amount: t.String(),
          }),
          { minItems: 1, maxItems: 50 }
        ),
        outputToken: t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
        slippage: t.Optional(t.Number({ minimum: 0.1, maximum: 2 })),
      }),
    }
  )

  // POST /api/consolidate/submit - Submit signed UserOp
  .post(
    '/consolidate/submit',
    async (ctx) => {
      const { body } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      // Get consolidation
      const [consolidation] = await db
        .select()
        .from(consolidations)
        .where(eq(consolidations.id, body.consolidationId));

      if (!consolidation) {
        throw new NotFoundError('Consolidation');
      }

      if (consolidation.userId !== user.id) {
        throw new ValidationError('Consolidation does not belong to user');
      }

      if (consolidation.status !== 'pending') {
        throw new ValidationError('Consolidation already processed');
      }

      // Submit to bundler
      const submitResult = await submitUserOperation(
        body.signedUserOp as UserOperation
      );

      if (!submitResult.success) {
        await db
          .update(consolidations)
          .set({
            status: 'failed',
            errorMessage: submitResult.error,
          })
          .where(eq(consolidations.id, body.consolidationId));

        throw new ValidationError(submitResult.error || 'Failed to submit');
      }

      // Update with UserOp hash
      await db
        .update(consolidations)
        .set({
          useropHash: submitResult.userOpHash,
        })
        .where(eq(consolidations.id, body.consolidationId));

      // Wait for confirmation
      const receipt = await waitForUserOperation(submitResult.userOpHash);

      if (receipt.success && receipt.transactionHash) {
        // Update as successful
        await db
          .update(consolidations)
          .set({
            status: 'success',
            txHash: receipt.transactionHash,
            completedAt: new Date(),
          })
          .where(eq(consolidations.id, body.consolidationId));

        // Award XP
        await awardXp(user.id, 150, 'consolidate', body.consolidationId);

        return {
          success: true,
          data: {
            consolidationId: body.consolidationId,
            txHash: receipt.transactionHash,
            userOpHash: submitResult.userOpHash,
            xpAwarded: 150,
            message: 'Consolidation successful!',
          },
        };
      } else {
        await db
          .update(consolidations)
          .set({
            status: 'failed',
            errorMessage: receipt.error,
          })
          .where(eq(consolidations.id, body.consolidationId));

        throw new ValidationError(receipt.error || 'Transaction failed');
      }
    },
    {
      body: t.Object({
        consolidationId: t.String({ format: 'uuid' }),
        signedUserOp: t.Any(), // UserOperation object
      }),
    }
  );
