/**
 * VORTEX PROTOCOL - LEADERBOARD COMPONENT
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { cn, formatNumber, truncateAddress } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard } from '@/hooks';

type Period = 'weekly' | 'monthly' | 'all_time';

interface LeaderboardProps {
  initialPeriod?: Period;
  showHeader?: boolean;
  maxEntries?: number;
}

export function Leaderboard({
  initialPeriod = 'weekly',
  showHeader = true,
  maxEntries = 10,
}: LeaderboardProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const { entries, total, userRank, isLoading, error } = useLeaderboard(period);

  const displayEntries = entries.slice(0, maxEntries);

  const periodLabels: Record<Period, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    all_time: 'All Time',
  };

  return (
    <Card variant="glow" glowColor="purple">
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span> Leaderboard
          </CardTitle>
          <div className="flex gap-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-vortex-red">
            <p>Failed to load leaderboard</p>
            <p className="text-sm text-vortex-muted mt-1">{error}</p>
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="text-center py-8 text-vortex-muted">
            <p>No entries yet</p>
            <p className="text-sm mt-1">Be the first to clean your wallet!</p>
          </div>
        ) : (
          <>
            {/* User Rank Banner */}
            {userRank && (
              <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-vortex-cyan/20 to-vortex-purple/20 border border-vortex-cyan/30">
                <p className="text-sm text-vortex-muted">Your Rank</p>
                <p className="text-2xl font-bold gradient-text">
                  #{userRank} of {total.toLocaleString()}
                </p>
              </div>
            )}

            {/* Prize Pool Banner */}
            {period === 'weekly' && (
              <div className="mb-4 p-3 rounded-lg bg-vortex-surface border border-vortex-purple/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-vortex-muted">Weekly Prize Pool</p>
                    <p className="text-lg font-bold text-vortex-purple">
                      0.15 ETH
                    </p>
                  </div>
                  <Badge variant="purple">Top 3 Winners</Badge>
                </div>
              </div>
            )}

            {/* Leaderboard Entries */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {displayEntries.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.user.id}
                    entry={entry}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Total Participants */}
            <div className="mt-4 text-center text-sm text-vortex-muted">
              {total.toLocaleString()} total participants
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface LeaderboardRowProps {
  entry: {
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
  };
  index: number;
}

function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
  const isTop3 = entry.rank <= 3;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-all',
          isTop3
            ? 'bg-gradient-to-r from-vortex-surface/50 to-transparent border border-vortex-yellow/20'
            : 'bg-vortex-surface/30 hover:bg-vortex-surface/50'
        )}
      >
        {/* Rank */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center font-bold',
            entry.rank === 1 && 'bg-yellow-500/20 text-yellow-500',
            entry.rank === 2 && 'bg-gray-400/20 text-gray-400',
            entry.rank === 3 && 'bg-amber-600/20 text-amber-600',
            entry.rank > 3 && 'bg-vortex-surface text-vortex-muted'
          )}
        >
          {isTop3 ? medals[entry.rank - 1] : `#${entry.rank}`}
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-vortex-surface overflow-hidden">
          {entry.user.avatarUrl ? (
            <Image
              src={entry.user.avatarUrl}
              alt={entry.user.displayName || 'User'}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-vortex-muted">
              {entry.user.displayName?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-vortex-text truncate">
            {entry.user.displayName || truncateAddress(entry.user.walletAddress)}
          </p>
          {entry.user.farcasterFid && (
            <p className="text-xs text-vortex-purple">
              @fid:{entry.user.farcasterFid}
            </p>
          )}
        </div>

        {/* XP */}
        <div className="text-right">
          <p className="font-bold text-vortex-cyan">
            {formatNumber(entry.user.totalXp)} XP
          </p>
          <p className="text-xs text-vortex-muted">
            +{formatNumber(entry.user.weeklyXp)} this week
          </p>
        </div>
      </div>
    </motion.div>
  );
}
