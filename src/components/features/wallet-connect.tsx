/**
 * VORTEX PROTOCOL - WALLET CONNECT COMPONENT
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { cn, truncateAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks';
import { CHAIN_NAMES } from '@/lib/constants';

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const {
    address,
    shortAddress,
    isConnected,
    isLoading,
    chainId,
    isOnBase,
    connectors,
    connect,
    disconnect,
    switchToBase,
  } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        className={className}
        onClick={() => connect()}
        isLoading={isLoading}
      >
        🔗 Connect
      </Button>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="secondary"
        onClick={() => setShowMenu(!showMenu)}
        className="gap-2"
      >
        {/* Status Indicator */}
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isOnBase ? 'bg-vortex-green' : 'bg-vortex-yellow'
          )}
        />
        <span className="font-mono">{shortAddress}</span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform',
            showMenu && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              className="absolute right-0 top-full mt-2 z-50 w-64"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card variant="glow" className="p-4 space-y-4">
                {/* Address */}
                <div className="space-y-1">
                  <p className="text-xs text-vortex-muted">Connected Wallet</p>
                  <p className="font-mono text-sm text-vortex-text break-all">
                    {address}
                  </p>
                </div>

                {/* Chain */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-vortex-muted">Network</span>
                  <Badge variant={isOnBase ? 'success' : 'warning'}>
                    {chainId ? CHAIN_NAMES[chainId] || `Chain ${chainId}` : 'Unknown'}
                  </Badge>
                </div>

                {/* Switch Network */}
                {!isOnBase && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      switchToBase();
                      setShowMenu(false);
                    }}
                  >
                    ⚡ Switch to Base
                  </Button>
                )}

                <hr className="border-vortex-surface" />

                {/* Copy Address */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                    }
                    setShowMenu(false);
                  }}
                >
                  📋 Copy Address
                </Button>

                {/* View on Explorer */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (address && chainId === 8453) {
                      window.open(
                        `https://basescan.org/address/${address}`,
                        '_blank'
                      );
                    }
                    setShowMenu(false);
                  }}
                >
                  🔗 View on BaseScan
                </Button>

                {/* Disconnect */}
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    disconnect();
                    setShowMenu(false);
                  }}
                >
                  🚪 Disconnect
                </Button>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
