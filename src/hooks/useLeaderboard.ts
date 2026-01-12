/**
 * VORTEX PROTOCOL - LEADERBOARD HOOK
 * Custom hook for leaderboard data
 */

'use client';

import { useQuery } from '@tanstack/react-query';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    walletAddress: string;
    displayName?: string;
    avatarUrl?: string;
    farcasterFid?: number;
    totalXp: number;
    weeklyXp: number;
  };
}

interface LeaderboardResponse {
  success: boolean;
  data?: {
    entries: LeaderboardEntry[];
    total: number;
    userRank?: number;
  };
  error?: string;
}

export function useLeaderboard(
  period: 'weekly' | 'monthly' | 'all_time' = 'weekly'
) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?period=${period}`);
      const result: LeaderboardResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }

      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    entries: data?.entries ?? [],
    total: data?.total ?? 0,
    userRank: data?.userRank,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
