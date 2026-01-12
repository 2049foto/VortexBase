/**
 * VORTEX PROTOCOL - FOOTER COMPONENT
 */

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-vortex-surface bg-vortex-dark/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌀</span>
              <span className="font-orbitron font-bold text-xl gradient-text">
                VORTEX
              </span>
            </div>
            <p className="text-sm text-vortex-muted">
              Enterprise-grade dust token consolidation on Base mainnet.
              Gasless, secure, and rewarding.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-vortex-text mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  href="/quests"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  Quests
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-vortex-text mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.vortexbase.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://basescan.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  BaseScan
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/vortex-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-vortex-text mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://warpcast.com/vortex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-vortex-muted hover:text-vortex-purple transition-colors"
                >
                  Farcaster
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/vortexbase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-vortex-muted hover:text-vortex-cyan transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/vortex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-vortex-muted hover:text-vortex-pink transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-vortex-surface flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-vortex-muted">
            © 2025 Vortex Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-vortex-muted">
            <span>Built on</span>
            <a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-vortex-cyan transition-colors"
            >
              <span>🔵</span> Base
            </a>
            <span>•</span>
            <span>Powered by</span>
            <a
              href="https://www.farcaster.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-vortex-purple transition-colors"
            >
              <span>💜</span> Farcaster
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
