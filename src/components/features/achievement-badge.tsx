/**
 * VORTEX PROTOCOL - ACHIEVEMENT BADGE COMPONENT
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { cn } from '@/lib/utils';

export interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  xpReward: number;
  badgeUrl?: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  isSecret?: boolean;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

const tierColors = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-gray-400 to-gray-200',
  gold: 'from-yellow-500 to-yellow-300',
  platinum: 'from-cyan-400 to-cyan-200',
  diamond: 'from-blue-400 via-purple-400 to-pink-400',
};

const tierBorders = {
  bronze: 'border-amber-600',
  silver: 'border-gray-400',
  gold: 'border-yellow-400',
  platinum: 'border-cyan-400',
  diamond: 'border-purple-400',
};

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

export function AchievementBadge({
  achievement,
  size = 'md',
  showDetails = false,
  onClick,
}: AchievementBadgeProps) {
  const isLocked = !achievement.isUnlocked;

  return (
    <motion.div
      className={cn(
        'relative cursor-pointer group',
        isLocked && 'opacity-50 grayscale'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Badge Container */}
      <div
        className={cn(
          'relative rounded-full p-1',
          'bg-gradient-to-br',
          tierColors[achievement.tier],
          sizeClasses[size]
        )}
      >
        {/* Inner Circle */}
        <div
          className={cn(
            'w-full h-full rounded-full bg-vortex-dark flex items-center justify-center overflow-hidden border-2',
            tierBorders[achievement.tier]
          )}
        >
          {achievement.badgeUrl ? (
            <Image
              src={achievement.badgeUrl}
              alt={achievement.name}
              width={size === 'sm' ? 32 : size === 'md' ? 48 : 80}
              height={size === 'sm' ? 32 : size === 'md' ? 48 : 80}
              className={cn('object-cover', isLocked && 'blur-sm')}
            />
          ) : (
            <span
              className={cn(
                'text-white',
                size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-4xl'
              )}
            >
              {getCategoryIcon(achievement.category)}
            </span>
          )}

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
              <span className="text-xl">🔒</span>
            </div>
          )}
        </div>

        {/* Shine Effect */}
        {achievement.isUnlocked && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        )}
      </div>

      {/* Details Tooltip */}
      {showDetails && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-vortex-surface border border-vortex-cyan/20 rounded-lg p-3 shadow-xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'text-xs font-bold uppercase',
                  achievement.tier === 'bronze' && 'text-amber-500',
                  achievement.tier === 'silver' && 'text-gray-300',
                  achievement.tier === 'gold' && 'text-yellow-400',
                  achievement.tier === 'platinum' && 'text-cyan-400',
                  achievement.tier === 'diamond' && 'text-purple-400'
                )}
              >
                {achievement.tier}
              </span>
            </div>
            <div className="font-semibold text-vortex-text mb-1">
              {achievement.title}
            </div>
            <div className="text-xs text-vortex-muted mb-2">
              {achievement.isSecret && !achievement.isUnlocked
                ? '???'
                : achievement.description}
            </div>
            <div className="text-xs">
              <span className="text-vortex-cyan font-bold">
                +{achievement.xpReward} XP
              </span>
              {achievement.unlockedAt && (
                <span className="text-vortex-muted ml-2">
                  Unlocked{' '}
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    scanner: '🔍',
    cleaner: '🧹',
    networker: '👥',
    streak: '🔥',
    whale: '🐋',
    pioneer: '🚀',
    social: '📢',
    special: '⭐',
  };
  return icons[category] || '🏆';
}

// Achievement Gallery component
interface AchievementGalleryProps {
  achievements: Achievement[];
  onSelect?: (achievement: Achievement) => void;
}

export function AchievementGallery({
  achievements,
  onSelect,
}: AchievementGalleryProps) {
  // Group by category
  const grouped = achievements.reduce(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-vortex-muted uppercase mb-3 flex items-center gap-2">
            <span>{getCategoryIcon(category)}</span>
            {category}
          </h3>
          <div className="flex flex-wrap gap-3">
            {items.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="md"
                showDetails
                onClick={() => onSelect?.(achievement)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
