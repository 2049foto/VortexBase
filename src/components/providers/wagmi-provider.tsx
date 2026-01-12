'use client';

import { WagmiProvider as WagmiProviderBase, createConfig, http } from 'wagmi';
import { base, mainnet, arbitrum, optimism, polygon, bsc, avalanche, zkSync } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { type ReactNode } from 'react';

// Custom Monad chain definition (not in wagmi by default)
const monad = {
  id: 838592,
  name: 'Monad',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
} as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [base, mainnet, arbitrum, optimism, polygon, bsc, avalanche, monad, zkSync],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Vortex Protocol',
      appLogoUrl: 'https://vortexbase.vercel.app/logo.png',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
      metadata: {
        name: 'Vortex Protocol',
        description: 'Dust Token Consolidation Engine',
        url: 'https://vortexbase.vercel.app',
        icons: ['https://vortexbase.vercel.app/logo.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS ||
      process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC ||
      'https://mainnet.base.org'
    ),
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_ETH_RPC ||
      'https://eth.llamarpc.com'
    ),
    [arbitrum.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_ARB_RPC ||
      'https://arb1.arbitrum.io/rpc'
    ),
    [optimism.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_OPT_RPC ||
      'https://mainnet.optimism.io'
    ),
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_RPC ||
      'https://polygon-rpc.com'
    ),
    [bsc.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_BNB_RPC ||
      'https://bsc-dataseed.binance.org'
    ),
    [avalanche.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_AVAX_RPC ||
      'https://api.avax.network/ext/bc/C/rpc'
    ),
    [monad.id]: http('https://rpc.monad.xyz'),
    [zkSync.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_ZKSYNC_RPC ||
      'https://mainnet.era.zksync.io'
    ),
  },
  ssr: true,
});

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiProviderBase config={wagmiConfig}>
      {children}
    </WagmiProviderBase>
  );
}
