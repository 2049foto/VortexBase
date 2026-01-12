'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  LogOut,
  ExternalLink,
  Flame,
  Trophy,
  Zap,
  DollarSign,
  Share2,
  Search,
  Award,
} from 'lucide-react';
import { Navbar, AuthGuard } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useXp } from '@/hooks';
import {
  truncateAddress,
  formatNumber,
  formatUsd,
  formatRelativeTime,
  copyToClipboard,
  getBasescanUrl,
  cn,
} from '@/lib/utils';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const { totalXp, level, progress } = useXp();
  const [copied, setCopied] = useState<'wallet' | 'referral' | null>(null);

  const handleCopy = async (text: string, type: 'wallet' | 'referral') => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleShareReferral = () => {
    const text = `Join me on Vortex Protocol! Clean your dust tokens and earn XP. Use my code: ${user?.referral.code}`;
    const url = `https://vortex.vercel.app?ref=${user?.referral.code}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Vortex Protocol', text, url });
    } else {
      window.open(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`,
        '_blank'
      );
    }
  };

  // Mock recent activity
  const recentActivity = [
    { type: 'scan', label: 'Wallet Scan', xp: 50, date: new Date(Date.now() - 1000 * 60 * 30) },
    { type: 'consolidate', label: 'Consolidation', xp: 150, txHash: '0x1234...abcd', date: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { type: 'quest', label: 'Quest Claimed', xp: 25, date: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ];

  // Mock achievements
  const achievements = [
    { id: '1', name: 'First Scan', emoji: '🔍', earned: true },
    { id: '2', name: 'Dust Buster', emoji: '🧹', earned: true },
    { id: '3', name: 'Level 5', emoji: '⭐', earned: level >= 5 },
    { id: '4', name: '10 Consolidations', emoji: '🎯', earned: (user?.stats.totalConsolidations || 0) >= 10 },
    { id: '5', name: 'Streak Master', emoji: '🔥', earned: false },
  ];

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-vortex-bg pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-vortex-primary to-vortex-secondary flex items-center justify-center text-3xl">
                🌀
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-lg">{truncateAddress(user.wallet, 6)}</span>
                  <button
                    onClick={() => handleCopy(user.wallet, 'wallet')}
                    className="p-1 rounded hover:bg-white/10"
                  >
                    {copied === 'wallet' ? (
                      <Check size={16} className="text-vortex-success" />
                    ) : (
                      <Copy size={16} className="text-vortex-text-muted" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="px-3 py-1 rounded-lg bg-vortex-primary/20 text-vortex-primary font-medium">
                    Level {level}
                  </span>
                  <span className="text-vortex-text-muted">
                    {formatNumber(totalXp)} XP
                  </span>
                  <span className="flex items-center gap-1 text-vortex-warning">
                    <Flame size={16} />
                    5 day streak
                  </span>
                </div>

                {/* XP Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-vortex-text-muted">Level {level}</span>
                    <span className="text-vortex-text-muted">Level {level + 1}</span>
                  </div>
                  <div className="h-2 bg-vortex-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-vortex-primary to-vortex-secondary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="card text-center">
              <Search size={24} className="text-vortex-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{user.stats.totalScans}</div>
              <div className="text-sm text-vortex-text-muted">Scans</div>
            </div>
            <div className="card text-center">
              <Zap size={24} className="text-vortex-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{user.stats.totalConsolidations}</div>
              <div className="text-sm text-vortex-text-muted">Consolidations</div>
            </div>
            <div className="card text-center">
              <DollarSign size={24} className="text-vortex-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatUsd(user.stats.gasSavedUsd)}</div>
              <div className="text-sm text-vortex-text-muted">Gas Saved</div>
            </div>
            <div className="card text-center">
              <Trophy size={24} className="text-vortex-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">#{user.ranks.weekly || '-'}</div>
              <div className="text-sm text-vortex-text-muted">Weekly Rank</div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award size={20} className="text-vortex-warning" />
                Achievements
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    'px-4 py-2 rounded-lg flex items-center gap-2',
                    achievement.earned
                      ? 'bg-vortex-primary/10 border border-vortex-primary/30'
                      : 'bg-vortex-bg-tertiary opacity-50'
                  )}
                  title={achievement.name}
                >
                  <span className="text-xl">{achievement.emoji}</span>
                  <span className="text-sm font-medium">{achievement.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Section */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Share2 size={20} className="text-vortex-primary" />
              Referral Program
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-vortex-bg rounded-lg">
                <div>
                  <span className="text-vortex-text-muted text-sm">Your Code</span>
                  <div className="font-mono font-bold text-lg">{user.referral.code}</div>
                </div>
                <button
                  onClick={() => handleCopy(user.referral.code, 'referral')}
                  className="btn-secondary flex items-center gap-2"
                >
                  {copied === 'referral' ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                  Copy
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-vortex-bg rounded-lg">
                  <span className="text-vortex-text-muted text-sm">Referrals</span>
                  <div className="font-bold text-xl">{user.referral.count}</div>
                </div>
                <div className="p-4 bg-vortex-bg rounded-lg">
                  <span className="text-vortex-text-muted text-sm">Earned</span>
                  <div className="font-bold text-xl text-vortex-success">
                    {formatUsd(user.referral.earned)}
                  </div>
                </div>
              </div>

              <button onClick={handleShareReferral} className="btn-primary w-full flex items-center justify-center gap-2">
                <Share2 size={18} />
                Share on Farcaster
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-vortex-bg rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        activity.type === 'scan' && 'bg-vortex-primary/20',
                        activity.type === 'consolidate' && 'bg-vortex-success/20',
                        activity.type === 'quest' && 'bg-vortex-warning/20'
                      )}
                    >
                      {activity.type === 'scan' && <Search size={14} className="text-vortex-primary" />}
                      {activity.type === 'consolidate' && <Zap size={14} className="text-vortex-success" />}
                      {activity.type === 'quest' && <Award size={14} className="text-vortex-warning" />}
                    </div>
                    <div>
                      <span className="font-medium">{activity.label}</span>
                      <span className="text-sm text-vortex-text-muted ml-2">
                        +{activity.xp} XP
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-vortex-text-muted">
                      {formatRelativeTime(activity.date)}
                    </span>
                    {activity.txHash && (
                      <a
                        href={getBasescanUrl(activity.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vortex-primary hover:underline"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-vortex-error border-vortex-error/50 hover:bg-vortex-error/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </main>
    </>
  );
}
