/**
 * VORTEX PROTOCOL - DASHBOARD PAGE
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TokenList, ScanButton } from '@/components/features';
import { Header, Footer } from '@/components/layout';
import { useWallet, useScan } from '@/hooks';
import { formatUSD, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { isConnected, address, shortAddress } = useWallet();
  const {
    scanResult,
    isLoading,
    error,
    selectedTokens,
    selectedTokensData,
    selectedTotalValue,
    toggleToken,
    selectAllDust,
    clearSelection,
    dustTokens,
    totalDustValue,
  } = useScan();

  const [filter, setFilter] = useState<'all' | 'dust'>('dust');

  return (
    <div className="min-h-screen flex flex-col bg-vortex-dark">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text mb-2">
              Dashboard
            </h1>
            {isConnected && (
              <p className="text-vortex-muted">
                Managing wallet:{' '}
                <span className="font-mono text-vortex-cyan">{shortAddress}</span>
              </p>
            )}
          </motion.div>

          {!isConnected ? (
            /* Connect Wallet Prompt */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <Card variant="glow" glowColor="cyan" className="text-center py-12">
                <div className="text-6xl mb-4">🔗</div>
                <h2 className="text-xl font-bold text-vortex-text mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-vortex-muted mb-6">
                  Connect your wallet to scan for dust tokens
                </p>
                <ScanButton size="lg" />
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <StatCard
                  label="Total Tokens"
                  value={scanResult?.totalTokens ?? 0}
                  icon="📊"
                  isLoading={isLoading}
                />
                <StatCard
                  label="Dust Tokens"
                  value={dustTokens.length}
                  icon="💫"
                  isLoading={isLoading}
                  highlight
                />
                <StatCard
                  label="Dust Value"
                  value={formatUSD(totalDustValue)}
                  icon="💰"
                  isLoading={isLoading}
                  highlight
                />
                <StatCard
                  label="Selected"
                  value={`${selectedTokens.length} (${formatUSD(selectedTotalValue)})`}
                  icon="✅"
                  isLoading={isLoading}
                />
              </motion.div>

              {/* Token List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card variant="glow" glowColor="purple">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Your Tokens</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={filter === 'dust' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('dust')}
                      >
                        Dust Only
                      </Button>
                      <Button
                        variant={filter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                      >
                        All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-vortex-red mb-4">{error}</p>
                        <ScanButton size="default" />
                      </div>
                    ) : !scanResult ? (
                      <div className="text-center py-8">
                        <p className="text-vortex-muted mb-4">
                          Click scan to find dust tokens
                        </p>
                        <ScanButton size="default" />
                      </div>
                    ) : (
                      <TokenList
                        tokens={scanResult.tokens}
                        selectedTokens={selectedTokens}
                        onToggleToken={toggleToken}
                        filter={filter}
                      />
                    )}
                  </CardContent>
                  {scanResult && dustTokens.length > 0 && (
                    <CardFooter className="justify-between">
                      <Button variant="ghost" size="sm" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                      <Button variant="secondary" size="sm" onClick={selectAllDust}>
                        Select All Safe Dust
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>

              {/* Action Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card variant="glow" glowColor="cyan" className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Consolidate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTokens.length === 0 ? (
                      <div className="text-center py-8 text-vortex-muted">
                        <p>Select tokens to consolidate</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-vortex-muted">
                              Tokens Selected
                            </span>
                            <span className="font-semibold text-vortex-text">
                              {selectedTokens.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-vortex-muted">Total Value</span>
                            <span className="font-semibold text-vortex-cyan">
                              {formatUSD(selectedTotalValue)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-vortex-muted">Output Token</span>
                            <Badge>USDC</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-vortex-muted">Protocol Fee</span>
                            <span className="text-vortex-muted">0.8%</span>
                          </div>
                        </div>

                        <hr className="border-vortex-surface" />

                        <div className="p-3 bg-vortex-green/10 rounded-lg border border-vortex-green/30">
                          <div className="flex items-center gap-2 text-vortex-green">
                            <span>⚡</span>
                            <span className="text-sm font-semibold">
                              Gasless Transaction
                            </span>
                          </div>
                          <p className="text-xs text-vortex-muted mt-1">
                            Gas fees sponsored by Vortex Protocol
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={selectedTokens.length === 0}
                    >
                      🧹 Consolidate {selectedTokens.length} Tokens
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  isLoading,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  isLoading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card
      variant="glow"
      glowColor={highlight ? 'cyan' : 'purple'}
      className="p-4"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-xs text-vortex-muted">{label}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <p
              className={`font-bold ${
                highlight ? 'text-vortex-cyan' : 'text-vortex-text'
              }`}
            >
              {value}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
