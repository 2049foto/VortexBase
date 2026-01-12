/**
 * VORTEX PROTOCOL - HEADER COMPONENT
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { WalletConnect } from '@/components/features';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-vortex-dark/80 border-b border-vortex-surface">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-vortex-cyan via-vortex-purple to-vortex-pink flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xl">🌀</span>
          </motion.div>
          <span className="font-orbitron font-bold text-xl gradient-text">
            VORTEX
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/quests">Quests</NavLink>
        </nav>

        {/* Wallet */}
        <WalletConnect />
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-vortex-muted hover:text-vortex-cyan transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-vortex-cyan to-vortex-purple transition-all group-hover:w-full" />
    </Link>
  );
}
