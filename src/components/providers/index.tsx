'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { FrameProvider } from './frame-provider';
import { ToastProvider } from './toast-provider';
import { WagmiProvider } from './wagmi-provider';

// Dynamic import for devtools (only in development, client-side only)
let ReactQueryDevtools: React.ComponentType<{ initialIsOpen?: boolean }> | null = null;

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only load devtools in browser and development
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ReactQueryDevtools: Devtools } = require('@tanstack/react-query-devtools');
    ReactQueryDevtools = Devtools;
  } catch {
    // Devtools not available, ignore
  }
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection)
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && 'status' in error) {
                const status = (error as Error & { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider>
        <FrameProvider>
          <ToastProvider>{children}</ToastProvider>
        </FrameProvider>
      </WagmiProvider>
      {ReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
