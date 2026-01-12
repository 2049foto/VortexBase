/**
 * VORTEX PROTOCOL - CONSOLIDATION PREVIEW MODAL
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD, formatNumber, getRiskLevel } from '@/lib/utils';
import { PROTOCOL_FEES, BASE_TOKENS } from '@/lib/constants';
import type { Token, RiskScore } from '@/types';

interface ConsolidationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTokens: Token[];
  outputToken: string;
  estimatedOutput: number;
  estimatedOutputUsd: number;
  gasSavedUsd: number;
  xpReward: number;
  isSimulating: boolean;
  simulationResult?: {
    success: boolean;
    error?: string;
    gasUsed?: string;
  };
  onConfirm: () => void;
  onSimulate: () => void;
  isConfirming: boolean;
}

export function ConsolidationPreview({
  isOpen,
  onClose,
  selectedTokens,
  outputToken,
  estimatedOutput,
  estimatedOutputUsd,
  gasSavedUsd,
  xpReward,
  isSimulating,
  simulationResult,
  onConfirm,
  onSimulate,
  isConfirming,
}: ConsolidationPreviewProps) {
  const totalInputUsd = selectedTokens.reduce(
    (sum, t) => sum + (t.priceUsd * Number(t.balance) / Math.pow(10, t.decimals)),
    0
  );

  const protocolFee = totalInputUsd * PROTOCOL_FEES.CONSOLIDATION;
  const netOutput = estimatedOutputUsd - protocolFee;
  const slippage = ((totalInputUsd - estimatedOutputUsd) / totalInputUsd) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          <Card variant="glow" glowColor="cyan" className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-vortex-text">
                Consolidation Preview
              </h2>
              <button
                onClick={onClose}
                className="text-vortex-muted hover:text-vortex-text transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Input Tokens */}
            <div className="mb-6">
              <h3 className="text-sm text-vortex-muted mb-3">
                Tokens to Consolidate ({selectedTokens.length})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-vortex-surface rounded-lg">
                {selectedTokens.map((token) => (
                  <div key={token.address} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{token.symbol}</span>
                      {token.riskScore && (
                        <Badge
                          variant={
                            token.riskScore.total <= 30
                              ? 'success'
                              : token.riskScore.total <= 60
                              ? 'warning'
                              : 'danger'
                          }
                          className="text-xs"
                        >
                          Risk: {token.riskScore.total}
                        </Badge>
                      )}
                    </div>
                    <span className="text-vortex-muted">
                      {formatUSD(token.priceUsd * Number(token.balance) / Math.pow(10, token.decimals))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="mb-6 p-4 bg-gradient-to-r from-vortex-cyan/10 to-vortex-purple/10 rounded-lg border border-vortex-cyan/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-vortex-muted">You'll Receive</span>
                <span className="font-mono text-lg font-bold text-vortex-cyan">
                  {formatNumber(estimatedOutput, 6)} {outputToken}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-vortex-muted">Estimated Value</span>
                <span className="text-vortex-text">{formatUSD(estimatedOutputUsd)}</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-vortex-muted">Input Value</span>
                <span className="text-vortex-text">{formatUSD(totalInputUsd)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-vortex-muted">Protocol Fee (0.8%)</span>
                <span className="text-vortex-muted">-{formatUSD(protocolFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-vortex-muted">Price Impact</span>
                <span className={slippage > 2 ? 'text-vortex-red' : 'text-vortex-muted'}>
                  {slippage.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-vortex-surface pt-2">
                <span className="text-vortex-muted">Net Output</span>
                <span className="text-vortex-green font-semibold">
                  ≈ {formatUSD(netOutput)}
                </span>
              </div>
            </div>

            {/* Rewards */}
            <div className="mb-6 p-3 bg-vortex-yellow/10 rounded-lg border border-vortex-yellow/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>⛽</span>
                  <span className="text-sm text-vortex-text">Gas Saved</span>
                </div>
                <span className="font-bold text-vortex-green">{formatUSD(gasSavedUsd)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span>⭐</span>
                  <span className="text-sm text-vortex-text">XP Reward</span>
                </div>
                <span className="font-bold text-vortex-cyan">+{formatNumber(xpReward)}</span>
              </div>
            </div>

            {/* Simulation Result */}
            {simulationResult && (
              <div
                className={`mb-6 p-3 rounded-lg border ${
                  simulationResult.success
                    ? 'bg-vortex-green/10 border-vortex-green/30'
                    : 'bg-vortex-red/10 border-vortex-red/30'
                }`}
              >
                {simulationResult.success ? (
                  <div className="flex items-center gap-2 text-vortex-green">
                    <span>✓</span>
                    <span className="text-sm">Simulation passed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-vortex-red">
                    <span>✕</span>
                    <span className="text-sm">
                      Simulation failed: {simulationResult.error}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onSimulate}
                disabled={isSimulating || isConfirming}
              >
                {isSimulating ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Simulating...
                  </span>
                ) : (
                  '🔬 Simulate'
                )}
              </Button>
              <Button
                className="flex-1"
                onClick={onConfirm}
                disabled={isConfirming || (simulationResult && !simulationResult.success)}
              >
                {isConfirming ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Confirming...
                  </span>
                ) : (
                  '🚀 Confirm'
                )}
              </Button>
            </div>

            {/* Gasless Notice */}
            <p className="text-xs text-center text-vortex-muted mt-4">
              ⚡ This transaction is gasless - powered by Account Abstraction
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
