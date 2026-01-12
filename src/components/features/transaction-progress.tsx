/**
 * VORTEX PROTOCOL - TRANSACTION PROGRESS COMPONENT
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getExplorerTxUrl } from '@/lib/utils';

export type TransactionStatus =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed';

interface TransactionStep {
  status: TransactionStatus;
  label: string;
  description: string;
  icon: string;
}

const STEPS: TransactionStep[] = [
  {
    status: 'preparing',
    label: 'Preparing',
    description: 'Building your transaction...',
    icon: '🔧',
  },
  {
    status: 'signing',
    label: 'Signing',
    description: 'Please sign the transaction in your wallet',
    icon: '✍️',
  },
  {
    status: 'submitting',
    label: 'Submitting',
    description: 'Sending transaction to the network...',
    icon: '📤',
  },
  {
    status: 'pending',
    label: 'Pending',
    description: 'Waiting for confirmation...',
    icon: '⏳',
  },
  {
    status: 'confirmed',
    label: 'Confirmed',
    description: 'Transaction successful!',
    icon: '✅',
  },
];

interface TransactionProgressProps {
  status: TransactionStatus;
  txHash?: string;
  chainId?: number;
  error?: string;
  onClose?: () => void;
  onRetry?: () => void;
  tokensCount?: number;
  outputAmount?: string;
  outputSymbol?: string;
  xpEarned?: number;
}

export function TransactionProgress({
  status,
  txHash,
  chainId = 8453,
  error,
  onClose,
  onRetry,
  tokensCount,
  outputAmount,
  outputSymbol,
  xpEarned,
}: TransactionProgressProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === 'confirmed') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const currentStepIndex = STEPS.findIndex((s) => s.status === status);
  const isComplete = status === 'confirmed';
  const isFailed = status === 'failed';

  if (status === 'idle') return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: 360 * 3,
                  x: Math.random() * window.innerWidth,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                }}
                style={{
                  background: ['#00f0ff', '#b829ff', '#ff2d6a', '#00ff88', '#ffd700'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Card variant="glow" glowColor={isComplete ? 'green' : isFailed ? 'pink' : 'cyan'} className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              className="text-5xl mb-4"
              animate={
                isComplete
                  ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                  : isFailed
                  ? { x: [-5, 5, -5, 5, 0] }
                  : { rotate: 360 }
              }
              transition={
                isComplete || isFailed
                  ? { duration: 0.5 }
                  : { duration: 2, repeat: Infinity, ease: 'linear' }
              }
            >
              {isComplete ? '🎉' : isFailed ? '❌' : '🌀'}
            </motion.div>
            <h2 className="text-xl font-bold text-vortex-text">
              {isComplete
                ? 'Consolidation Complete!'
                : isFailed
                ? 'Transaction Failed'
                : 'Processing...'}
            </h2>
          </div>

          {/* Steps */}
          {!isComplete && !isFailed && (
            <div className="space-y-3 mb-6">
              {STEPS.filter((s) => s.status !== 'confirmed').map((step, index) => {
                const isActive = step.status === status;
                const isPast = currentStepIndex > index;

                return (
                  <motion.div
                    key={step.status}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isActive
                        ? 'bg-vortex-cyan/10 border border-vortex-cyan/30'
                        : isPast
                        ? 'bg-vortex-green/10'
                        : 'bg-vortex-surface'
                    }`}
                    initial={false}
                    animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="text-xl">{isPast ? '✓' : step.icon}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${isPast ? 'text-vortex-green' : 'text-vortex-text'}`}>
                        {step.label}
                      </div>
                      {isActive && (
                        <div className="text-xs text-vortex-muted">{step.description}</div>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        className="w-4 h-4 border-2 border-vortex-cyan border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Success Details */}
          {isComplete && (
            <div className="space-y-4 mb-6">
              {tokensCount && (
                <div className="flex justify-between p-3 bg-vortex-surface rounded-lg">
                  <span className="text-vortex-muted">Tokens Cleaned</span>
                  <span className="font-bold text-vortex-text">{tokensCount}</span>
                </div>
              )}
              {outputAmount && (
                <div className="flex justify-between p-3 bg-vortex-surface rounded-lg">
                  <span className="text-vortex-muted">Received</span>
                  <span className="font-bold text-vortex-green">
                    {outputAmount} {outputSymbol}
                  </span>
                </div>
              )}
              {xpEarned && (
                <div className="flex justify-between p-3 bg-vortex-surface rounded-lg">
                  <span className="text-vortex-muted">XP Earned</span>
                  <span className="font-bold text-vortex-cyan">+{xpEarned}</span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {isFailed && error && (
            <div className="mb-6 p-4 bg-vortex-red/10 border border-vortex-red/30 rounded-lg">
              <p className="text-sm text-vortex-red">{error}</p>
            </div>
          )}

          {/* TX Hash */}
          {txHash && (
            <div className="mb-6">
              <a
                href={getExplorerTxUrl(txHash, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-vortex-purple hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isFailed && onRetry && (
              <Button className="flex-1" onClick={onRetry}>
                🔄 Retry
              </Button>
            )}
            {(isComplete || isFailed) && onClose && (
              <Button
                variant={isComplete ? 'default' : 'secondary'}
                className="flex-1"
                onClick={onClose}
              >
                {isComplete ? '🎉 Done' : 'Close'}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
