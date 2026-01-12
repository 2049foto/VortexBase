/**
 * VORTEX API - Risk Routes
 */

import { Elysia, t } from 'elysia';

import { calculateRiskScore, calculateBatchRiskScores } from '../services/risk-engine';

export const riskRoutes = new Elysia({ prefix: '/api/risk' })

  // GET /api/risk/:token - Get risk score for a single token
  .get(
    '/:token',
    async ({ params }) => {
      const riskScore = await calculateRiskScore(params.token);

      return {
        success: true,
        data: {
          token: params.token,
          ...riskScore,
        },
      };
    },
    {
      params: t.Object({
        token: t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
      }),
    }
  )

  // POST /api/risk/batch - Get risk scores for multiple tokens
  .post(
    '/batch',
    async ({ body }) => {
      const riskScores = await calculateBatchRiskScores(body.tokens);

      return {
        success: true,
        data: Object.entries(riskScores).map(([address, score]) => ({
          token: address,
          ...score,
        })),
      };
    },
    {
      body: t.Object({
        tokens: t.Array(t.String({ pattern: '^0x[a-fA-F0-9]{40}$' }), {
          maxItems: 50,
        }),
      }),
    }
  );
