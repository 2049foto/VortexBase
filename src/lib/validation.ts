/**
 * VORTEX PROTOCOL - VALIDATION SCHEMAS
 * Zod schemas for input validation
 */

import { z } from 'zod';

import { CHAIN_IDS, LIMITS } from '@/lib/constants';

// ============================================
// COMMON VALIDATORS
// ============================================

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  .transform((addr) => addr.toLowerCase() as `0x${string}`);

export const transactionHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')
  .transform((hash) => hash.toLowerCase() as `0x${string}`);

const SUPPORTED_CHAIN_IDS = [
  CHAIN_IDS.ETHEREUM,
  CHAIN_IDS.BASE,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.BNB,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.ZKSYNC,
];

export const chainIdSchema = z
  .number()
  .int()
  .refine((id) => SUPPORTED_CHAIN_IDS.includes(id), {
    message: `Chain ID must be one of: ${SUPPORTED_CHAIN_IDS.join(', ')}`,
  });

export const amountSchema = z
  .string()
  .regex(/^\d+$/, 'Amount must be a valid integer string')
  .refine((val) => BigInt(val) > 0n, 'Amount must be positive');

export const slippageSchema = z
  .number()
  .min(0.1, 'Slippage must be at least 0.1%')
  .max(5, 'Slippage cannot exceed 5%')
  .default(0.5);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// SCAN SCHEMAS
// ============================================

export const scanRequestSchema = z.object({
  address: ethereumAddressSchema,
  chainId: z.coerce.number().pipe(chainIdSchema).default(CHAIN_IDS.BASE),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;

// ============================================
// CONSOLIDATION SCHEMAS
// ============================================

export const tokenInputSchema = z.object({
  address: ethereumAddressSchema,
  amount: amountSchema,
});

export const consolidateRequestSchema = z.object({
  address: ethereumAddressSchema,
  chainId: z.coerce.number().pipe(chainIdSchema).default(CHAIN_IDS.BASE),
  tokens: z
    .array(tokenInputSchema)
    .min(1, 'At least one token is required')
    .max(LIMITS.MAX_BATCH_SIZE, `Maximum ${LIMITS.MAX_BATCH_SIZE} tokens per batch`),
  outputToken: ethereumAddressSchema,
  slippage: slippageSchema,
});

export type ConsolidateRequest = z.infer<typeof consolidateRequestSchema>;

// ============================================
// LEADERBOARD SCHEMAS
// ============================================

export const leaderboardPeriodSchema = z.enum(['weekly', 'monthly', 'all_time']);

export const leaderboardRequestSchema = z.object({
  period: leaderboardPeriodSchema.default('weekly'),
  ...paginationSchema.shape,
  address: ethereumAddressSchema.optional(),
});

export type LeaderboardRequest = z.infer<typeof leaderboardRequestSchema>;

// ============================================
// USER SCHEMAS
// ============================================

export const userRequestSchema = z.object({
  address: ethereumAddressSchema,
  includeHistory: z.coerce.boolean().default(false),
});

export type UserRequest = z.infer<typeof userRequestSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  preferredChainId: chainIdSchema.optional(),
  preferredOutputToken: ethereumAddressSchema.optional(),
  slippageTolerance: slippageSchema.optional(),
  autoShareFarcaster: z.boolean().optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

// ============================================
// FRAME SCHEMAS
// ============================================

export const frameMessageSchema = z.object({
  untrustedData: z.object({
    fid: z.number().int().positive(),
    buttonIndex: z.number().int().min(1).max(4),
    inputText: z.string().optional(),
    castId: z
      .object({
        fid: z.number(),
        hash: z.string(),
      })
      .optional(),
    state: z.string().optional(),
    address: ethereumAddressSchema.optional(),
    transactionId: transactionHashSchema.optional(),
  }),
  trustedData: z.object({
    messageBytes: z.string(),
  }),
});

export type FrameMessage = z.infer<typeof frameMessageSchema>;

// ============================================
// VALIDATION UTILITIES
// ============================================

export function parseQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, unknown> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return schema.parse(params);
}

export function parseBody<T extends z.ZodSchema>(
  body: unknown,
  schema: T
): z.infer<T> {
  return schema.parse(body);
}

export function safeParseQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const params: Record<string, unknown> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

export function safeParseBody<T extends z.ZodSchema>(
  body: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  return schema.safeParse(body);
}

export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join('; ');
}
