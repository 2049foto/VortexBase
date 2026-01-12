# Vortex Protocol

<div align="center">
  <img src="public/logo.png" alt="Vortex Protocol" width="120" />
  
  ### 🌀 Enterprise DeFi Infrastructure for Dust Token Consolidation
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
  [![Base](https://img.shields.io/badge/Base-Mainnet-0052FF)](https://base.org/)
  
  [Live Demo](https://vortexbase.vercel.app) · [Documentation](https://docs.vortexprotocol.xyz) · [Twitter](https://twitter.com/vortexprotocol)
</div>

---

## 🚀 Overview

Vortex Protocol is a gasless dust token consolidation engine built on Base. Transform worthless dust tokens into valuable assets with:

- **Gasless Swaps** - Powered by Account Abstraction (ERC-4337)
- **12-Layer Security** - Advanced risk scoring prevents scams/honeypots
- **Best Rates** - Multi-DEX aggregation via 1inch
- **Earn XP & Rewards** - Gamified experience with leaderboards

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔥 Gasless Transactions | No ETH needed - gas sponsored via Pimlico |
| 🛡️ Risk Analysis | GoPlus, Honeypot.is, DexScreener integration |
| 💱 DEX Aggregation | 1inch, 0x, Uniswap v3, Curve, Balancer |
| 🎮 Gamification | XP, streaks, quests, weekly prizes |
| 📱 Farcaster Frame | Native integration for social sharing |
| ⛓️ Multi-Chain | Base, Ethereum, Arbitrum, Optimism + more |

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15.1.2 (App Router, RSC)
- TypeScript 5.7+ (strict mode)
- Tailwind CSS 4.0
- Shadcn/ui + Radix primitives
- Framer Motion 11
- wagmi v2 + viem v2

**Backend:**
- Bun 1.1+
- Drizzle ORM
- Neon PostgreSQL
- Upstash Redis

**Blockchain:**
- Pimlico (Account Abstraction)
- 1inch Router v6
- Tenderly (Simulation)

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/2049foto/Vortex-.git
cd vortex-protocol

# Install dependencies (using Bun)
bun install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# App
NEXT_PUBLIC_APP_NAME=Vortex Protocol
NEXT_PUBLIC_APP_URL=https://vortexbase.vercel.app
NEXT_PUBLIC_CHAIN_ID=8453

# Database
DATABASE_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# RPC Providers
NEXT_PUBLIC_QUICKNODE_BASE_HTTPS=https://...
NEXT_PUBLIC_ALCHEMY_BASE_RPC=https://...

# Account Abstraction
PIMLICO_API_KEY=...
NEXT_PUBLIC_PIMLICO_BASE_URL=https://...

# Security APIs
GOPLUS_APP_KEY=...
MORALIS_API_KEY=...

# DEX Aggregators
ONEINCH_API_KEY=...
ZEROX_API_KEY=...

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

See `.env.example` for the complete list.

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard pages
│   ├── frames/          # Farcaster Frame routes
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── providers/       # Context providers
│   ├── ui/              # Shadcn/ui components
│   └── ...
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   ├── db/              # Database schema & queries
│   ├── services/        # Business logic
│   └── ...
├── styles/              # Global CSS
└── types/               # TypeScript types
```

## 🧪 Commands

```bash
# Development
bun run dev              # Start dev server (Turbopack)
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint
bun run type-check       # Run TypeScript check

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio

# Testing
bun run test             # Run tests
bun run test:coverage    # Run tests with coverage
```

## 🔐 Security

- All API routes are rate-limited
- Nonce-based replay protection
- CSRF token validation
- JWT + refresh token rotation
- 12-layer risk scoring for tokens

## 🗺️ Roadmap

- [x] Phase 1: Core scanning & consolidation (Base)
- [ ] Phase 2: Multi-chain support (Arbitrum, Optimism)
- [ ] Phase 3: Mobile app + DAO governance
- [ ] Phase 4: Protocol token launch

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## 📞 Contact

- Twitter: [@vortexprotocol](https://twitter.com/vortexprotocol)
- Farcaster: [@vortex](https://warpcast.com/vortex)
- Discord: [Join our server](https://discord.gg/vortex)

---

<div align="center">
  <strong>Built with 💜 by the Vortex Team</strong>
</div>
