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
git clone https://github.com/2049foto/VortexBase.git
cd VortexBase

# Install dependencies (using Bun)
bun install

# Setup environment variables
# Copy apps/api/ENV_SETUP.md for backend variables
# Create apps/web/.env.local for frontend

# Run database migrations
cd apps/api
bun run db:push
bun run db:seed

# Start development servers
# Terminal 1: Backend
cd apps/api
bun run dev

# Terminal 2: Frontend
cd apps/web
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
VortexBase/
├── apps/
│   ├── api/             # Backend (Bun + Elysia)
│   │   ├── src/
│   │   │   ├── db/      # Database schema & queries
│   │   │   ├── services/# Business logic (10 services)
│   │   │   ├── routes/  # API routes (10 routes)
│   │   │   ├── middleware/# Auth, logger, rate-limit
│   │   │   └── __tests__/# Unit + integration tests
│   │   ├── Dockerfile   # Production Docker image
│   │   └── fly.toml     # Fly.io deployment config
│   │
│   └── web/             # Frontend (Next.js 15)
│       ├── src/
│       │   ├── app/     # Next.js pages
│       │   ├── components/# React components
│       │   ├── hooks/   # Custom hooks
│       │   └── lib/     # Utilities
│       └── vercel.json  # Vercel deployment config
│
├── .env.local           # Environment variables (NOT in git)
└── README.md
```

## 🧪 Commands

### Backend (apps/api)
```bash
cd apps/api

# Development
bun run dev              # Start API server (port 3001)
bun run typecheck        # TypeScript check
bun run test             # Run 88 unit + integration tests

# Database
bun run db:push          # Push schema to Neon
bun run db:seed          # Seed test data
bun run db:studio        # Open Drizzle Studio

# Deployment
./scripts/deploy.sh      # Deploy to Fly.io
```

### Frontend (apps/web)
```bash
cd apps/web

# Development
bun run dev              # Start Next.js dev server (port 3000)
bun run build            # Build for production
bun run start            # Start production server
bunx tsc --noEmit        # TypeScript check
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
