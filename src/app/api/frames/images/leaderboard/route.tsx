/**
 * VORTEX PROTOCOL - FRAME IMAGE: LEADERBOARD
 * Dynamic OG image generation for leaderboard
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const period = searchParams.get('period') || 'weekly';
  const total = searchParams.get('total') || '0';
  
  let entries: LeaderboardEntry[] = [];
  try {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      entries = JSON.parse(dataParam);
    }
  } catch {
    entries = [];
  }

  const periodLabel = period === 'weekly' ? 'Weekly' : period === 'monthly' ? 'Monthly' : 'All Time';

  // Medal colors
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#00f0ff', '#b829ff'];

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0f',
          backgroundImage: 'linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(184,41,255,0.05) 100%)',
          padding: 48,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
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
              padding: '8px 16px',
              backgroundColor: 'rgba(0,240,255,0.1)',
              borderRadius: 8,
              border: '1px solid rgba(0,240,255,0.3)',
            }}
          >
            <span style={{ fontSize: 18, color: '#00f0ff' }}>
              {total} Participants
            </span>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#e8e8f0',
            marginBottom: 8,
          }}
        >
          🏆 {periodLabel} Leaderboard
        </h1>
        <p
          style={{
            fontSize: 20,
            color: '#8888a0',
            marginBottom: 32,
          }}
        >
          Top dust cleaners earn 0.15 ETH weekly
        </p>

        {/* Leaderboard Entries */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
          }}
        >
          {entries.length > 0 ? (
            entries.slice(0, 5).map((entry, index) => (
              <div
                key={entry.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 24px',
                  backgroundColor: index === 0 
                    ? 'rgba(255,215,0,0.1)' 
                    : 'rgba(42,42,61,0.5)',
                  borderRadius: 12,
                  border: `1px solid ${index === 0 ? 'rgba(255,215,0,0.3)' : 'rgba(42,42,61,0.8)'}`,
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: medalColors[index] || '#2a2a3d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: index < 3 ? '#0a0a0f' : '#e8e8f0',
                    }}
                  >
                    {entry.rank}
                  </span>
                </div>

                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 24,
                    fontWeight: '600',
                    color: '#e8e8f0',
                  }}
                >
                  {entry.name}
                </span>

                {/* XP */}
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#00f0ff',
                  }}
                >
                  {entry.xp.toLocaleString()} XP
                </span>
              </div>
            ))
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: '#8888a0',
                fontSize: 24,
              }}
            >
              No entries yet. Be the first!
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: 18,
            color: '#555566',
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          vortexbase.vercel.app
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
