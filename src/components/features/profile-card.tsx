/**
 * VORTEX PROTOCOL - PROFILE CARD COMPONENT
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatUSD, truncateAddress } from '@/lib/utils';
import { StreakIndicator } from './streak-indicator';

interface ProfileCardProps {
  walletAddress: string;
  displayName?: string;
  avatarUrl?: string;
  farcasterFid?: number;
  totalXp: number;
  rank?: number;
  currentStreak: number;
  longestStreak: number;
  totalConsolidations: number;
  totalGasSaved: number;
  level?: number;
  achievements?: number;
  variant?: 'full' | 'compact' | 'minimal';
  onClick?: () => void;
}

export function ProfileCard({
  walletAddress,
  displayName,
  avatarUrl,
  farcasterFid,
  totalXp,
  rank,
  currentStreak,
  longestStreak,
  totalConsolidations,
  totalGasSaved,
  level = 1,
  achievements = 0,
  variant = 'full',
  onClick,
}: ProfileCardProps) {
  // Calculate level from XP
  const calculatedLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  const xpForCurrentLevel = Math.pow(calculatedLevel - 1, 2) * 100;
  const xpForNextLevel = Math.pow(calculatedLevel, 2) * 100;
  const xpProgress = ((totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  if (variant === 'minimal') {
    return (
      <motion.button
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-vortex-surface/50 transition-colors"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vortex-cyan to-vortex-purple p-0.5">
          <div className="w-full h-full rounded-full bg-vortex-dark flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="object-cover" />
            ) : (
              <span className="text-lg">🌀</span>
            )}
          </div>
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-vortex-text">
            {displayName || truncateAddress(walletAddress)}
          </div>
          <div className="text-xs text-vortex-cyan">
            Lv.{calculatedLevel} · {formatNumber(totalXp)} XP
          </div>
        </div>
      </motion.button>
    );
  }

  if (variant === 'compact') {
    return (
      <Card
        variant="glow"
        glowColor="purple"
        className="p-4 cursor-pointer hover:scale-[1.02] transition-transform"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-vortex-cyan via-vortex-purple to-vortex-pink p-0.5">
            <div className="w-full h-full rounded-full bg-vortex-dark flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={56} height={56} className="object-cover" />
              ) : (
                <span className="text-2xl">🌀</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-vortex-text">
                {displayName || truncateAddress(walletAddress)}
              </span>
              {rank && rank <= 10 && (
                <Badge variant={rank === 1 ? 'warning' : rank <= 3 ? 'purple' : 'secondary'}>
                  #{rank}
                </Badge>
              )}
            </div>
            <div className="text-sm text-vortex-muted">
              Level {calculatedLevel} · {formatNumber(totalXp)} XP
            </div>
          </div>

          {/* Streak */}
          <div className="text-right">
            <div className="text-xl">🔥</div>
            <div className="text-sm font-bold text-vortex-cyan">{currentStreak}</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-3">
          <div className="h-1.5 bg-vortex-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-vortex-cyan to-vortex-purple"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-vortex-muted">
            <span>Lv.{calculatedLevel}</span>
            <span>{formatNumber(xpForNextLevel - totalXp)} XP to Lv.{calculatedLevel + 1}</span>
          </div>
        </div>
      </Card>
    );
  }

  // Full variant
  return (
    <Card variant="glow" glowColor="purple" className="p-6">
      {/* Header */}
      <div className="flex items-center gap-6 mb-6">
        {/* Avatar with level ring */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-vortex-cyan via-vortex-purple to-vortex-pink p-1">
            <div className="w-full h-full rounded-full bg-vortex-dark flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover" />
              ) : (
                <span className="text-4xl">🌀</span>
              )}
            </div>
          </div>
          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-vortex-cyan flex items-center justify-center text-vortex-dark font-bold text-sm">
            {calculatedLevel}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-vortex-text">
              {displayName || truncateAddress(walletAddress)}
            </h2>
            {farcasterFid && (
              <Badge variant="purple">@fid:{farcasterFid}</Badge>
            )}
          </div>
          <p className="text-sm text-vortex-muted font-mono">{walletAddress}</p>

          {/* XP Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-vortex-muted mb-1">
              <span>Level {calculatedLevel}</span>
              <span>{formatNumber(totalXp)} / {formatNumber(xpForNextLevel)} XP</span>
            </div>
            <div className="h-2 bg-vortex-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-vortex-cyan to-vortex-purple"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Rank */}
        {rank && (
          <div className="text-center">
            <div className="text-4xl">
              {rank === 1 ? '👑' : rank <= 3 ? '🏆' : rank <= 10 ? '🎖️' : '📊'}
            </div>
            <div className="text-sm font-bold text-vortex-cyan">#{rank}</div>
            <div className="text-xs text-vortex-muted">Rank</div>
          </div>
        )}
      </div>

      {/* Streak */}
      <StreakIndicator
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        size="md"
        showDetails
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-vortex-surface rounded-lg">
          <div className="text-2xl font-bold text-vortex-text">
            {totalConsolidations}
          </div>
          <div className="text-xs text-vortex-muted">Consolidations</div>
        </div>
        <div className="text-center p-3 bg-vortex-surface rounded-lg">
          <div className="text-2xl font-bold text-vortex-green">
            {formatUSD(totalGasSaved)}
          </div>
          <div className="text-xs text-vortex-muted">Gas Saved</div>
        </div>
        <div className="text-center p-3 bg-vortex-surface rounded-lg">
          <div className="text-2xl font-bold text-vortex-purple">
            {achievements}
          </div>
          <div className="text-xs text-vortex-muted">Achievements</div>
        </div>
      </div>
    </Card>
  );
}
