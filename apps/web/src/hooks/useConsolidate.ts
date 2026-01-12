'use client';

import { useState, useCallback } from 'react';
import { api, type ConsolidationQuote, type ConsolidationResult } from '@/lib/api-client';

interface UseConsolidateResult {
  buildConsolidation: (params: {
    scanId: string;
    inputTokens: Array<{ address: string; amount: string }>;
    outputToken: string;
    slippage?: number;
  }) => Promise<ConsolidationQuote | null>;
  submitConsolidation: (consolidationId: string, signedUserOp: unknown) => Promise<ConsolidationResult | null>;
  quote: ConsolidationQuote | null;
  result: ConsolidationResult | null;
  isBuilding: boolean;
  isSubmitting: boolean;
  error: string | null;
  reset: () => void;
}

export function useConsolidate(): UseConsolidateResult {
  const [quote, setQuote] = useState<ConsolidationQuote | null>(null);
  const [result, setResult] = useState<ConsolidationResult | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildConsolidation = useCallback(
    async (params: {
      scanId: string;
      inputTokens: Array<{ address: string; amount: string }>;
      outputToken: string;
      slippage?: number;
    }): Promise<ConsolidationQuote | null> => {
      setIsBuilding(true);
      setError(null);

      try {
        const quoteResult = await api.buildConsolidation(params);
        setQuote(quoteResult);
        return quoteResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to build consolidation';
        setError(message);
        return null;
      } finally {
        setIsBuilding(false);
      }
    },
    []
  );

  const submitConsolidation = useCallback(
    async (consolidationId: string, signedUserOp: unknown): Promise<ConsolidationResult | null> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const submitResult = await api.submitConsolidation(consolidationId, signedUserOp);
        setResult(submitResult);
        return submitResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit consolidation';
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setQuote(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    buildConsolidation,
    submitConsolidation,
    quote,
    result,
    isBuilding,
    isSubmitting,
    error,
    reset,
  };
}
