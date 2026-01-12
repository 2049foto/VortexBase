/**
 * VORTEX PROTOCOL - WALLET HOOK
 * Custom hook for wallet connection and state
 */

'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useCallback, useMemo } from 'react';

import { CHAIN_IDS } from '@/lib/constants';

export function useWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isLoading = isConnecting || isReconnecting;

  const shortAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const isOnBase = chainId === CHAIN_IDS.BASE;

  const switchToBase = useCallback(() => {
    if (switchChain) {
      switchChain({ chainId: CHAIN_IDS.BASE });
    }
  }, [switchChain]);

  const connectWallet = useCallback(
    (connectorId?: string) => {
      const connector =
        connectors.find((c) => c.id === connectorId) || connectors[0];
      if (connector) {
        connect({ connector });
      }
    },
    [connect, connectors]
  );

  return {
    address,
    shortAddress,
    isConnected,
    isLoading,
    chainId,
    isOnBase,
    connectors,
    connect: connectWallet,
    disconnect,
    switchToBase,
  };
}
