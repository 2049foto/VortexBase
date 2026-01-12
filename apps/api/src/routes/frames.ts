/**
 * VORTEX API - Farcaster Frame Routes
 * Frame v2 endpoints for Warpcast
 */

import { Elysia, t } from 'elysia';

import { scanWallet } from '../services/scanner';
import { calculateBatchRiskScores } from '../services/risk-engine';
import { getLeaderboard } from '../db/queries';
import { CHAIN_ID, env } from '../env';
import {
  generateEntryImage,
  generateScanResultImage,
  generateSuccessImage,
  generateErrorImage,
  generateNoDustImage,
  generateLeaderboardImage,
  type DustToken,
} from '../services/image-generator';

const APP_URL = env.FRONTEND_URL || 'https://vortex.vercel.app';
const API_URL = process.env.API_URL || `http://localhost:${env.PORT}`;

// Frame HTML builder
function buildFrameHtml(options: {
  image: string;
  buttons?: Array<{ label: string; action?: string; target?: string }>;
  postUrl?: string;
  inputText?: string;
  state?: string;
}): string {
  const { image, buttons = [], postUrl, inputText, state } = options;

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${image}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />`;

  if (postUrl) {
    html += `\n  <meta property="fc:frame:post_url" content="${postUrl}" />`;
  }

  if (inputText) {
    html += `\n  <meta property="fc:frame:input:text" content="${inputText}" />`;
  }

  if (state) {
    html += `\n  <meta property="fc:frame:state" content="${state}" />`;
  }

  buttons.slice(0, 4).forEach((button, i) => {
    html += `\n  <meta property="fc:frame:button:${i + 1}" content="${button.label}" />`;
    if (button.action) {
      html += `\n  <meta property="fc:frame:button:${i + 1}:action" content="${button.action}" />`;
    }
    if (button.target) {
      html += `\n  <meta property="fc:frame:button:${i + 1}:target" content="${button.target}" />`;
    }
  });

  html += `
  <meta property="og:image" content="${image}" />
  <meta property="og:title" content="Vortex Protocol" />
</head>
<body>
  <h1>Vortex Protocol - Dust Token Consolidation</h1>
</body>
</html>`;

  return html;
}

export const frameRoutes = new Elysia({ prefix: '/api/frames' })

  // GET /api/frames/scan - Entry frame
  .get('/scan', ({ set }) => {
    set.headers['content-type'] = 'text/html';

    return buildFrameHtml({
      image: `${APP_URL}/api/frames/images/entry`,
      buttons: [
        { label: '🔍 Scan Wallet' },
        { label: '🏆 Leaderboard', action: 'post', target: `${APP_URL}/api/frames/leaderboard` },
      ],
      postUrl: `${APP_URL}/api/frames/scan`,
      inputText: 'Enter wallet address (0x...)',
    });
  })

  // POST /api/frames/scan - Process scan
  .post('/scan', async ({ body, set }) => {
    set.headers['content-type'] = 'text/html';

    try {
      const frameData = body as {
        untrustedData?: { inputText?: string; address?: string };
      };

      const wallet = frameData.untrustedData?.inputText ||
        frameData.untrustedData?.address;

      if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        return buildFrameHtml({
          image: `${APP_URL}/api/frames/images/error?message=Invalid wallet address`,
          buttons: [{ label: '← Try Again' }],
          postUrl: `${APP_URL}/api/frames/scan`,
        });
      }

      // Scan wallet
      const result = await scanWallet(wallet);

      if (result.dustCount === 0) {
        return buildFrameHtml({
          image: `${APP_URL}/api/frames/images/no-dust?wallet=${wallet}`,
          buttons: [
            { label: '🔄 Scan Again' },
            { label: '🏆 Leaderboard', action: 'post', target: `${APP_URL}/api/frames/leaderboard` },
          ],
          postUrl: `${APP_URL}/api/frames/scan`,
        });
      }

      // Calculate risk scores
      const riskScores = await calculateBatchRiskScores(
        result.dustTokens.map((t) => t.address)
      );

      const safeTokens = result.dustTokens.filter(
        (t) => !riskScores[t.address.toLowerCase()]?.excluded
      );

      const state = JSON.stringify({
        wallet,
        scanId: Date.now(), // Placeholder
        tokens: safeTokens.map((t) => t.address),
      });

      return buildFrameHtml({
        image: `${APP_URL}/api/frames/images/scan-result?wallet=${wallet}&count=${safeTokens.length}&value=${result.dustValueUsd.toFixed(2)}`,
        buttons: [
          { label: `🧹 Consolidate ${safeTokens.length} tokens` },
          { label: '🔄 Scan Again' },
        ],
        postUrl: `${APP_URL}/api/frames/consolidate`,
        state: encodeURIComponent(state),
      });
    } catch (error) {
      return buildFrameHtml({
        image: `${APP_URL}/api/frames/images/error?message=Scan failed`,
        buttons: [{ label: '← Try Again' }],
        postUrl: `${APP_URL}/api/frames/scan`,
      });
    }
  })

  // POST /api/frames/consolidate - Process consolidation
  .post('/consolidate', async ({ body, set }) => {
    set.headers['content-type'] = 'text/html';

    // In a real implementation, this would:
    // 1. Parse state to get tokens
    // 2. Build UserOp
    // 3. Return transaction frame for signing

    return buildFrameHtml({
      image: `${APP_URL}/api/frames/images/success?tokens=5&value=25.50&gas=12.30&xp=150`,
      buttons: [
        { label: '🔍 Scan Again' },
        { label: '📤 Share', action: 'link', target: 'https://warpcast.com' },
        { label: '🏆 Leaderboard', action: 'post', target: `${APP_URL}/api/frames/leaderboard` },
      ],
      postUrl: `${APP_URL}/api/frames/scan`,
    });
  })

  // GET /api/frames/leaderboard - Leaderboard frame
  .get('/leaderboard', async ({ set }) => {
    set.headers['content-type'] = 'text/html';

    const entries = await getLeaderboard('weekly', 10);

    return buildFrameHtml({
      image: `${APP_URL}/api/frames/images/leaderboard?period=weekly`,
      buttons: [
        { label: 'Weekly' },
        { label: 'All-Time' },
        { label: '🔍 Scan Wallet', action: 'post', target: `${APP_URL}/api/frames/scan` },
      ],
      postUrl: `${APP_URL}/api/frames/leaderboard`,
    });
  })

  // POST /api/frames/leaderboard - Toggle period
  .post('/leaderboard', async ({ body, set }) => {
    set.headers['content-type'] = 'text/html';

    const frameData = body as { untrustedData?: { buttonIndex?: number } };
    const period = frameData.untrustedData?.buttonIndex === 2 ? 'all_time' : 'weekly';

    return buildFrameHtml({
      image: `${API_URL}/api/frames/images/leaderboard?period=${period}`,
      buttons: [
        { label: 'Weekly' },
        { label: 'All-Time' },
        { label: '🔍 Scan Wallet', action: 'post', target: `${API_URL}/api/frames/scan` },
      ],
      postUrl: `${API_URL}/api/frames/leaderboard`,
    });
  })

  // ============================================
  // IMAGE GENERATION ENDPOINTS
  // ============================================

  // GET /api/frames/images/entry - Entry/welcome image
  .get('/images/entry', async ({ set }) => {
    set.headers['content-type'] = 'image/png';
    set.headers['cache-control'] = 'public, max-age=3600';
    
    const image = await generateEntryImage();
    return new Response(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  })

  // GET /api/frames/images/scan-result - Scan result image
  .get(
    '/images/scan-result',
    async ({ query, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 'public, max-age=60';

      // Parse tokens from query if provided
      const tokens: DustToken[] = [];
      if (query.tokens) {
        try {
          const parsed = JSON.parse(decodeURIComponent(query.tokens));
          if (Array.isArray(parsed)) {
            tokens.push(...parsed);
          }
        } catch {
          // Use placeholder data
          tokens.push(
            { symbol: 'DUST1', amount: '100', valueUsd: 2.5, riskClassification: 'safe' },
            { symbol: 'DUST2', amount: '50', valueUsd: 1.8, riskClassification: 'medium' }
          );
        }
      }

      const totalValue = query.value ? parseFloat(query.value) : tokens.reduce((s, t) => s + t.valueUsd, 0);
      
      const image = await generateScanResultImage(tokens, totalValue, query.wallet);
      return new Response(new Uint8Array(image), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
        },
      });
    },
    {
      query: t.Object({
        wallet: t.Optional(t.String()),
        count: t.Optional(t.String()),
        value: t.Optional(t.String()),
        tokens: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/frames/images/success - Success image
  .get(
    '/images/success',
    async ({ query, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 'public, max-age=60';

      const outputAmount = query.value || '0.00';
      const gasSaved = query.gas || '0.00';
      const tokenCount = query.tokens ? parseInt(query.tokens) : undefined;
      const xpAwarded = query.xp ? parseInt(query.xp) : undefined;

      const image = await generateSuccessImage(outputAmount, gasSaved, tokenCount, xpAwarded);
      return new Response(new Uint8Array(image), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
        },
      });
    },
    {
      query: t.Object({
        value: t.Optional(t.String()),
        gas: t.Optional(t.String()),
        tokens: t.Optional(t.String()),
        xp: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/frames/images/error - Error image
  .get(
    '/images/error',
    async ({ query, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 'public, max-age=60';

      const message = query.message ? decodeURIComponent(query.message) : 'An error occurred';
      
      const image = await generateErrorImage(message);
      return new Response(new Uint8Array(image), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
        },
      });
    },
    {
      query: t.Object({
        message: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/frames/images/no-dust - No dust found image
  .get(
    '/images/no-dust',
    async ({ query, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 'public, max-age=60';

      const image = await generateNoDustImage(query.wallet);
      return new Response(new Uint8Array(image), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
        },
      });
    },
    {
      query: t.Object({
        wallet: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/frames/images/leaderboard - Leaderboard image
  .get(
    '/images/leaderboard',
    async ({ query, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 'public, max-age=300';

      const period = (query.period || 'weekly') as 'weekly' | 'all_time';
      
      // Fetch real leaderboard data
      const entries = await getLeaderboard(period, 10);
      
      const formattedEntries = entries.map((e) => ({
        rank: e.rank,
        wallet: e.user.wallet,
        xp: e.xpTotal,
      }));

      const image = await generateLeaderboardImage(formattedEntries, period);
      return new Response(new Uint8Array(image), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
        },
      });
    },
    {
      query: t.Object({
        period: t.Optional(t.Union([t.Literal('weekly'), t.Literal('all_time')])),
      }),
    }
  );
