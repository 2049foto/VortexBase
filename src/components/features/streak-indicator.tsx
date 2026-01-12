/**
 * VORTEX PROTOCOL - STREAK INDICATOR COMPONENT
 */

'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { STREAK_MULTIPLIERS } from '@/lib/constants';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  lastActivityDate,
  size = 'md',
  showDetails = true,
}: StreakIndicatorProps) {
  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: 'legendary', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (streak >= 14) return { level: 'epic', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (streak >= 7) return { level: 'rare', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (streak >= 3) return { level: 'common', color: 'text-green-400', bg: 'bg-green-500/20' };
    return { level: 'none', color: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  const getMultiplier = (streak: number) => {
    if (streak >= 30) return STREAK_MULTIPLIERS.DAY_30 || 2.0;
    if (streak >= 7) return STREAK_MULTIPLIERS.DAY_7 || 1.5;
    if (streak >= 3) return STREAK_MULTIPLIERS.DAY_3 || 1.25;
    return 1.0;
  };

  const streakInfo = getStreakLevel(currentStreak);
  const multiplier = getMultiplier(currentStreak);
  const isActive = currentStreak > 0;

  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-2',
    lg: 'text-lg gap-3',
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  // Check if streak is at risk (last activity was yesterday)
  const isAtRisk = lastActivityDate
    ? new Date().getTime() - new Date(lastActivityDate).getTime() > 24 * 60 * 60 * 1000
    : false;

  return (
    <motion.div
      className={cn(
        'flex items-center rounded-xl p-3',
        streakInfo.bg,
        sizeClasses[size]
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Fire Icon */}
      <motion.div
        className={cn(iconSizes[size])}
        animate={
          isActive
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {isActive ? '🔥' : '💤'}
      </motion.div>

      {/* Streak Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('font-bold', streakInfo.color)}>
            {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
          </span>
          {isAtRisk && (
            <motion.span
              className="text-xs bg-vortex-red/20 text-vortex-red px-2 py-0.5 rounded"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ⚠️ At Risk
            </motion.span>
          )}
        </div>

        {showDetails && (
          <div className="text-xs text-vortex-muted">
            {multiplier > 1 && (
              <span className="text-vortex-cyan mr-2">
                {multiplier}x XP Multiplier
              </span>
            )}
            <span>Best: {longestStreak} days</span>
          </div>
        )}
      </div>

      {/* Multiplier Badge */}
      {multiplier > 1 && (
        <motion.div
          className="px-2 py-1 bg-vortex-cyan/20 rounded-lg text-vortex-cyan font-bold text-sm"
          whileHover={{ scale: 1.1 }}
        >
          {multiplier}x
        </motion.div>
      )}
    </motion.div>
  );
}

// Streak Calendar component
interface StreakCalendarProps {
  activityDates: Date[];
  currentStreak: number;
}

export function StreakCalendar({ activityDates, currentStreak }: StreakCalendarProps) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (29 - i));
    return date;
  });

  const activitySet = new Set(
    activityDates.map((d) => new Date(d).toDateString())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-vortex-muted">Last 30 Days</span>
        <span className="text-sm text-vortex-cyan font-semibold">
          {currentStreak} day streak
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day, i) => {
          const isActive = activitySet.has(day.toDateString());
          const isToday = day.toDateString() === today.toDateString();

          return (
            <motion.div
              key={i}
              className={cn(
                'w-6 h-6 rounded-md transition-colors',
                isActive
                  ? 'bg-vortex-green'
                  : 'bg-vortex-surface',
                isToday && 'ring-2 ring-vortex-cyan ring-offset-2 ring-offset-vortex-dark'
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02 }}
              title={day.toLocaleDateString()}
            />
          );
        })}
      </div>
    </div>
  );
}
