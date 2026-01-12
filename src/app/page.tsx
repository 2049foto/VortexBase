'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Coins, 
  Sparkles, 
  ArrowRight, 
  Wallet,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Stats data
const stats = [
  { label: 'Gas Saved', value: '$50K+', icon: TrendingUp },
  { label: 'Users', value: '5,000+', icon: Users },
  { label: 'Chains', value: '10+', icon: Zap },
  { label: 'Uptime', value: '99.9%', icon: Clock },
];

// Features data
const features = [
  {
    icon: Zap,
    title: 'Gasless Swaps',
    description:
      'No ETH needed. Our Account Abstraction infrastructure sponsors your gas fees.',
    gradient: 'from-vortex-primary to-cyan-400',
  },
  {
    icon: Shield,
    title: '12-Layer Security',
    description:
      'Advanced risk scoring prevents you from consolidating scam or honeypot tokens.',
    gradient: 'from-vortex-secondary to-purple-400',
  },
  {
    icon: Coins,
    title: 'Best Rates',
    description:
      'Multi-DEX aggregation finds the optimal route across Uniswap, Curve, and more.',
    gradient: 'from-vortex-accent to-pink-400',
  },
  {
    icon: Sparkles,
    title: 'Earn XP & Rewards',
    description:
      'Gamified experience with streaks, leaderboards, and weekly ETH prizes.',
    gradient: 'from-vortex-success to-emerald-400',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-vortex-border/50 bg-vortex-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 animate-spin-slow rounded-full bg-gradient-to-r from-vortex-primary via-vortex-secondary to-vortex-accent" />
              <div className="absolute inset-1 rounded-full bg-vortex-bg" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-vortex-primary to-vortex-secondary" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider">
              VORTEX
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className="hidden text-sm text-vortex-text-muted transition-colors hover:text-vortex-text sm:block"
            >
              Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className="btn-vortex btn-primary h-10 px-4 text-xs"
            >
              <Wallet className="h-4 w-4" />
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-4 pt-16">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Rotating ring */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-vortex-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-vortex-secondary/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-vortex-primary/30 bg-vortex-primary/10 px-4 py-1.5 text-xs font-medium text-vortex-primary">
              <Sparkles className="h-3 w-3" />
              Phase 1 Live on Base Mainnet
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="mb-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Transform Your{' '}
            <span className="text-gradient">Dust Tokens</span>
            <br />
            Into Real Value
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-8 max-w-2xl text-lg text-vortex-text-muted sm:text-xl"
          >
            Enterprise-grade DeFi infrastructure for consolidating worthless
            dust tokens into valuable assets.{' '}
            <span className="text-vortex-primary">Gasless. Secure. Instant.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="btn-vortex btn-primary group h-14 w-full px-8 text-sm sm:w-auto"
            >
              Start Scanning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/learn"
              className="btn-vortex btn-secondary h-14 w-full px-8 text-sm sm:w-auto"
            >
              How It Works
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-vortex-text-dim"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-vortex-success" />
              <span className="text-xs">Audited by Immunefi</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-vortex-warning" />
              <span className="text-xs">Powered by Pimlico</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-vortex-primary" />
              <span className="text-xs">0.8% Protocol Fee</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-vortex-border bg-vortex-bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-vortex-primary" />
                <div className="font-display text-2xl font-bold text-vortex-text sm:text-3xl">
                  {stat.value}
                </div>
                <div className="text-sm text-vortex-text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold sm:text-4xl">
              Why Choose <span className="text-gradient">Vortex</span>?
            </h2>
            <p className="mx-auto max-w-2xl text-vortex-text-muted">
              Built by DeFi veterans from Uniswap, Aave, and ZeroDev. We&apos;ve
              processed millions in volume and know what it takes to build
              reliable infrastructure.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-vortex group relative overflow-hidden p-6"
              >
                {/* Gradient background on hover */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-5',
                    `bg-gradient-to-br ${feature.gradient}`
                  )}
                />

                <div className="relative z-10">
                  <div
                    className={cn(
                      'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br',
                      feature.gradient
                    )}
                  >
                    <feature.icon className="h-6 w-6 text-vortex-bg" />
                  </div>

                  <h3 className="mb-2 font-display text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-vortex-text-muted">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-vortex-border bg-gradient-to-br from-vortex-bg-secondary to-vortex-bg-tertiary p-8 text-center sm:p-12"
          >
            {/* Background effects */}
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-vortex-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-vortex-secondary/10 blur-3xl" />

            <div className="relative z-10">
              <h2 className="mb-4 font-display text-3xl font-bold sm:text-4xl">
                Ready to Clean Your Wallet?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-vortex-text-muted">
                Join thousands of users who have already consolidated their dust
                tokens and saved on gas fees.
              </p>
              <Link
                href="/dashboard"
                className="btn-vortex btn-primary inline-flex h-14 px-8 text-sm"
              >
                <Wallet className="h-5 w-5" />
                Connect Wallet & Scan
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vortex-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-vortex-primary to-vortex-secondary" />
                <div className="absolute inset-0.5 rounded-full bg-vortex-bg" />
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-vortex-primary to-vortex-secondary" />
              </div>
              <span className="font-display text-sm font-semibold">
                VORTEX PROTOCOL
              </span>
            </div>

            <div className="flex gap-6 text-sm text-vortex-text-muted">
              <a href="https://github.com/2049foto/Vortex-" className="hover:text-vortex-text">
                GitHub
              </a>
              <a href="https://twitter.com/vortexprotocol" className="hover:text-vortex-text">
                Twitter
              </a>
              <a href="https://warpcast.com/vortex" className="hover:text-vortex-text">
                Farcaster
              </a>
              <a href="/docs" className="hover:text-vortex-text">
                Docs
              </a>
            </div>

            <p className="text-xs text-vortex-text-dim">
              © 2026 Vortex Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
