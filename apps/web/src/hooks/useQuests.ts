'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { api, type Quest } from '@/lib/api-client';

interface UseQuestsResult {
  quests: Quest[];
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  isLoading: boolean;
  error: string | null;
  claimQuest: (questId: string) => Promise<{ xpAwarded: number } | null>;
  isClaiming: boolean;
  refresh: () => void;
}

export function useQuests(): UseQuestsResult {
  const [isClaiming, setIsClaiming] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    'quests',
    () => api.getQuests(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );

  const quests = data?.quests || [];
  const dailyQuests = quests.filter((q) => q.type === 'daily');
  const weeklyQuests = quests.filter((q) => q.type === 'weekly');

  const claimQuest = useCallback(
    async (questId: string): Promise<{ xpAwarded: number } | null> => {
      setIsClaiming(true);

      try {
        const result = await api.claimQuest(questId);
        // Refresh quest list
        mutate();
        return result;
      } catch (err) {
        console.error('Failed to claim quest:', err);
        return null;
      } finally {
        setIsClaiming(false);
      }
    },
    [mutate]
  );

  return {
    quests,
    dailyQuests,
    weeklyQuests,
    isLoading,
    error: error?.message,
    claimQuest,
    isClaiming,
    refresh: () => mutate(),
  };
}
