import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate wallet address
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format USD value
 */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number;
} {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  const currentXp = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = Math.round((currentXp / xpNeeded) * 100);

  return { level, currentXp, xpForNextLevel: xpNeeded, progress };
}

/**
 * Get risk badge color
 */
export function getRiskColor(classification: string): string {
  switch (classification) {
    case 'safe':
      return 'text-vortex-success';
    case 'medium':
      return 'text-vortex-warning';
    case 'high':
      return 'text-vortex-error';
    default:
      return 'text-vortex-text-muted';
  }
}

/**
 * Get risk badge background
 */
export function getRiskBgColor(classification: string): string {
  switch (classification) {
    case 'safe':
      return 'bg-vortex-success/20';
    case 'medium':
      return 'bg-vortex-warning/20';
    case 'high':
      return 'bg-vortex-error/20';
    default:
      return 'bg-gray-500/20';
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate Basescan URL
 */
export function getBasescanUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  return `https://basescan.org/${type}/${hash}`;
}
