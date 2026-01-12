import { Metadata } from 'next';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vortex.vercel.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Vortex Protocol - Farcaster Frame',
  description: 'Clean your dust tokens on Base. Gasless consolidation.',
  openGraph: {
    title: 'Vortex Protocol',
    description: 'Clean your dust tokens on Base',
    images: [`${API_URL}/api/frames/images/entry`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${API_URL}/api/frames/images/entry`,
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:post_url': `${API_URL}/api/frames/scan`,
    'fc:frame:button:1': '🔍 Scan Wallet',
    'fc:frame:button:2': '🏆 Leaderboard',
    'fc:frame:button:2:action': 'post',
    'fc:frame:button:2:target': `${API_URL}/api/frames/leaderboard`,
    'fc:frame:input:text': 'Enter wallet address (0x...)',
  },
};

export default function FramesPage() {
  return (
    <div className="min-h-screen bg-vortex-bg flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold gradient-text mb-4">🌀 VORTEX</h1>
        <p className="text-xl text-vortex-text-muted mb-8">
          Clean Your Dust Tokens
        </p>
        <p className="text-vortex-text-muted mb-8">
          This page is designed to be opened as a Farcaster Frame in Warpcast.
        </p>
        <div className="space-y-4">
          <a
            href={`https://warpcast.com/~/compose?embeds[]=${encodeURIComponent(APP_URL + '/frames')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary block"
          >
            Open in Warpcast
          </a>
          <Link href="/" className="btn-secondary block">
            Go to Web App
          </Link>
        </div>
      </div>
    </div>
  );
}
