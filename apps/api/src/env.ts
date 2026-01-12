/**
 * VORTEX API - Environment Configuration
 */

import { z } from 'zod';

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1),
  
  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // RPC Providers (Failover chain)
  ALCHEMY_API_KEY: z.string().min(1),
  QUICKNODE_API_KEY: z.string().optional(),
  ANKR_API_KEY: z.string().optional(),

  // Price feeds
  COINGECKO_API_KEY: z.string().optional(),

  // Security (Risk engine)
  GOPLUS_API_KEY: z.string().optional(),
  HONEYPOT_API_KEY: z.string().optional(),
  DEXSCREENER_API_KEY: z.string().optional(),

  // Account Abstraction
  PIMLICO_API_KEY: z.string().min(1),

  // DEX Aggregator
  ONEINCH_API_KEY: z.string().min(1),

  // Portfolio
  MORALIS_API_KEY: z.string().min(1),

  // Authentication
  JWT_SECRET: z.string().min(32),
  WALLET_NONCE_TTL: z.coerce.number().default(300),

  // Monitoring
  SENTRY_DSN: z.string().optional(),

  // CORS
  FRONTEND_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();

// Constants
export const CHAIN_ID = 8453; // Base mainnet ONLY
export const CHAIN_NAME = 'Base';

export const RPC_URLS = {
  PRIMARY: `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
  FALLBACK_1: env.QUICKNODE_API_KEY
    ? `https://dawn-thrilling-night.base-mainnet.quiknode.pro/${env.QUICKNODE_API_KEY}`
    : null,
  FALLBACK_2: env.ANKR_API_KEY
    ? `https://rpc.ankr.com/base/${env.ANKR_API_KEY}`
    : 'https://mainnet.base.org',
};

export const CONTRACTS = {
  ENTRYPOINT: '0x0000000071727De22De5D61971EFF52E27Baf08d' as const,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  WETH: '0x4200000000000000000000000000000000000006' as const,
};

export const PROTOCOL_FEE = 0.008; // 0.8%
export const DUST_THRESHOLD_USD = 10;
export const MAX_SLIPPAGE = 0.02; // 2%
