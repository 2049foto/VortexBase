/**
 * VORTEX PROTOCOL - QUESTS PAGE
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import { Header, Footer } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/hooks';
import { formatNumber } from '@/lib/utils';

type QuestFilter = 'all' | 'daily' | 'weekly' | 'oneTime';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  targetValue: number;
  isRecurring: boolean;
  recurringPeriod?: string;
  iconUrl?: string;
  userStatus: string;
  userProgress: number;
  targetProgress: number;
}

export default function QuestsPage() {
  const { address } = useWallet();
  const [filter, setFilter] = useState<QuestFilter>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['quests', address],
    queryFn: async () => {
      const url = address
        ? `/api/quests?address=${address}`
        : '/api/quests';
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      return data.data as { quests: Quest[]; grouped: Record<string, Quest[]> };
    },
  });

  const getFilteredQuests = () => {
    if (!data) return [];
    switch (filter) {
      case 'daily':
        return data.grouped.daily || [];
      case 'weekly':
        return data.grouped.weekly || [];
      case 'oneTime':
        return data.grouped.oneTime || [];
      default:
        return data.quests;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scan':
        return '🔍';
      case 'consolidate':
        return '🧹';
      case 'refer':
        return '👥';
      case 'streak':
        return '🔥';
      case 'volume':
        return '💰';
      case 'social':
        return '📢';
      default:
        return '⭐';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vortex-dark">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text mb-2">
              Quests
            </h1>
            <p className="text-vortex-muted">
              Complete quests to earn XP and climb the leaderboard
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
          >
            {[
              { key: 'all', label: 'All Quests' },
              { key: 'daily', label: '📅 Daily' },
              { key: 'weekly', label: '📆 Weekly' },
              { key: 'oneTime', label: '🎯 One-Time' },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setFilter(tab.key as QuestFilter)}
              >
                {tab.label}
              </Button>
            ))}
          </motion.div>

          {/* Quests List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : error ? (
            <Card variant="glow" glowColor="pink" className="p-8 text-center">
              <p className="text-vortex-red mb-4">Failed to load quests</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {getFilteredQuests().map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card
                      variant="glow"
                      glowColor={quest.userStatus === 'completed' ? 'green' : 'cyan'}
                      className="p-5"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-xl bg-vortex-surface flex items-center justify-center text-2xl">
                          {getTypeIcon(quest.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-vortex-text">
                              {quest.title}
                            </h3>
                            <Badge variant={getDifficultyColor(quest.difficulty) as 'success' | 'warning' | 'danger'}>
                              {quest.difficulty}
                            </Badge>
                            {quest.isRecurring && (
                              <Badge variant="purple">
                                {quest.recurringPeriod}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-vortex-muted mb-3">
                            {quest.description}
                          </p>

                          {/* Progress Bar */}
                          <div className="relative">
                            <div className="h-2 bg-vortex-surface rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${
                                  quest.userStatus === 'completed'
                                    ? 'bg-vortex-green'
                                    : 'bg-gradient-to-r from-vortex-cyan to-vortex-purple'
                                }`}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(quest.userProgress / quest.targetProgress) * 100}%`,
                                }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-vortex-muted">
                              <span>
                                {quest.userProgress} / {quest.targetProgress}
                              </span>
                              <span>
                                {Math.round((quest.userProgress / quest.targetProgress) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reward */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-vortex-cyan">
                            +{formatNumber(quest.xpReward)}
                          </div>
                          <div className="text-xs text-vortex-muted">XP</div>
                          {quest.userStatus === 'completed' && (
                            <Badge variant="success" className="mt-2">
                              ✓ Done
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {getFilteredQuests().length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-vortex-muted">No quests in this category</p>
                  </Card>
                )}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
