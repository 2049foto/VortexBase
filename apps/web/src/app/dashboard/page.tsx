'use client';

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Navbar, AuthGuard } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useScan, useQuests, useXp } from '@/hooks';
import { formatUsd, formatNumber, truncateAddress, getRiskColor, getRiskBgColor, cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { scan, scanResult, dustTokens, isLoading: isScanning, error: scanError, reset } = useScan();
  const { dailyQuests } = useQuests();
  const { totalXp, level, progress } = useXp();
  const [showScanResults, setShowScanResults] = useState(false);

  const handleScan = async () => {
    if (!user?.wallet) return;
    reset();
    const result = await scan(user.wallet);
    if (result) {
      setShowScanResults(true);
    }
  };

  const stats = [
    {
      label: 'Total Scans',
      value: user?.stats.totalScans || 0,
      icon: Search,
      color: 'text-vortex-primary',
    },
    {
      label: 'Consolidations',
      value: user?.stats.totalConsolidations || 0,
      icon: Zap,
      color: 'text-vortex-success',
    },
    {
      label: 'Gas Saved',
      value: formatUsd(user?.stats.gasSavedUsd || 0),
      icon: DollarSign,
      color: 'text-vortex-warning',
    },
    {
      label: 'Level',
      value: level,
      icon: TrendingUp,
      color: 'text-vortex-secondary',
      extra: `${formatNumber(totalXp)} XP`,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-vortex-bg pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-vortex-text-muted mt-1">
              Welcome back, {truncateAddress(user?.wallet || '')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon size={20} className={stat.color} />
                    <span className="text-sm text-vortex-text-muted">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.extra && (
                    <div className="text-sm text-vortex-text-muted mt-1">{stat.extra}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* XP Progress */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Level {level} Progress</span>
              <span className="text-sm text-vortex-text-muted">{progress}%</span>
            </div>
            <div className="h-3 bg-vortex-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-vortex-primary to-vortex-secondary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Scan Section */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Scan Your Wallet</h2>
              {scanResult && (
                <button
                  onClick={() => setShowScanResults(!showScanResults)}
                  className="text-sm text-vortex-primary hover:underline"
                >
                  {showScanResults ? 'Hide Results' : 'Show Results'}
                </button>
              )}
            </div>

            <button
              onClick={handleScan}
              disabled={isScanning}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Scan Wallet Now
                </>
              )}
            </button>

            {scanError && (
              <p className="text-vortex-error text-sm mt-4">{scanError}</p>
            )}

            {showScanResults && scanResult && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-vortex-bg rounded-lg">
                  <span className="text-vortex-text-muted">Dust tokens found</span>
                  <span className="font-semibold">{scanResult.dustCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-vortex-bg rounded-lg">
                  <span className="text-vortex-text-muted">Total value</span>
                  <span className="font-semibold text-vortex-success">
                    {formatUsd(scanResult.dustValueUsd)}
                  </span>
                </div>

                {dustTokens.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Tokens Found:</h3>
                    {dustTokens.slice(0, 5).map((token) => (
                      <div
                        key={token.address}
                        className="flex items-center justify-between p-3 bg-vortex-bg rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getRiskBgColor(token.riskClassification),
                              getRiskColor(token.riskClassification)
                            )}
                          >
                            {token.riskClassification.toUpperCase()}
                          </span>
                          <span className="font-medium">{token.symbol}</span>
                        </div>
                        <span>{formatUsd(token.valueUsd)}</span>
                      </div>
                    ))}
                    {dustTokens.length > 5 && (
                      <p className="text-sm text-vortex-text-muted text-center">
                        +{dustTokens.length - 5} more tokens
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Link href="/quests" className="card card-hover group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Daily Quests</h3>
                  <p className="text-sm text-vortex-text-muted">
                    {dailyQuests.filter((q: { completed: boolean; claimed: boolean }) => q.completed && !q.claimed).length} ready to claim
                  </p>
                </div>
                <ArrowRight
                  size={20}
                  className="text-vortex-text-muted group-hover:text-vortex-primary transition-colors"
                />
              </div>
            </Link>

            <Link href="/leaderboard" className="card card-hover group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Leaderboard</h3>
                  <p className="text-sm text-vortex-text-muted">
                    {user?.ranks.weekly ? `Rank #${user.ranks.weekly}` : 'View rankings'}
                  </p>
                </div>
                <ArrowRight
                  size={20}
                  className="text-vortex-text-muted group-hover:text-vortex-primary transition-colors"
                />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
