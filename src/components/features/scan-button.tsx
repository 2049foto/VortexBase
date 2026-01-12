/**
 * VORTEX PROTOCOL - SCAN BUTTON COMPONENT
 * Main CTA button for wallet scanning
 */

'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWallet, useScan } from '@/hooks';

interface ScanButtonProps {
  className?: string;
  size?: 'default' | 'lg' | 'xl';
}

export function ScanButton({ className, size = 'lg' }: ScanButtonProps) {
  const { address, isConnected, isOnBase, connect, switchToBase } = useWallet();
  const { isLoading, refetch } = useScan();

  const handleClick = () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!isOnBase) {
      switchToBase();
      return;
    }

    refetch();
  };

  const getButtonText = () => {
    if (!isConnected) return '🔗 Connect Wallet';
    if (!isOnBase) return '⚡ Switch to Base';
    if (isLoading) return 'Scanning...';
    return '🔍 Scan Wallet';
  };

  return (
    <motion.div
      className={cn('relative', className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-vortex-cyan via-vortex-purple to-vortex-pink rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition duration-500" />

      <Button
        size={size}
        onClick={handleClick}
        isLoading={isLoading}
        className="relative w-full"
      >
        {getButtonText()}
      </Button>
    </motion.div>
  );
}

// Floating Scan Button for mobile
export function FloatingScanButton() {
  const { isConnected, isOnBase, connect, switchToBase } = useWallet();
  const { isLoading, refetch } = useScan();

  const handleClick = () => {
    if (!isConnected) {
      connect();
      return;
    }
    if (!isOnBase) {
      switchToBase();
      return;
    }
    refetch();
  };

  return (
    <motion.button
      className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-vortex-cyan via-vortex-purple to-vortex-pink shadow-glow-cyan flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
    >
      {isLoading ? (
        <motion.div
          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <span className="text-2xl">
          {!isConnected ? '🔗' : !isOnBase ? '⚡' : '🔍'}
        </span>
      )}
    </motion.button>
  );
}
