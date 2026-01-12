'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { api, type ScanResult, type DustToken } from '@/lib/api-client';

interface UseScanResult {
  scan: (wallet: string) => Promise<ScanResult | null>;
  scanResult: ScanResult | null;
  dustTokens: DustToken[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useScan(): UseScanResult {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (wallet: string): Promise<ScanResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.scan(wallet);
      setScanResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  return {
    scan,
    scanResult,
    dustTokens: scanResult?.dustTokens || [],
    isLoading,
    error,
    reset,
  };
}

// Hook for cached scan results
export function useCachedScan(wallet: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    wallet ? ['scan', wallet] : null,
    () => api.scan(wallet!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    scanResult: data,
    dustTokens: data?.dustTokens || [],
    isLoading,
    error: error?.message,
    refresh: () => mutate(),
  };
}
