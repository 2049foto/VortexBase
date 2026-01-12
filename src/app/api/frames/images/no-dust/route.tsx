/**
 * VORTEX PROTOCOL - FRAME IMAGE: NO DUST
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') || '0x...';
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

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
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,255,136,0.15) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f0ff, #b829ff)',
              marginRight: 12,
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#e8e8f0',
              letterSpacing: '0.1em',
            }}
          >
            VORTEX
          </span>
        </div>

        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,255,136,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            border: '2px solid rgba(0,255,136,0.4)',
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
          Wallet is Clean!
        </h1>

        <p
          style={{
            fontSize: 20,
            color: '#8888a0',
            marginBottom: 8,
          }}
        >
          Wallet: {shortAddress}
        </p>

        <p
          style={{
            fontSize: 24,
            color: '#e8e8f0',
            textAlign: 'center',
            maxWidth: 600,
            marginBottom: 40,
          }}
        >
          No dust tokens found in this wallet. Your portfolio is already optimized!
        </p>

        <div
          style={{
            display: 'flex',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: 'rgba(0,240,255,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(0,240,255,0.3)',
            }}
          >
            <span style={{ fontSize: 20 }}>🔄</span>
            <span style={{ fontSize: 18, color: '#00f0ff' }}>Scan Again</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: 'rgba(184,41,255,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(184,41,255,0.3)',
            }}
          >
            <span style={{ fontSize: 20 }}>🏆</span>
            <span style={{ fontSize: 18, color: '#b829ff' }}>Leaderboard</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
