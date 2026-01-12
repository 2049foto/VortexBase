/**
 * VORTEX PROTOCOL - QUEST CARD COMPONENT
 */

'use client';

import { motion } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  userProgress: number;
  targetProgress: number;
  status: 'available' | 'in_progress' | 'completed' | 'claimed';
  isRecurring: boolean;
  recurringPeriod?: 'daily' | 'weekly';
  expiresAt?: Date;
}

interface QuestCardProps {
  quest: Quest;
  onStart?: () => void;
  onClaim?: () => void;
}

export function QuestCard({ quest, onStart, onClaim }: QuestCardProps) {
  const progressPercent = (quest.userProgress / quest.targetProgress) * 100;

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      scan: '🔍',
      consolidate: '🧹',
      refer: '👥',
      streak: '🔥',
      volume: '💰',
      social: '📢',
      first_time: '🎉',
    };
    return icons[type] || '⭐';
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

  return (
    <Card
      variant="glow"
      glowColor={quest.status === 'completed' ? 'green' : 'cyan'}
      className="p-5 transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-xl bg-vortex-surface flex items-center justify-center text-2xl"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {getTypeIcon(quest.type)}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-vortex-text">{quest.title}</h3>
            <Badge variant={getDifficultyColor(quest.difficulty) as 'success' | 'warning' | 'danger'}>
              {quest.difficulty}
            </Badge>
            {quest.isRecurring && (
              <Badge variant="purple">{quest.recurringPeriod}</Badge>
            )}
          </div>

          <p className="text-sm text-vortex-muted mb-3">{quest.description}</p>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2.5 bg-vortex-surface rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  quest.status === 'completed'
                    ? 'bg-vortex-green'
                    : 'bg-gradient-to-r from-vortex-cyan to-vortex-purple'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-vortex-muted">
              <span>
                {quest.userProgress} / {quest.targetProgress}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Reward & Action */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-lg font-bold text-vortex-cyan">
              +{formatNumber(quest.xpReward)}
            </div>
            <div className="text-xs text-vortex-muted">XP</div>
          </div>

          {quest.status === 'available' && onStart && (
            <Button size="sm" onClick={onStart}>
              Start
            </Button>
          )}

          {quest.status === 'completed' && onClaim && (
            <Button size="sm" variant="success" onClick={onClaim}>
              Claim
            </Button>
          )}

          {quest.status === 'claimed' && (
            <Badge variant="success">✓ Claimed</Badge>
          )}
        </div>
      </div>

      {/* Expiry Timer */}
      {quest.expiresAt && quest.status !== 'claimed' && (
        <div className="mt-3 pt-3 border-t border-vortex-surface text-xs text-vortex-muted flex items-center gap-1">
          <span>⏰</span>
          <span>
            Expires:{' '}
            {new Date(quest.expiresAt).toLocaleDateString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
    </Card>
  );
}
