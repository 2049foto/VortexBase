/**
 * VORTEX PROTOCOL - TOKEN LIST COMPONENT
 * Displays scanned tokens with selection
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { cn, formatUSD, formatNumber } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from './risk-badge';
import type { ScannedToken } from '@/lib/services/scanner';

interface TokenListProps {
  tokens: ScannedToken[];
  selectedTokens: string[];
  onToggleToken: (address: string) => void;
  showSelection?: boolean;
  filter?: 'all' | 'dust' | 'safe';
}

export function TokenList({
  tokens,
  selectedTokens,
  onToggleToken,
  showSelection = true,
  filter = 'all',
}: TokenListProps) {
  const filteredTokens = tokens.filter((token) => {
    if (filter === 'dust') return token.isDust;
    if (filter === 'safe') return !token.riskScore || token.riskScore <= 30;
    return true;
  });

  if (filteredTokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-vortex-muted">No tokens found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {filteredTokens.map((token, index) => (
          <TokenRow
            key={token.address}
            token={token}
            isSelected={selectedTokens.includes(token.address)}
            onToggle={() => onToggleToken(token.address)}
            showSelection={showSelection}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface TokenRowProps {
  token: ScannedToken;
  isSelected: boolean;
  onToggle: () => void;
  showSelection: boolean;
  index: number;
}

function TokenRow({
  token,
  isSelected,
  onToggle,
  showSelection,
  index,
}: TokenRowProps) {
  const isHighRisk = token.riskScore !== undefined && token.riskScore > 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card
        variant="glow"
        glowColor={isSelected ? 'cyan' : isHighRisk ? 'pink' : 'purple'}
        className={cn(
          'p-4 cursor-pointer transition-all duration-200',
          isSelected && 'border-vortex-cyan bg-vortex-cyan/5',
          !showSelection && 'cursor-default'
        )}
        onClick={showSelection && !isHighRisk ? onToggle : undefined}
      >
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          {showSelection && (
            <div
              className={cn(
                'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                isSelected
                  ? 'bg-vortex-cyan border-vortex-cyan'
                  : 'border-vortex-muted/30',
                isHighRisk && 'opacity-30 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <svg
                  className="w-4 h-4 text-vortex-dark"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Token Icon */}
          <div className="relative w-10 h-10 rounded-full bg-vortex-surface overflow-hidden flex items-center justify-center">
            {token.logoUri ? (
              <Image
                src={token.logoUri}
                alt={token.symbol}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-vortex-muted">
                {token.symbol.charAt(0)}
              </span>
            )}
            {token.isDust && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-vortex-yellow rounded-full flex items-center justify-center">
                <span className="text-[8px]">💫</span>
              </div>
            )}
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-vortex-text truncate">
                {token.symbol}
              </span>
              {token.isDust && (
                <Badge variant="warning" className="text-[10px]">
                  DUST
                </Badge>
              )}
              {token.riskScore !== undefined && (
                <RiskBadge score={token.riskScore} size="sm" />
              )}
            </div>
            <p className="text-xs text-vortex-muted truncate">{token.name}</p>
          </div>

          {/* Balance & Value */}
          <div className="text-right">
            <p className="font-mono text-sm text-vortex-text">
              {formatNumber(parseFloat(token.balanceFormatted))}
            </p>
            <p
              className={cn(
                'text-sm font-semibold',
                token.valueUsd > 0 ? 'text-vortex-cyan' : 'text-vortex-muted'
              )}
            >
              {formatUSD(token.valueUsd)}
            </p>
          </div>
        </div>

        {/* High Risk Warning */}
        {isHighRisk && (
          <div className="mt-3 p-2 bg-vortex-red/10 rounded-lg border border-vortex-red/30">
            <p className="text-xs text-vortex-red flex items-center gap-1">
              <span>⚠️</span>
              High-risk token - not recommended for consolidation
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
