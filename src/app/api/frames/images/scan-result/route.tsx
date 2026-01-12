/**
 * VORTEX PROTOCOL - FRAME IMAGE: SCAN RESULT
 * Dynamic OG image generation for scan results
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const dustCount = searchParams.get('dustCount') || '0';
  const dustValue = searchParams.get('dustValue') || '0';
  const totalTokens = searchParams.get('totalTokens') || '0';
  const address = searchParams.get('address') || '0x...';

  // Truncate address
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
          backgroundImage: 'linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(184,41,255,0.1) 100%)',
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
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f0ff, #b829ff)',
              marginRight: 12,
            }}
          />
          <span
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#e8e8f0',
              letterSpacing: '0.1em',
            }}
          >
            VORTEX
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00f0ff, #b829ff, #ff2d6a)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 16,
          }}
        >
          Dust Tokens Found!
        </h1>

        {/* Wallet Address */}
        <p
          style={{
            fontSize: 20,
            color: '#8888a0',
            marginBottom: 32,
          }}
        >
          Wallet: {shortAddress}
        </p>

        {/* Stats Grid */}
        <div
          style={{
            display: 'flex',
            gap: 48,
            marginBottom: 32,
          }}
        >
          {/* Dust Count */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              backgroundColor: 'rgba(0,240,255,0.1)',
              borderRadius: 16,
              border: '1px solid rgba(0,240,255,0.3)',
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#00f0ff',
              }}
            >
              {dustCount}
            </span>
            <span
              style={{
                fontSize: 18,
                color: '#8888a0',
              }}
            >
              Dust Tokens
            </span>
          </div>

          {/* Dust Value */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              backgroundColor: 'rgba(184,41,255,0.1)',
              borderRadius: 16,
              border: '1px solid rgba(184,41,255,0.3)',
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#b829ff',
              }}
            >
              ${dustValue}
            </span>
            <span
              style={{
                fontSize: 18,
                color: '#8888a0',
              }}
            >
              Recoverable
            </span>
          </div>

          {/* Total Tokens */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              backgroundColor: 'rgba(255,45,106,0.1)',
              borderRadius: 16,
              border: '1px solid rgba(255,45,106,0.3)',
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#ff2d6a',
              }}
            >
              {totalTokens}
            </span>
            <span
              style={{
                fontSize: 18,
                color: '#8888a0',
              }}
            >
              Total Tokens
            </span>
          </div>
        </div>

        {/* CTA */}
        <p
          style={{
            fontSize: 24,
            color: '#00ff88',
          }}
        >
          🧹 Tap to consolidate and save gas!
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
