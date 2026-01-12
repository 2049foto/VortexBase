/**
 * VORTEX PROTOCOL - FRAME IMAGE: HOME
 * Default frame image
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
            linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(184,41,255,0.15) 50%, rgba(255,45,106,0.15) 100%),
            radial-gradient(circle at 20% 80%, rgba(0,240,255,0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(184,41,255,0.2) 0%, transparent 50%)
          `,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f0ff, #b829ff, #ff2d6a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 60px rgba(0,240,255,0.5)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: '#0a0a0f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 32 }}>🌀</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00f0ff 0%, #b829ff 50%, #ff2d6a 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 16,
            letterSpacing: '0.05em',
          }}
        >
          VORTEX
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 32,
            color: '#e8e8f0',
            marginBottom: 48,
            letterSpacing: '0.1em',
          }}
        >
          DUST TOKEN CONSOLIDATION
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginBottom: 48,
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
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontSize: 20, color: '#00f0ff' }}>Gasless</span>
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
            <span style={{ fontSize: 24 }}>🛡️</span>
            <span style={{ fontSize: 20, color: '#b829ff' }}>Secure</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: 'rgba(255,45,106,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(255,45,106,0.3)',
            }}
          >
            <span style={{ fontSize: 24 }}>🏆</span>
            <span style={{ fontSize: 20, color: '#ff2d6a' }}>Earn XP</span>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #00f0ff, #b829ff)',
            borderRadius: 16,
            boxShadow: '0 0 40px rgba(0,240,255,0.4)',
          }}
        >
          <span style={{ fontSize: 24, color: '#0a0a0f', fontWeight: 'bold' }}>
            🔍 Scan Your Wallet
          </span>
        </div>

        {/* Footer */}
        <p
          style={{
            position: 'absolute',
            bottom: 24,
            fontSize: 16,
            color: '#555566',
          }}
        >
          vortexbase.vercel.app • Base Mainnet
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
