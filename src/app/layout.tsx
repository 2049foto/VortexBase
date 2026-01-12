import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Orbitron } from 'next/font/google';

import { Providers } from '@/components/providers';
import '@/styles/globals.css';

// Font configurations
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: 'Vortex Protocol | Dust Token Consolidation',
    template: '%s | Vortex Protocol',
  },
  description:
    'Enterprise DeFi infrastructure for consolidating dust tokens into valuable assets. Save gas, earn XP, and clean your wallet.',
  keywords: [
    'DeFi',
    'dust consolidation',
    'token swap',
    'Base',
    'Ethereum',
    'cryptocurrency',
    'wallet cleaner',
    'account abstraction',
    'gasless',
    'Farcaster',
  ],
  authors: [{ name: 'Vortex Protocol', url: 'https://vortexbase.vercel.app' }],
  creator: 'Vortex Protocol',
  publisher: 'Vortex Protocol',
  
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://vortexbase.vercel.app'
  ),
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vortexbase.vercel.app',
    siteName: 'Vortex Protocol',
    title: 'Vortex Protocol | Dust Token Consolidation',
    description:
      'Transform worthless dust tokens into valuable assets. Gasless swaps powered by Account Abstraction.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vortex Protocol - Dust Token Consolidation',
      },
    ],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Vortex Protocol | Dust Token Consolidation',
    description:
      'Transform worthless dust tokens into valuable assets. Gasless swaps powered by Account Abstraction.',
    images: ['/og-image.png'],
    creator: '@vortexprotocol',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  manifest: '/manifest.json',
  
  // Farcaster Frame metadata
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://vortexbase.vercel.app/frames/home.png',
    'fc:frame:button:1': 'Scan Wallet',
    'fc:frame:button:1:action': 'post',
    'fc:frame:button:1:target': 'https://vortexbase.vercel.app/api/frames/scan',
    'fc:frame:button:2': 'Leaderboard',
    'fc:frame:button:2:action': 'post',
    'fc:frame:button:2:target': 'https://vortexbase.vercel.app/api/frames/leaderboard',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${orbitron.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-vortex-bg antialiased">
        <Providers>
          {/* Background effects */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Gradient orbs */}
            <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-vortex-primary/5 blur-[120px]" />
            <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-vortex-secondary/5 blur-[120px]" />
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vortex-accent/3 blur-[100px]" />
            
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
          
          {/* Main content */}
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
