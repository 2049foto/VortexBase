/**
 * VORTEX PROTOCOL - LEADERBOARD PAGE
 */

'use client';

import { motion } from 'framer-motion';

import { Header, Footer } from '@/components/layout';
import { Leaderboard } from '@/components/features';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-vortex-dark">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text mb-2">
              Leaderboard
            </h1>
            <p className="text-vortex-muted">
              Compete with other dust cleaners and win weekly prizes
            </p>
          </motion.div>

          {/* Prize Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 rounded-xl bg-gradient-to-r from-vortex-cyan/10 via-vortex-purple/10 to-vortex-pink/10 border border-vortex-purple/30"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-vortex-text mb-1">
                  Weekly Prize Pool
                </h2>
                <p className="text-sm text-vortex-muted">
                  Top 3 players share the weekly prize pool
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold font-mono gradient-text">
                  0.15 ETH
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs text-vortex-muted">🥇 0.08 ETH</span>
                  <span className="text-xs text-vortex-muted">🥈 0.05 ETH</span>
                  <span className="text-xs text-vortex-muted">🥉 0.02 ETH</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Leaderboard maxEntries={25} />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
