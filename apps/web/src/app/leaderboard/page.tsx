'use client';

import { useState } from 'react';
import { Trophy, RefreshCw, Copy, Check } from 'lucide-react';
import { Navbar, TableRowSkeleton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useLeaderboard } from '@/hooks';
import { truncateAddress, formatNumber, formatUsd, copyToClipboard, cn } from '@/lib/utils';

type Period = 'weekly' | 'all_time';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const { entries, userRank, isLoading, error, refresh } = useLeaderboard(period);
  const { user, isAuthenticated } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = async (address: string) => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-vortex-bg pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Trophy size={32} className="text-vortex-warning" />
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setPeriod('weekly')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                period === 'weekly'
                  ? 'bg-vortex-primary text-white'
                  : 'bg-vortex-bg-secondary text-vortex-text-muted hover:text-white'
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('all_time')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                period === 'all_time'
                  ? 'bg-vortex-primary text-white'
                  : 'bg-vortex-bg-secondary text-vortex-text-muted hover:text-white'
              )}
            >
              All-Time
            </button>
          </div>

          {/* User Rank Banner */}
          {isAuthenticated && userRank !== null && (
            <div className="card mb-6 bg-gradient-to-r from-vortex-primary/10 to-vortex-secondary/10 border-vortex-primary/30">
              <div className="flex items-center justify-between">
                <span className="text-vortex-text-muted">Your Rank</span>
                <span className="text-2xl font-bold text-vortex-primary">
                  #{userRank}
                </span>
              </div>
            </div>
          )}

          {isAuthenticated && userRank === null && entries.length > 0 && (
            <div className="card mb-6 bg-vortex-bg-secondary">
              <p className="text-vortex-text-muted text-center">
                You're not in the top 100 yet. Keep consolidating to climb the leaderboard!
              </p>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-vortex-text-muted font-medium">
                      Rank
                    </th>
                    <th className="text-left px-4 py-3 text-vortex-text-muted font-medium">
                      Wallet
                    </th>
                    <th className="text-right px-4 py-3 text-vortex-text-muted font-medium">
                      XP
                    </th>
                    <th className="text-right px-4 py-3 text-vortex-text-muted font-medium hidden sm:table-cell">
                      Gas Saved
                    </th>
                    <th className="text-right px-4 py-3 text-vortex-text-muted font-medium hidden md:table-cell">
                      Consolidations
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={5} />
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-vortex-error">
                        {error}
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-vortex-text-muted">
                        No entries yet. Be the first to consolidate!
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const isCurrentUser = user?.wallet.toLowerCase() === entry.wallet.toLowerCase();
                      return (
                        <tr
                          key={entry.wallet}
                          className={cn(
                            'border-b border-white/5 hover:bg-white/5 transition-colors',
                            isCurrentUser && 'bg-vortex-primary/10'
                          )}
                        >
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'font-bold',
                                entry.rank <= 3 && 'text-xl'
                              )}
                            >
                              {getRankBadge(entry.rank)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(isCurrentUser && 'text-vortex-primary font-medium')}>
                                {truncateAddress(entry.wallet)}
                              </span>
                              <button
                                onClick={() => handleCopy(entry.wallet)}
                                className="p-1 rounded hover:bg-white/10"
                              >
                                {copiedAddress === entry.wallet ? (
                                  <Check size={14} className="text-vortex-success" />
                                ) : (
                                  <Copy size={14} className="text-vortex-text-muted" />
                                )}
                              </button>
                              {isCurrentUser && (
                                <span className="text-xs text-vortex-primary">(You)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-vortex-primary">
                            {formatNumber(entry.xpTotal)}
                          </td>
                          <td className="px-4 py-4 text-right hidden sm:table-cell text-vortex-success">
                            {formatUsd(entry.gasSavedUsd)}
                          </td>
                          <td className="px-4 py-4 text-right hidden md:table-cell">
                            {formatNumber(entry.consolidationsCount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
