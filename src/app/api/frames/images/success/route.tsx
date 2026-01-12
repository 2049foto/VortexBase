/**
 * VORTEX PROTOCOL - FRAME IMAGE: SUCCESS
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokensCount = searchParams.get('tokens') || '0';
  const valueUsd = searchParams.get('value') || '0';
  const gasSaved = searchParams.get('gasSaved') || '0';
  const xpEarned = searchParams.get('xp') || '0';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,255,136,0.2) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,255,136,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            border: '2px solid rgba(0,255,136,0.5)',
          }}
        >
          <span style={{ fontSize: 64 }}>✨</span>
        </div>

        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#00ff88',
            marginBottom: 16,
          }}
        >
          Consolidation Complete!
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 32,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: 'rgba(0,240,255,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(0,240,255,0.3)',
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#00f0ff' }}>
              {tokensCount}
            </span>
            <span style={{ fontSize: 14, color: '#8888a0' }}>Tokens Cleaned</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: 'rgba(0,255,136,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(0,255,136,0.3)',
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#00ff88' }}>
              ${valueUsd}
            </span>
            <span style={{ fontSize: 14, color: '#8888a0' }}>Recovered</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: 'rgba(184,41,255,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(184,41,255,0.3)',
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#b829ff' }}>
              ${gasSaved}
            </span>
            <span style={{ fontSize: 14, color: '#8888a0' }}>Gas Saved</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: 'rgba(255,215,0,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(255,215,0,0.3)',
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#ffd700' }}>
              +{xpEarned}
            </span>
            <span style={{ fontSize: 14, color: '#8888a0' }}>XP Earned</span>
          </div>
        </div>

        <p style={{ fontSize: 20, color: '#8888a0' }}>
          Share your success on Farcaster! 🚀
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
