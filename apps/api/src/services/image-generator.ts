/**
 * VORTEX API - Image Generator Service
 * OG images for Farcaster Frames using Satori
 * 
 * Features:
 * - 5 image types (entry, scan-result, success, error, no-dust)
 * - 1200x630px size
 * - <500ms generation
 * - <50KB output
 */

import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { log } from '../middleware/logger';
import type { ReactNode } from 'react';

// ============================================
// CONFIGURATION
// ============================================

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

// Default Satori options with system font
const satoriOptions: SatoriOptions = {
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  fonts: [],
  embedFont: false,
};

// Vortex brand colors
const COLORS = {
  background: '#0a0a0f',
  primary: '#00d4ff',
  success: '#00ff88',
  error: '#ff4444',
  warning: '#ffaa00',
  text: '#ffffff',
  textMuted: '#a0a0a0',
};

// ============================================
// TYPES
// ============================================

export interface DustToken {
  symbol: string;
  amount: string;
  valueUsd: number;
  riskScore?: number;
  riskClassification?: 'safe' | 'medium' | 'high';
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  xp: number;
}

// ============================================
// HELPERS
// ============================================

function truncateWallet(wallet: string): string {
  if (!wallet || wallet.length < 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function getRiskColor(classification?: string): string {
  switch (classification) {
    case 'safe':
      return COLORS.success;
    case 'medium':
      return COLORS.warning;
    case 'high':
      return COLORS.error;
    default:
      return COLORS.textMuted;
  }
}

function getRiskEmoji(classification?: string): string {
  switch (classification) {
    case 'safe':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🔴';
    default:
      return '⚪';
  }
}

// ============================================
// ELEMENT HELPER
// ============================================

function h(
  type: string,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): ReactNode {
  return {
    type,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children,
    },
  } as unknown as ReactNode;
}

// ============================================
// SVG TO PNG CONVERSION
// ============================================

async function svgToPng(svg: string): Promise<Uint8Array> {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: IMAGE_WIDTH,
    },
  });
  
  const pngData = resvg.render();
  return pngData.asPng();
}

// ============================================
// IMAGE GENERATORS
// ============================================

/**
 * Generate entry/welcome image
 */
export async function generateEntryImage(): Promise<Uint8Array> {
  const startTime = performance.now();

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.background,
      fontFamily: 'sans-serif',
    },
  },
    h('div', {
      style: {
        fontSize: 72,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
      },
    }, '🌀 VORTEX'),
    h('div', {
      style: {
        fontSize: 36,
        color: COLORS.text,
        marginBottom: 40,
      },
    }, 'Clean Your Dust Tokens'),
    h('div', {
      style: {
        fontSize: 24,
        color: COLORS.textMuted,
        textAlign: 'center',
      },
    }, 'Consolidate worthless tokens into USDC • Gasless • Base Chain')
  );

  const svg = await satori(element, satoriOptions);

  const png = await svgToPng(svg);

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({ type: 'entry', durationMs, sizeKb: Math.round(png.length / 1024) }, 'Image generated');

  return png;
}

/**
 * Generate scan result image showing dust tokens
 */
export async function generateScanResultImage(
  dustTokens: DustToken[],
  totalValueUsd: number,
  wallet?: string
): Promise<Uint8Array> {
  const startTime = performance.now();

  const displayTokens = dustTokens.slice(0, 5);

  const tokenRows = displayTokens.map((token) =>
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 0',
        borderBottom: `1px solid ${COLORS.textMuted}33`,
      },
    },
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 12 },
      },
        h('span', { style: { fontSize: 20 } }, getRiskEmoji(token.riskClassification)),
        h('span', {
          style: { fontSize: 24, color: COLORS.text, fontWeight: 'bold' },
        }, token.symbol)
      ),
      h('div', {
        style: { fontSize: 24, color: getRiskColor(token.riskClassification) },
      }, formatUsd(token.valueUsd))
    )
  );

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 60,
      background: COLORS.background,
      fontFamily: 'sans-serif',
    },
  },
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
      },
    },
      h('div', {
        style: { fontSize: 48, fontWeight: 'bold', color: COLORS.primary },
      }, '🔍 Dust Found!'),
      wallet ? h('div', {
        style: { fontSize: 20, color: COLORS.textMuted },
      }, truncateWallet(wallet)) : null
    ),
    h('div', {
      style: { display: 'flex', flexDirection: 'column', flex: 1 },
    }, ...tokenRows),
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 30,
        paddingTop: 20,
        borderTop: `2px solid ${COLORS.primary}`,
      },
    },
      h('div', {
        style: { fontSize: 28, color: COLORS.text },
      }, `${dustTokens.length} dust tokens`),
      h('div', {
        style: { fontSize: 36, fontWeight: 'bold', color: COLORS.success },
      }, `Total: ${formatUsd(totalValueUsd)}`)
    )
  );

  const svg = await satori(element, satoriOptions);

  const png = await svgToPng(svg);

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({
    type: 'scan-result',
    tokenCount: dustTokens.length,
    durationMs,
    sizeKb: Math.round(png.length / 1024),
  }, 'Image generated');

  return png;
}

/**
 * Generate success image after consolidation
 */
