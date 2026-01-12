/**
 * VORTEX PROTOCOL - REFERRAL SHARE COMPONENT
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatUSD, formatNumber } from '@/lib/utils';
import { createFarcasterShareUrl, createTwitterShareUrl } from '@/lib/frames';

interface ReferralShareProps {
  referralCode: string;
  referralCount: number;
  totalEarnings: number;
  pendingEarnings?: number;
}

export function ReferralShare({
  referralCode,
  referralCount,
  totalEarnings,
  pendingEarnings = 0,
}: ReferralShareProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vortex.finance'}?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `🌀 I'm using Vortex Protocol to clean dust tokens and earn rewards! Join with my code: ${referralCode}\n\n✨ Clean wallet, maximize value!`;

  return (
    <Card variant="glow" glowColor="purple" className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vortex-purple to-vortex-pink flex items-center justify-center text-2xl">
          👥
        </div>
        <div>
          <h3 className="font-bold text-vortex-text text-lg">
            Refer & Earn
          </h3>
          <p className="text-sm text-vortex-muted">
            Earn 10% of fees from your referrals forever
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-vortex-surface rounded-lg">
          <div className="text-2xl font-bold text-vortex-cyan">
            {referralCount}
          </div>
          <div className="text-xs text-vortex-muted">Referrals</div>
        </div>
        <div className="text-center p-3 bg-vortex-surface rounded-lg">
          <div className="text-2xl font-bold text-vortex-green">
            {formatUSD(totalEarnings)}
          </div>
          <div className="text-xs text-vortex-muted">Total Earned</div>
        </div>
        <div className="text-center p-3 bg-vortex-surface rounded-lg">
          <div className="text-2xl font-bold text-vortex-yellow">
            {formatUSD(pendingEarnings)}
          </div>
          <div className="text-xs text-vortex-muted">Pending</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-4">
        <label className="text-xs text-vortex-muted mb-1 block">
          Your Referral Code
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-vortex-surface rounded-lg p-3 font-mono font-bold text-vortex-cyan text-center tracking-wider">
            {referralCode}
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="text-xs text-vortex-muted mb-1 block">
          Your Referral Link
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-vortex-surface rounded-lg p-3 font-mono text-sm text-vortex-text truncate">
            {referralLink}
          </div>
          <Button onClick={handleCopy} className="shrink-0">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  ✓
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  📋
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="space-y-3">
        <p className="text-xs text-vortex-muted">Share on:</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => window.open(createFarcasterShareUrl(shareText), '_blank')}
          >
            <span className="mr-2">🟣</span>
            Farcaster
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => window.open(createTwitterShareUrl(shareText, referralLink), '_blank')}
          >
            <span className="mr-2">𝕏</span>
            Twitter
          </Button>
        </div>
      </div>

      {/* Reward Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-vortex-purple/10 to-vortex-pink/10 rounded-lg border border-vortex-purple/20">
        <h4 className="font-semibold text-vortex-text mb-2">
          🎁 How It Works
        </h4>
        <ul className="text-sm text-vortex-muted space-y-1">
          <li>• Share your referral link with friends</li>
          <li>• They sign up and connect their wallet</li>
          <li>• You earn 10% of protocol fees from their consolidations</li>
          <li>• Rewards are calculated and distributed weekly</li>
        </ul>
      </div>
    </Card>
  );
}

// Mini version for header/sidebar
interface ReferralBadgeProps {
  referralCode: string;
  referralCount: number;
  onClick?: () => void;
}

export function ReferralBadge({
  referralCode,
  referralCount,
  onClick,
}: ReferralBadgeProps) {
  return (
    <motion.button
      className="flex items-center gap-2 px-3 py-2 bg-vortex-purple/20 rounded-lg border border-vortex-purple/30 hover:border-vortex-purple transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>👥</span>
      <span className="text-sm text-vortex-purple font-medium">
        {referralCount} referrals
      </span>
    </motion.button>
  );
}
