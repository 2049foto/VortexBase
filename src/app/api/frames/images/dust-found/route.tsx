/**
 * VORTEX PROTOCOL - FRAME IMAGE: DUST FOUND
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = searchParams.get('count') || '0';
  const value = searchParams.get('value') || '0';
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
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(255,215,0,0.2) 0%, transparent 40%),
            radial-gradient(circle at 30% 70%, rgba(0,240,255,0.1) 0%, transparent 40%)
          `,
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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 48 }}>💫</span>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Dust Found!
          </h1>
        </div>

        <p
          style={{
            fontSize: 20,
            color: '#8888a0',
            marginBottom: 32,
          }}
        >
          Wallet: {shortAddress}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 48,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 40px',
              backgroundColor: 'rgba(255,215,0,0.1)',
              borderRadius: 20,
              border: '2px solid rgba(255,215,0,0.4)',
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffd700',
              }}
            >
              {count}
            </span>
            <span style={{ fontSize: 20, color: '#8888a0' }}>Dust Tokens</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 40px',
              backgroundColor: 'rgba(0,255,136,0.1)',
              borderRadius: 20,
              border: '2px solid rgba(0,255,136,0.4)',
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#00ff88',
              }}
            >
              ${value}
            </span>
            <span style={{ fontSize: 20, color: '#8888a0' }}>Recoverable</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #00f0ff, #b829ff)',
            borderRadius: 16,
            boxShadow: '0 0 40px rgba(0,240,255,0.4)',
          }}
        >
          <span style={{ fontSize: 24 }}>🧹</span>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#0a0a0f' }}>
            Tap to Clean & Consolidate
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
