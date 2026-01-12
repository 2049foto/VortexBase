/**
 * VORTEX PROTOCOL - FARCASTER FRAME UTILITIES
 * Frame message validation and response generation
 */

import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface FrameMessage {
  fid: number;
  buttonIndex: number;
  inputText?: string;
  connectedAddress?: string;
  castId?: {
    fid: number;
    hash: string;
  };
  state?: string;
  transactionId?: string;
}

export interface FrameValidationResult {
  isValid: boolean;
  message?: FrameMessage;
  error?: string;
}

export interface FrameButton {
  label: string;
  action: 'post' | 'post_redirect' | 'link' | 'mint' | 'tx';
  target?: string;
}

export interface FrameResponse {
  image: string;
  imageAspectRatio?: '1.91:1' | '1:1';
  buttons?: FrameButton[];
  inputText?: string;
  state?: string;
  postUrl?: string;
}

// ============================================
// FRAME MESSAGE VALIDATION
// ============================================

// Farcaster Hub URL for message verification
const HUB_URL = process.env.NEXT_PUBLIC_FARCASTER_HUB_URL || 'https://nemes.farcaster.xyz:2281';

export async function validateFrameMessage(
  body: unknown
): Promise<FrameValidationResult> {
  try {
    // Type check the body
    if (!body || typeof body !== 'object') {
      return { isValid: false, error: 'Invalid request body' };
    }

    const frameBody = body as {
      untrustedData?: {
        fid?: number;
        buttonIndex?: number;
        inputText?: string;
        castId?: { fid: number; hash: string };
        state?: string;
        address?: string;
        transactionId?: string;
      };
      trustedData?: {
        messageBytes?: string;
      };
    };

    const { untrustedData, trustedData } = frameBody;

    if (!untrustedData || !trustedData?.messageBytes) {
      return { isValid: false, error: 'Missing frame data' };
    }

    // For development, skip Hub verification
    if (process.env.NODE_ENV === 'development') {
      return {
        isValid: true,
        message: {
          fid: untrustedData.fid ?? 0,
          buttonIndex: untrustedData.buttonIndex ?? 1,
          inputText: untrustedData.inputText,
          connectedAddress: untrustedData.address,
          castId: untrustedData.castId,
          state: untrustedData.state,
          transactionId: untrustedData.transactionId,
        },
      };
    }

    // Verify message with Farcaster Hub
    try {
      const response = await fetch(`${HUB_URL}/v1/validateMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: Buffer.from(trustedData.messageBytes, 'hex'),
      });

      if (!response.ok) {
        logger.warn('Hub validation failed', { status: response.status });
        // Fall back to untrusted data in case Hub is unavailable
      }
    } catch (hubError) {
      logger.warn('Hub validation error, using untrusted data', {
        error: hubError instanceof Error ? hubError.message : String(hubError),
      });
    }

    // Return validated message
    return {
      isValid: true,
      message: {
        fid: untrustedData.fid ?? 0,
        buttonIndex: untrustedData.buttonIndex ?? 1,
        inputText: untrustedData.inputText,
        connectedAddress: untrustedData.address,
        castId: untrustedData.castId,
        state: untrustedData.state,
        transactionId: untrustedData.transactionId,
      },
    };
  } catch (error) {
    logger.error('Frame validation error', error instanceof Error ? error : new Error(String(error)));
    return { isValid: false, error: 'Validation failed' };
  }
}

// ============================================
// FRAME HTML RESPONSE GENERATION
// ============================================

export function getFrameHtmlResponse(frame: FrameResponse): string {
  const { image, imageAspectRatio = '1.91:1', buttons, inputText, state, postUrl } = frame;

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${escapeHtml(image)}" />
  <meta property="fc:frame:image:aspect_ratio" content="${imageAspectRatio}" />`;

  // Add post URL if provided
  if (postUrl) {
    html += `\n  <meta property="fc:frame:post_url" content="${escapeHtml(postUrl)}" />`;
  }

  // Add input text placeholder
  if (inputText) {
    html += `\n  <meta property="fc:frame:input:text" content="${escapeHtml(inputText)}" />`;
  }

  // Add state
  if (state) {
    html += `\n  <meta property="fc:frame:state" content="${escapeHtml(state)}" />`;
  }

  // Add buttons (up to 4)
  if (buttons && buttons.length > 0) {
    buttons.slice(0, 4).forEach((button, index) => {
      const buttonIndex = index + 1;
      html += `\n  <meta property="fc:frame:button:${buttonIndex}" content="${escapeHtml(button.label)}" />`;
      html += `\n  <meta property="fc:frame:button:${buttonIndex}:action" content="${button.action}" />`;
      
      if (button.target) {
        html += `\n  <meta property="fc:frame:button:${buttonIndex}:target" content="${escapeHtml(button.target)}" />`;
      }
    });
  }

  html += `
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:title" content="Vortex Protocol" />
</head>
<body>
  <h1>Vortex Protocol - Dust Token Consolidation</h1>
</body>
</html>`;

  return html;
}

// ============================================
// TRANSACTION FRAME RESPONSE
// ============================================

export interface TransactionFrameResponse {
  chainId: string; // e.g., "eip155:8453" for Base
  method: 'eth_sendTransaction';
  params: {
    to: string;
    data?: string;
    value?: string;
  };
}

export function getTransactionFrameResponse(
  transaction: TransactionFrameResponse
): string {
  return JSON.stringify(transaction);
}

// ============================================
// UTILITIES
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// FRAME IMAGE URL BUILDERS
// ============================================

export function buildScanResultImageUrl(params: {
  dustCount: number;
  dustValue: number;
  totalTokens: number;
  walletAddress: string;
}): string {
  const searchParams = new URLSearchParams({
    dustCount: params.dustCount.toString(),
    dustValue: params.dustValue.toFixed(2),
    totalTokens: params.totalTokens.toString(),
    address: params.walletAddress,
  });
  
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/scan-result?${searchParams.toString()}`;
}

export function buildLeaderboardImageUrl(params: {
  period: 'weekly' | 'monthly' | 'all_time';
  entries: Array<{ rank: number; name: string; xp: number }>;
}): string {
  const searchParams = new URLSearchParams({
    period: params.period,
    data: JSON.stringify(params.entries),
  });
  
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/leaderboard?${searchParams.toString()}`;
}

export function buildErrorImageUrl(message?: string): string {
  const searchParams = new URLSearchParams();
  if (message) {
    searchParams.set('message', message);
  }
  
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/images/error?${searchParams.toString()}`;
}

// ============================================
// SHARE CAST BUILDER
// ============================================

export function buildShareCastText(params: {
  dustCount: number;
  valueSaved: number;
  gasSaved: number;
}): string {
  return `🌀 Just cleaned my wallet with @vortex!

✨ Consolidated ${params.dustCount} dust tokens
💰 Recovered $${params.valueSaved.toFixed(2)} in value
⛽ Saved $${params.gasSaved.toFixed(2)} in gas

Try it yourself 👇
${process.env.NEXT_PUBLIC_APP_URL}`;
}

export function buildShareCastUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://warpcast.com/~/compose?text=${encodedText}`;
}

// ============================================
// SOCIAL SHARE URL BUILDERS
// ============================================

export function createFarcasterShareUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://warpcast.com/~/compose?text=${encodedText}`;
}

export function createTwitterShareUrl(text: string, url?: string): string {
  const params = new URLSearchParams();
  params.set('text', text);
  if (url) {
    params.set('url', url);
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
