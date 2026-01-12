import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vortex Protocol - Clean Your Dust Tokens',
  description: 'Consolidate scattered small tokens into USDC in one click. Gasless on Base.',
  openGraph: {
    title: 'Vortex Protocol',
    description: 'Clean Your Dust Tokens - Convert scattered small tokens into USDC',
    type: 'website',
    url: 'https://vortex.vercel.app',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vortex Protocol',
    description: 'Clean Your Dust Tokens - Gasless on Base',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
