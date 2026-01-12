# VORTEX API - Environment Setup Guide

## Required Environment Variables

Copy these to your `.env.local` file (or set in Fly.io/Vercel dashboard).

### Node Configuration
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

### Database (Neon PostgreSQL)
Get from: https://console.neon.tech → Connection Details
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

### Redis (Upstash)
Get from: https://console.upstash.com → REST API tab
```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxxxx==
```

### RPC Providers
Primary: Alchemy (https://dashboard.alchemy.com)
```env
ALCHEMY_API_KEY=your_alchemy_key
QUICKNODE_API_KEY=optional
ANKR_API_KEY=optional
```

### Price Data
CoinGecko (https://www.coingecko.com/api/pricing)
```env
COINGECKO_API_KEY=your_coingecko_key
```

### Security APIs
```env
GOPLUS_API_KEY=your_goplus_key
HONEYPOT_API_KEY=optional
DEXSCREENER_API_KEY=optional
```

### Account Abstraction
Pimlico (https://dashboard.pimlico.io)
```env
PIMLICO_API_KEY=your_pimlico_key
```

### DEX Aggregator
1inch (https://portal.1inch.dev)
```env
ONEINCH_API_KEY=your_1inch_key
```

### Portfolio Data
Moralis (https://admin.moralis.io)
```env
MORALIS_API_KEY=your_moralis_key
```

### Authentication
Generate secret: `openssl rand -base64 32`
```env
JWT_SECRET=your_32_char_minimum_secret
WALLET_NONCE_TTL=300
```

### Monitoring (Optional)
Sentry (https://sentry.io)
```env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### CORS
```env
FRONTEND_URL=http://localhost:3000
# Production: FRONTEND_URL=https://vortex.vercel.app
```

---

## Fly.io Deployment

Set secrets with:
```bash
flyctl secrets set \
  DATABASE_URL="your_value" \
  UPSTASH_REDIS_REST_URL="your_value" \
  UPSTASH_REDIS_REST_TOKEN="your_value" \
  ALCHEMY_API_KEY="your_value" \
  PIMLICO_API_KEY="your_value" \
  ONEINCH_API_KEY="your_value" \
  MORALIS_API_KEY="your_value" \
  COINGECKO_API_KEY="your_value" \
  GOPLUS_API_KEY="your_value" \
  JWT_SECRET="your_value" \
  FRONTEND_URL="https://vortex.vercel.app"
```

---

## Vercel Deployment

Add environment variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable for Production environment
3. Redeploy to apply changes
