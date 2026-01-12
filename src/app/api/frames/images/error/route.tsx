/**
 * VORTEX PROTOCOL - FRAME IMAGE: ERROR
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message') || 'Something went wrong';

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
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,45,106,0.2) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,45,106,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            border: '2px solid rgba(255,45,106,0.5)',
          }}
        >
          <span style={{ fontSize: 64 }}>❌</span>
        </div>

        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ff2d6a',
            marginBottom: 16,
          }}
        >
          Oops!
        </h1>

        <p
          style={{
            fontSize: 24,
            color: '#e8e8f0',
            textAlign: 'center',
            maxWidth: 600,
            marginBottom: 32,
          }}
        >
          {message}
        </p>

        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(255,45,106,0.1)',
            borderRadius: 12,
            border: '1px solid rgba(255,45,106,0.3)',
          }}
        >
          <span style={{ fontSize: 18, color: '#ff2d6a' }}>
            Tap to try again
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
