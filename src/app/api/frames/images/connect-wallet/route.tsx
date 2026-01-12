/**
 * VORTEX PROTOCOL - FRAME IMAGE: CONNECT WALLET
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
            linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(184,41,255,0.1) 100%),
            radial-gradient(circle at 30% 70%, rgba(0,240,255,0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 30%, rgba(184,41,255,0.15) 0%, transparent 40%)
          `,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00f0ff, #b829ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            boxShadow: '0 0 40px rgba(0,240,255,0.4)',
          }}
        >
          <span style={{ fontSize: 48 }}>🔗</span>
        </div>

        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#e8e8f0',
            marginBottom: 16,
          }}
        >
          Connect Your Wallet
        </h1>

        <p
          style={{
            fontSize: 24,
            color: '#8888a0',
            textAlign: 'center',
            maxWidth: 600,
            marginBottom: 32,
          }}
        >
          To scan for dust tokens and start consolidating, please connect your wallet first.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              backgroundColor: 'rgba(0,240,255,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(0,240,255,0.3)',
            }}
          >
            <span style={{ fontSize: 20 }}>🔍</span>
            <span style={{ fontSize: 16, color: '#00f0ff' }}>Scan Dust</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              backgroundColor: 'rgba(184,41,255,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(184,41,255,0.3)',
            }}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontSize: 16, color: '#b829ff' }}>Gasless</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              backgroundColor: 'rgba(0,255,136,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(0,255,136,0.3)',
            }}
          >
            <span style={{ fontSize: 20 }}>🏆</span>
            <span style={{ fontSize: 16, color: '#00ff88' }}>Earn XP</span>
          </div>
        </div>

        <p
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: '#555566',
          }}
        >
          Tap the button below to connect
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
