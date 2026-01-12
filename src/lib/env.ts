/**
 * VORTEX PROTOCOL - ENVIRONMENT VALIDATION
 * Type-safe environment variable access
 */

import { z } from 'zod';

// ============================================
// SERVER ENVIRONMENT SCHEMA
// ============================================

const serverEnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  
  // Portfolio APIs
  MORALIS_API_KEY: z.string().min(1),
  
  // Security APIs
  GOPLUS_APP_KEY: z.string().optional(),
  GOPLUS_APP_SECRET: z.string().optional(),
  
  // DEX APIs
  ONEINCH_API_KEY: z.string().min(1),
  
  // Account Abstraction
  PIMLICO_API_KEY: z.string().min(1),
  
  // RPC
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: z.string().url().optional(),
  NEXT_PUBLIC_ALCHEMY_BASE_RPC: z.string().url().optional(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Feature Flags
  FEATURE_GASLESS_ENABLED: z.coerce.boolean().default(true),
  FEATURE_RISK_CHECK_ENABLED: z.coerce.boolean().default(true),
});

// ============================================
// CLIENT ENVIRONMENT SCHEMA
// ============================================

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_CHAIN_ID: z.coerce.number().default(8453),
  NEXT_PUBLIC_FARCASTER_HUB_URL: z.string().url().optional(),
});

// ============================================
// VALIDATION
// ============================================

function validateEnv() {
  // Only validate on server
  if (typeof window !== 'undefined') {
    return {
      server: {} as z.infer<typeof serverEnvSchema>,
      client: clientEnvSchema.parse({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
        NEXT_PUBLIC_FARCASTER_HUB_URL: process.env.NEXT_PUBLIC_FARCASTER_HUB_URL,
      }),
    };
  }

  const serverResult = serverEnvSchema.safeParse(process.env);
  const clientResult = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_FARCASTER_HUB_URL: process.env.NEXT_PUBLIC_FARCASTER_HUB_URL,
  });

  if (!serverResult.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(serverResult.error.format());
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid server environment configuration');
    }
  }

  if (!clientResult.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(clientResult.error.format());
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid client environment configuration');
    }
  }

  return {
    server: serverResult.success ? serverResult.data : ({} as z.infer<typeof serverEnvSchema>),
    client: clientResult.success ? clientResult.data : ({} as z.infer<typeof clientEnvSchema>),
  };
}

// ============================================
// EXPORTS
// ============================================

const env = validateEnv();

export const serverEnv = env.server;
export const clientEnv = env.client;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function getAppUrl(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getChainId(): number {
  return clientEnv.NEXT_PUBLIC_CHAIN_ID || 8453;
}

// ============================================
// FEATURE FLAGS
// ============================================

export const features = {
  gasless: serverEnv.FEATURE_GASLESS_ENABLED ?? true,
  riskCheck: serverEnv.FEATURE_RISK_CHECK_ENABLED ?? true,
};
