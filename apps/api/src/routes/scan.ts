/**
 * VORTEX API - Scan Routes
 */

import { Elysia, t } from 'elysia';

import { authMiddleware, type AuthUser } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rate-limit';
import { scanWallet } from '../services/scanner';
import { calculateBatchRiskScores } from '../services/risk-engine';
import { createScan, awardXp } from '../db/queries';
import { CHAIN_ID } from '../env';

export const scanRoutes = new Elysia({ prefix: '/api' })
  .use(createRateLimiter('scan'))
  .use(authMiddleware)

  // POST /api/scan - Scan wallet for dust tokens
  .post(
    '/scan',
    async (ctx) => {
      const { body } = ctx;
      const user = (ctx as unknown as { user: AuthUser }).user;
      const startTime = performance.now();

      // Scan wallet
      const scanResult = await scanWallet(body.wallet);

      // Calculate risk scores for dust tokens
      let riskScores: Record<string, { total: number; classification: string; excluded: boolean }> = {};

      if (scanResult.dustTokens.length > 0) {
        const addresses = scanResult.dustTokens.map((t) => t.address);
        riskScores = await calculateBatchRiskScores(addresses);
      }

      // Merge risk scores into dust tokens
      const dustTokensWithRisk = scanResult.dustTokens.map((token) => ({
        ...token,
        valueUsd: token.valueUsd ?? 0,
        riskScore: riskScores[token.address.toLowerCase()]?.total ?? 0,
        riskClassification:
          riskScores[token.address.toLowerCase()]?.classification ?? 'safe',
        excluded: riskScores[token.address.toLowerCase()]?.excluded ?? false,
      }));

      // Filter out excluded tokens
      const safeTokens = dustTokensWithRisk.filter((t) => !t.excluded);

      // Prepare tokens for DB
      const tokensForDb = scanResult.tokens.map((t) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        balance: t.balance,
        decimals: t.decimals,
        valueUsd: t.valueUsd ?? 0,
        logo: t.logo,
      }));

      // Save scan to database
      const scan = await createScan({
        userId: user.id,
        wallet: body.wallet,
        dustTokensCount: safeTokens.length,
        dustValueUsd: safeTokens.reduce((sum, t) => sum + t.valueUsd, 0),
        scanResult: {
          tokens: tokensForDb,
          scannedAt: scanResult.scannedAt,
          durationMs: scanResult.durationMs,
        },
      });

      // Award XP for scan
      await awardXp(user.id, 50, 'scan', scan.id);

      const durationMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        data: {
          scanId: scan.id,
          wallet: body.wallet,
          chainId: CHAIN_ID,
          dustTokens: dustTokensWithRisk,
          dustValueUsd: scanResult.dustValueUsd,
          dustCount: safeTokens.length,
          excludedCount: dustTokensWithRisk.length - safeTokens.length,
          xpAwarded: 50,
          durationMs,
        },
      };
    },
    {
      body: t.Object({
        wallet: t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
      }),
    }
  );
