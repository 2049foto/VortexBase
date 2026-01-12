'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  Wallet,
  Search,
  AlertTriangle,
  CheckCircle,
  Github,
  Twitter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { formatNumber } from '@/lib/utils';

const stats = [
  { label: 'Consolidations', value: 12500 },
  { label: 'Gas Saved', value: 45000, prefix: '$' },
  { label: 'Active Users', value: 3200 },
];

const problems = [
  {
    icon: AlertTriangle,
    title: 'Dust tokens clutter your portfolio',
    description: 'Small token balances under $10 make your wallet messy and hard to manage.',
  },
  {
    icon: TrendingUp,
    title: 'Swap fees make consolidation costly',
    description: 'Gas fees often exceed the token value, making it uneconomical to swap.',
  },
  {
    icon: Zap,
    title: 'You need a better way',
    description: 'One-click consolidation with sponsored gas, saving you time and money.',
  },
];

const steps = [
  { icon: Wallet, title: 'Connect Wallet', description: 'Link your Base wallet securely' },
  { icon: Search, title: 'Scan for Dust', description: 'We find all tokens under $10' },
  { icon: Shield, title: 'Review Risk', description: 'AI-powered safety scoring' },
  { icon: CheckCircle, title: 'Consolidate & Earn XP', description: 'Convert to USDC, earn rewards' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleConnectSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-vortex-bg">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-vortex-primary/10 via-transparent to-vortex-secondary/10" />
        
        {/* Nav */}
        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🌀</span>
              <span className="font-bold text-2xl gradient-text">VORTEX</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/leaderboard"
                className="text-vortex-text-muted hover:text-white transition-colors"
              >
                Leaderboard
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <WalletConnect onSuccess={handleConnectSuccess} />
              )}
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Clean Your{' '}
              <span className="gradient-text">Dust Tokens</span>
            </h1>
            <p className="text-xl text-vortex-text-muted mb-10">
              Convert scattered small tokens into USDC in one click.
              <br />
              Gasless on Base. Earn XP. Climb the leaderboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
                  Go to Dashboard
                  <ArrowRight size={20} className="ml-2" />
                </Link>
              ) : (
                <WalletConnect onSuccess={handleConnectSuccess} className="w-full sm:w-auto" />
              )}
              <Link
                href="/leaderboard"
                className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="bg-vortex-bg-secondary border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-vortex-primary">
                  {stat.prefix}
                  {formatNumber(stat.value)}
                </div>
                <div className="text-sm text-vortex-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">The Problem</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <div key={problem.title} className="card card-hover text-center">
                <div className="inline-flex p-4 rounded-full bg-vortex-primary/10 mb-4">
                  <Icon size={32} className="text-vortex-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-vortex-text-muted">{problem.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-vortex-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="relative inline-flex mb-4">
                    <div className="p-4 rounded-xl bg-vortex-primary/10 glow">
                      <Icon size={32} className="text-vortex-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-vortex-primary text-vortex-bg text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-vortex-text-muted text-sm">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card text-center py-12 px-8 bg-gradient-to-br from-vortex-bg-secondary to-vortex-bg-tertiary">
          <h2 className="text-3xl font-bold mb-4">Ready to Clean Your Wallet?</h2>
          <p className="text-vortex-text-muted mb-8 max-w-lg mx-auto">
            Join thousands of users who have consolidated their dust tokens and saved on gas fees.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 inline-flex">
              Go to Dashboard
              <ArrowRight size={20} className="ml-2" />
            </Link>
          ) : (
            <WalletConnect onSuccess={handleConnectSuccess} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌀</span>
              <span className="font-bold gradient-text">VORTEX</span>
              <span className="text-vortex-text-muted text-sm ml-2">
                © 2026 Vortex Protocol
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/vortex-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vortex-text-muted hover:text-white transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href="https://twitter.com/vortexprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vortex-text-muted hover:text-white transition-colors"
              >
                <Twitter size={20} />
              </a>
              <span className="text-vortex-text-muted text-sm">
                MIT License
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
