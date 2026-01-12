'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';

import { FrameProvider } from './frame-provider';
import { ToastProvider } from './toast-provider';
import { WagmiProvider } from './wagmi-provider';

// Devtools component - only loaded in development
const DevtoolsWrapper = () => {
  const [Devtools, setDevtools] = useState<React.ComponentType<{ initialIsOpen?: boolean }> | null>(null);

  useEffect(() => {
    // Only load in development and client-side
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      import('@tanstack/react-query-devtools')
        .then((module) => {
          setDevtools(() => module.ReactQueryDevtools);
        })
        .catch(() => {
          // Devtools not available, ignore
        });
    }
  }, []);

  if (!Devtools || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <Devtools initialIsOpen={false} />;
};

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
      <DevtoolsWrapper />
    </QueryClientProvider>
  );
}
