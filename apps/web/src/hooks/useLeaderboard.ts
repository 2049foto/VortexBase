'use client';

import useSWR from 'swr';
import { api, type LeaderboardEntry } from '@/lib/api-client';

interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  userRank: number | null;
  period: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLeaderboard(
  period: 'daily' | 'weekly' | 'all_time' = 'weekly',
  limit = 100
): UseLeaderboardResult {
  const { data, error, isLoading, mutate } = useSWR(
    ['leaderboard', period, limit],
    () => api.getLeaderboard(period, limit),
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    entries: data?.entries || [],
    userRank: data?.userRank ?? null,
    period: data?.period || period,
    isLoading,
    error: error?.message,
    refresh: () => mutate(),
  };
}
