'use client';

import useSWR from 'swr';
import { api, type XpSummary } from '@/lib/api-client';

interface UseXpResult {
  xpData: XpSummary | null;
  totalXp: number;
  level: number;
  progress: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useXp(): UseXpResult {
  const { data, error, isLoading, mutate } = useSWR(
    'xp',
    () => api.getXp(),
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
    }
  );

  return {
    xpData: data ?? null,
    totalXp: data?.totalXp || 0,
    level: data?.level || 1,
    progress: data?.progressPercent || 0,
    isLoading,
    error: error?.message,
    refresh: () => mutate(),
  };
}
