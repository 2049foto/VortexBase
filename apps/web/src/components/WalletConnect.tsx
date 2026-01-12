'use client';

import { useState, useCallback } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface WalletConnectProps {
  onSuccess?: () => void;
  className?: string;
}

export function WalletConnect({ onSuccess, className }: WalletConnectProps) {
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if window.ethereum exists
      if (typeof window === 'undefined' || !window.ethereum) {
        setError('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Request accounts
      const result = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const accounts = result as string[];
      if (!accounts || accounts.length === 0) {
        setError('No accounts found');
        return;
      }

      const wallet = accounts[0];

      // Get nonce from backend
      const nonceData = await api.getNonce(wallet);

      // Sign the message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonceData.message, wallet],
      });

      // Login with signature
      const success = await login(wallet, signature as string, nonceData.message);

      if (success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Wallet connect error:', err);
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          setError('You rejected the request');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [login, onSuccess]);

  const isLoading = isConnecting || authLoading;
  const displayError = error || authError;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <button
        onClick={connect}
        disabled={isLoading}
        className={cn(
          'btn-primary flex items-center gap-3 min-w-[200px]',
          isLoading && 'opacity-70 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet size={20} />
            Connect Wallet
          </>
        )}
      </button>

      {displayError && (
        <p className="text-sm text-vortex-error text-center max-w-xs">
          {displayError}
        </p>
      )}
    </div>
  );
}

// Extend window type for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
