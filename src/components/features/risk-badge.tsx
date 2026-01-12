/**
 * VORTEX PROTOCOL - RISK BADGE COMPONENT
 * Displays risk level with color coding
 */

'use client';

import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/badge';

interface RiskBadgeProps {
  score: number;
  level?: string;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

export function RiskBadge({
  score,
  level,
  size = 'md',
  showScore = false,
  className,
}: RiskBadgeProps) {
  // Determine risk level from score
  const riskLevel = level ?? getRiskLevel(score);
  const { label, variant, icon } = getRiskConfig(riskLevel);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge variant={variant} className={cn(sizeClasses[size], className)}>
      <span className="mr-1">{icon}</span>
      {label}
      {showScore && <span className="ml-1 opacity-70">({score})</span>}
    </Badge>
  );
}

function getRiskLevel(score: number): string {
  if (score <= 20) return 'safe';
  if (score <= 35) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 70) return 'high';
  return 'critical';
}

function getRiskConfig(level: string): {
  label: string;
  variant: BadgeProps['variant'];
  icon: string;
} {
  switch (level) {
    case 'safe':
      return { label: 'Safe', variant: 'success', icon: '✓' };
    case 'low':
      return { label: 'Low Risk', variant: 'default', icon: '🔵' };
    case 'medium':
      return { label: 'Medium', variant: 'warning', icon: '⚠️' };
    case 'high':
      return { label: 'High Risk', variant: 'danger', icon: '🔴' };
    case 'critical':
      return { label: 'Critical', variant: 'danger', icon: '💀' };
    default:
      return { label: 'Unknown', variant: 'secondary', icon: '?' };
  }
}

// Risk Score Progress Bar
interface RiskScoreBarProps {
  score: number;
  className?: string;
}

export function RiskScoreBar({ score, className }: RiskScoreBarProps) {
  const level = getRiskLevel(score);
  const { variant } = getRiskConfig(level);

  const colorClasses = {
    success: 'bg-vortex-green',
    default: 'bg-vortex-cyan',
    warning: 'bg-vortex-yellow',
    danger: 'bg-vortex-red',
    secondary: 'bg-vortex-muted',
    purple: 'bg-vortex-purple',
    pink: 'bg-vortex-pink',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-vortex-muted">Risk Score</span>
        <span className="text-xs font-mono text-vortex-text">{score}/100</span>
      </div>
      <div className="h-2 bg-vortex-surface rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            colorClasses[variant ?? 'secondary']
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
