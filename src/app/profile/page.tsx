/**
 * VORTEX PROTOCOL - PROFILE PAGE
 */

'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

import { Header, Footer } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/hooks';
import { formatNumber, formatUSD, truncateAddress } from '@/lib/utils';

export default function ProfilePage() {
  const { address, isConnected, shortAddress } = useWallet();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', address],
    queryFn: async () => {
      const res = await fetch(`/api/user?address=${address}&includeHistory=true`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      return data.data;
    },
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-vortex-dark">
        <Header />
        <main className="flex-1 pt-24 pb-12 flex items-center justify-center">
          <Card variant="glow" className="p-8 text-center max-w-md">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-xl font-bold text-vortex-text mb-2">
              Connect Wallet
            </h2>
            <p className="text-vortex-muted">
              Connect your wallet to view your profile
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-vortex-dark">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          ) : error ? (
            <Card variant="glow" glowColor="pink" className="p-8 text-center">
              <p className="text-vortex-red">Failed to load profile</p>
            </Card>
          ) : data ? (
            <>
              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card variant="glow" glowColor="purple" className="p-6 mb-6">
                  <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-vortex-cyan via-vortex-purple to-vortex-pink p-1">
                      <div className="w-full h-full rounded-full bg-vortex-dark flex items-center justify-center overflow-hidden">
                        {data.user.avatarUrl ? (
                          <Image
                            src={data.user.avatarUrl}
                            alt="Avatar"
                            width={96}
                            height={96}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-3xl">
                            {data.user.displayName?.charAt(0) || '🌀'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-vortex-text">
                        {data.user.displayName || shortAddress}
                      </h1>
                      <p className="text-vortex-muted font-mono text-sm">
                        {data.user.walletAddress}
                      </p>
                      {data.user.farcasterFid && (
                        <Badge variant="purple" className="mt-2">
                          @fid:{data.user.farcasterFid}
                        </Badge>
                      )}
                    </div>

                    {/* XP & Rank */}
                    <div className="text-right">
                      <div className="text-3xl font-bold gradient-text">
                        {formatNumber(data.user.totalXp)} XP
                      </div>
                      <div className="text-vortex-muted text-sm">
                        Rank #{data.ranks.allTime || '-'}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
              >
                <StatCard
                  icon="🔍"
                  label="Total Scans"
                  value={data.user.totalScans}
                />
                <StatCard
                  icon="🧹"
                  label="Consolidations"
                  value={data.user.totalConsolidations}
                />
                <StatCard
                  icon="🪙"
                  label="Tokens Cleaned"
                  value={data.user.totalTokensConsolidated}
                />
                <StatCard
                  icon="💰"
                  label="Value Consolidated"
                  value={formatUSD(parseFloat(data.user.totalValueConsolidatedUsd) || 0)}
                  highlight
                />
                <StatCard
                  icon="⛽"
                  label="Gas Saved"
                  value={formatUSD(parseFloat(data.user.totalGasSavedUsd) || 0)}
                  highlight
                />
                <StatCard
                  icon="🔥"
                  label="Current Streak"
                  value={`${data.user.currentStreak} days`}
                />
                <StatCard
                  icon="🏆"
                  label="Longest Streak"
                  value={`${data.user.longestStreak} days`}
                />
                <StatCard
                  icon="👥"
                  label="Referrals"
                  value={data.user.referralCount}
                />
              </motion.div>

              {/* Referral Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="glow" glowColor="cyan" className="p-6 mb-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2">
                      <span>👥</span> Your Referral Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex gap-3">
                      <div className="flex-1 bg-vortex-surface rounded-lg p-3 font-mono text-sm text-vortex-text">
                        {process.env.NEXT_PUBLIC_APP_URL}?ref={data.user.referralCode}
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${process.env.NEXT_PUBLIC_APP_URL}?ref=${data.user.referralCode}`
                          );
                        }}
                      >
                        📋 Copy
                      </Button>
                    </div>
                    <p className="text-sm text-vortex-muted mt-2">
                      Earn 10% of fees from your referrals forever!
                    </p>
                    {parseFloat(data.user.referralEarningsUsd) > 0 && (
                      <p className="text-sm text-vortex-green mt-1">
                        Total Earnings: {formatUSD(parseFloat(data.user.referralEarningsUsd))}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Rankings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle>Your Rankings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-vortex-surface rounded-lg">
                        <div className="text-2xl font-bold text-vortex-cyan">
                          #{data.ranks.weekly || '-'}
                        </div>
                        <div className="text-xs text-vortex-muted">Weekly</div>
                      </div>
                      <div className="text-center p-4 bg-vortex-surface rounded-lg">
                        <div className="text-2xl font-bold text-vortex-purple">
                          #{data.ranks.monthly || '-'}
                        </div>
                        <div className="text-xs text-vortex-muted">Monthly</div>
                      </div>
                      <div className="text-center p-4 bg-vortex-surface rounded-lg">
                        <div className="text-2xl font-bold text-vortex-pink">
                          #{data.ranks.allTime || '-'}
                        </div>
                        <div className="text-xs text-vortex-muted">All Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="text-xs text-vortex-muted">{label}</div>
          <div
            className={`font-bold ${
              highlight ? 'text-vortex-cyan' : 'text-vortex-text'
            }`}
          >
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}
