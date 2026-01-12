/**
 * VORTEX PROTOCOL - SCAN HOOK
 * Custom hook for wallet scanning
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { type ScannedToken, type ScanResult } from '@/lib/services/scanner';
import { useWallet } from './useWallet';

interface ScanResponse {
  success: boolean;
  data?: ScanResult;
  error?: string;
}

export function useScan(chainId?: number) {
  const { address, chainId: currentChainId } = useWallet();
  const queryClient = useQueryClient();
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  const targetChainId = chainId ?? currentChainId ?? 8453;

  // Fetch scan results
  const {
    data: scanResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['scan', address, targetChainId],
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(`/api/scan?address=${address}&chainId=${targetChainId}`);
      const data: ScanResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Scan failed');
      }

      return data.data;
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Select/deselect tokens
  const toggleToken = useCallback((tokenAddress: string) => {
    setSelectedTokens((prev) =>
      prev.includes(tokenAddress)
        ? prev.filter((addr) => addr !== tokenAddress)
        : [...prev, tokenAddress]
    );
  }, []);

  const selectAllDust = useCallback(() => {
    if (!scanResult?.tokens) return;

    const dustAddresses = scanResult.tokens
      .filter((t) => t.isDust && (t.riskScore === undefined || t.riskScore <= 50))
      .map((t) => t.address);

    setSelectedTokens(dustAddresses);
  }, [scanResult]);

  const clearSelection = useCallback(() => {
    setSelectedTokens([]);
  }, []);

  // Get selected tokens data
  const selectedTokensData = scanResult?.tokens.filter((t) =>
    selectedTokens.includes(t.address)
  ) ?? [];

  const selectedTotalValue = selectedTokensData.reduce(
    (sum, token) => sum + token.valueUsd,
    0
  );

  return {
    scanResult,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    selectedTokens,
    selectedTokensData,
    selectedTotalValue,
    toggleToken,
    selectAllDust,
    clearSelection,
    dustTokens: scanResult?.tokens.filter((t) => t.isDust) ?? [],
    totalDustValue: scanResult?.dustValueUsd ?? 0,
  };
}