export async function generateSuccessImage(
  outputAmount: string,
  gasSaved: string,
  tokenCount?: number,
  xpAwarded?: number
): Promise<Uint8Array> {
  const startTime = performance.now();

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.background,
      fontFamily: 'sans-serif',
    },
  },
    h('div', { style: { fontSize: 80, marginBottom: 20 } }, '✅'),
    h('div', {
      style: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.success,
        marginBottom: 30,
      },
    }, 'Consolidation Successful!'),
    h('div', {
      style: { display: 'flex', gap: 60, marginBottom: 40 },
    },
      h('div', {
        style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
      },
        h('div', { style: { fontSize: 18, color: COLORS.textMuted } }, 'You received'),
        h('div', {
          style: { fontSize: 40, fontWeight: 'bold', color: COLORS.text },
        }, `${outputAmount} USDC`)
      ),
      h('div', {
        style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
      },
        h('div', { style: { fontSize: 18, color: COLORS.textMuted } }, 'Gas saved'),
        h('div', {
          style: { fontSize: 40, fontWeight: 'bold', color: COLORS.primary },
        }, `$${gasSaved}`)
      )
    ),
    (tokenCount || xpAwarded) ? h('div', {
      style: { display: 'flex', gap: 40, color: COLORS.textMuted, fontSize: 20 },
    },
      tokenCount ? h('span', {}, `${tokenCount} tokens consolidated`) : null,
      xpAwarded ? h('span', { style: { color: COLORS.warning } }, `+${xpAwarded} XP`) : null
    ) : null
  );

  const svg = await satori(element, satoriOptions);

  const png = await svgToPng(svg);

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({ type: 'success', durationMs, sizeKb: Math.round(png.length / 1024) }, 'Image generated');

  return png;
}

/**
 * Generate error image
 */
export async function generateErrorImage(errorMessage: string): Promise<Uint8Array> {
  const startTime = performance.now();

  const displayMessage = errorMessage.length > 100 ? errorMessage.slice(0, 97) + '...' : errorMessage;

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.background,
      fontFamily: 'sans-serif',
    },
  },
    h('div', { style: { fontSize: 80, marginBottom: 20 } }, '❌'),
    h('div', {
      style: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.error,
        marginBottom: 30,
      },
    }, 'Something went wrong'),
    h('div', {
      style: {
        fontSize: 24,
        color: COLORS.textMuted,
        textAlign: 'center',
        maxWidth: 800,
        padding: '0 40px',
      },
    }, displayMessage),
    h('div', {
      style: { fontSize: 20, color: COLORS.primary, marginTop: 40 },
    }, 'Please try again')
  );

  const svg = await satori(element, satoriOptions);

  const png = await svgToPng(svg);

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({ type: 'error', durationMs, sizeKb: Math.round(png.length / 1024) }, 'Image generated');

  return png;
}

/**
 * Generate no-dust-found image
 */
export async function generateNoDustImage(wallet?: string): Promise<Uint8Array> {
  const startTime = performance.now();

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.background,
      fontFamily: 'sans-serif',
    },
  },
    h('div', { style: { fontSize: 80, marginBottom: 20 } }, '✨'),
    h('div', {
      style: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.success,
        marginBottom: 30,
      },
    }, 'No Dust Found!'),
    h('div', {
      style: { fontSize: 28, color: COLORS.text, marginBottom: 20 },
    }, 'Your wallet is squeaky clean 🧹'),
    wallet ? h('div', {
      style: { fontSize: 20, color: COLORS.textMuted },
    }, truncateWallet(wallet)) : null,
    h('div', {
      style: { fontSize: 18, color: COLORS.textMuted, marginTop: 40 },
    }, 'Check back later or scan a different wallet')
  );

  const svg = await satori(element, satoriOptions);

  const png = await svgToPng(svg);

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({ type: 'no-dust', durationMs, sizeKb: Math.round(png.length / 1024) }, 'Image generated');

  return png;
}

/**
 * Generate leaderboard image
 */
export async function generateLeaderboardImage(
  entries: LeaderboardEntry[],
  period: 'weekly' | 'all_time'
): Promise<Uint8Array> {
  const startTime = performance.now();

  const displayEntries = entries.slice(0, 10);

  const entryRows = displayEntries.map((entry, index) =>
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '12px 0',
        borderBottom: index < displayEntries.length - 1 ? `1px solid ${COLORS.textMuted}33` : 'none',
      },
    },
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 20 },
      },
        h('div', {
          style: {
            fontSize: 28,
            fontWeight: 'bold',
            color: entry.rank <= 3 ? COLORS.warning : COLORS.textMuted,
            width: 50,
          },
        }, `#${entry.rank}`),
        h('div', {
          style: { fontSize: 24, color: COLORS.text },
        }, truncateWallet(entry.wallet))
      ),
      h('div', {
        style: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
      }, `${entry.xp.toLocaleString()} XP`)
    )
  );

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 40,
      background: COLORS.background,
      fontFamily: 'sans-serif',
    },
  },
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      },
    },
      h('div', {
        style: { fontSize: 40, fontWeight: 'bold', color: COLORS.primary },
      }, '🏆 Leaderboard'),
      h('div', {
        style: {
          fontSize: 20,
          color: COLORS.textMuted,
          padding: '8px 16px',
          background: `${COLORS.primary}22`,
          borderRadius: 8,
        },
      }, period === 'weekly' ? 'This Week' : 'All Time')
    ),
    h('div', {
      style: { display: 'flex', flexDirection: 'column', flex: 1 },
    }, ...entryRows)
  );

  const svg = await satori(element, satoriOptions);

  const png = await svgToPng(svg);

  const durationMs = Math.round(performance.now() - startTime);
  log.debug({
    type: 'leaderboard',
    period,
    entryCount: displayEntries.length,
    durationMs,
    sizeKb: Math.round(png.length / 1024),
  }, 'Image generated');

  return png;
}
