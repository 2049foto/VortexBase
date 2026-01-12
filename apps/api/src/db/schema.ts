/**
 * VORTEX API - Database Schema (Drizzle ORM)
 * 11 tables as per Phase 1 MVP spec
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  json,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const consolidationStatusEnum = pgEnum('consolidation_status', [
  'pending',
  'success',
  'failed',
]);

export const xpReasonEnum = pgEnum('xp_reason', [
  'scan',
  'share',
  'consolidate',
  'quest_claim',
  'referral',
  'streak',
]);

export const leaderboardPeriodEnum = pgEnum('leaderboard_period', [
  'daily',
  'weekly',
  'all_time',
]);

export const questTypeEnum = pgEnum('quest_type', ['daily', 'weekly', 'event']);

// ============================================
// TABLE 1: USERS
// ============================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wallet: varchar('wallet', { length: 42 }).notNull().unique(),
    farcasterId: integer('farcaster_id').unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('users_wallet_idx').on(table.wallet),
    index('users_farcaster_idx').on(table.farcasterId),
  ]
);

// ============================================
// TABLE 2: SCANS
// ============================================

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    wallet: varchar('wallet', { length: 42 }).notNull(),
    chainId: integer('chain_id').notNull().default(8453), // Base
    dustTokensCount: integer('dust_tokens_count').notNull().default(0),
    dustValueUsd: decimal('dust_value_usd', { precision: 18, scale: 6 })
      .notNull()
      .default('0'),
    scanResult: json('scan_result').$type<ScanResultJson>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('scans_user_idx').on(table.userId),
    index('scans_wallet_idx').on(table.wallet),
    index('scans_created_idx').on(table.createdAt),
  ]
);

// ============================================
// TABLE 3: DUST TOKENS
// ============================================

export const dustTokens = pgTable(
  'dust_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    tokenAddress: varchar('token_address', { length: 42 }).notNull(),
    symbol: varchar('symbol', { length: 32 }).notNull(),
    balance: varchar('balance', { length: 78 }).notNull(), // Wei as string
    valueUsd: decimal('value_usd', { precision: 18, scale: 6 }).notNull(),
    riskScore: integer('risk_score').notNull().default(0), // 0-100
    excluded: boolean('excluded').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('dust_tokens_scan_idx').on(table.scanId),
    index('dust_tokens_address_idx').on(table.tokenAddress),
  ]
);

// ============================================
// TABLE 4: CONSOLIDATIONS
// ============================================

export const consolidations = pgTable(
  'consolidations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id),
    useropHash: varchar('userop_hash', { length: 66 }).unique(),
    txHash: varchar('tx_hash', { length: 66 }),
    inputTokens: json('input_tokens').$type<string[]>().notNull(),
    outputToken: varchar('output_token', { length: 42 }).notNull(),
    outputAmount: varchar('output_amount', { length: 78 }), // Wei
    protocolFee: decimal('protocol_fee', { precision: 18, scale: 6 }),
    status: consolidationStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('consolidations_user_idx').on(table.userId),
    index('consolidations_status_idx').on(table.status),
    uniqueIndex('consolidations_userop_idx').on(table.useropHash),
  ]
);

// ============================================
// TABLE 5: XP TRANSACTIONS
// ============================================

export const xpTransactions = pgTable(
  'xp_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    xpAmount: integer('xp_amount').notNull(),
    reason: xpReasonEnum('reason').notNull(),
    referenceId: varchar('reference_id', { length: 64 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('xp_transactions_user_idx').on(table.userId),
    index('xp_transactions_created_idx').on(table.createdAt),
  ]
);

// ============================================
// TABLE 6: LEADERBOARDS
// ============================================

export const leaderboards = pgTable(
  'leaderboards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    period: leaderboardPeriodEnum('period').notNull(),
    rank: integer('rank').notNull(),
    xpTotal: integer('xp_total').notNull().default(0),
    gasSavedUsd: decimal('gas_saved_usd', { precision: 18, scale: 6 })
      .notNull()
      .default('0'),
    consolidationsCount: integer('consolidations_count').notNull().default(0),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  },
  (table) => [
    index('leaderboards_user_idx').on(table.userId),
    index('leaderboards_period_idx').on(table.period),
    index('leaderboards_rank_idx').on(table.rank),
  ]
);

// ============================================
// TABLE 7: QUESTS
// ============================================

export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  questKey: varchar('quest_key', { length: 64 }).notNull().unique(),
  title: varchar('title', { length: 128 }).notNull(),
  description: text('description').notNull(),
  type: questTypeEnum('type').notNull(),
  rewardXp: integer('reward_xp').notNull(),
  condition: json('condition').$type<QuestConditionJson>().notNull(),
  activeFrom: timestamp('active_from').notNull().defaultNow(),
  activeUntil: timestamp('active_until'),
});

// ============================================
// TABLE 8: QUEST COMPLETIONS
// ============================================

export const questCompletions = pgTable(
  'quest_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    questId: uuid('quest_id')
      .notNull()
      .references(() => quests.id),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
    xpAwarded: integer('xp_awarded').notNull(),
    claimedAt: timestamp('claimed_at'),
  },
  (table) => [
    index('quest_completions_user_idx').on(table.userId),
    index('quest_completions_quest_idx').on(table.questId),
  ]
);

// ============================================
// TABLE 9: REFERRALS
// ============================================

export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrerId: uuid('referrer_id')
      .notNull()
      .references(() => users.id),
    referredId: uuid('referred_id')
      .notNull()
      .references(() => users.id),
    referralCode: varchar('referral_code', { length: 16 }).notNull().unique(),
    feeShareLifetime: decimal('fee_share_lifetime', {
      precision: 18,
      scale: 6,
    })
      .notNull()
      .default('0.10'), // 10%
    earned: decimal('earned', { precision: 18, scale: 6 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('referrals_referrer_idx').on(table.referrerId),
    uniqueIndex('referrals_code_idx').on(table.referralCode),
  ]
);

// ============================================
// TABLE 10: AUTH NONCES
// ============================================

export const authNonces = pgTable(
  'auth_nonces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wallet: varchar('wallet', { length: 42 }).notNull(),
    nonce: varchar('nonce', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('auth_nonces_wallet_idx').on(table.wallet),
    index('auth_nonces_expires_idx').on(table.expiresAt),
  ]
);

// ============================================
// TABLE 11: AUDIT LOGS
// ============================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 64 }).notNull(),
    details: json('details').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_user_idx').on(table.userId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_created_idx').on(table.createdAt),
  ]
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  scans: many(scans),
  consolidations: many(consolidations),
  xpTransactions: many(xpTransactions),
  leaderboards: many(leaderboards),
  questCompletions: many(questCompletions),
  referralsGiven: many(referrals, { relationName: 'referrer' }),
  auditLogs: many(auditLogs),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  user: one(users, { fields: [scans.userId], references: [users.id] }),
  dustTokens: many(dustTokens),
  consolidations: many(consolidations),
}));

export const dustTokensRelations = relations(dustTokens, ({ one }) => ({
  scan: one(scans, { fields: [dustTokens.scanId], references: [scans.id] }),
}));

export const consolidationsRelations = relations(consolidations, ({ one }) => ({
  user: one(users, {
    fields: [consolidations.userId],
    references: [users.id],
  }),
  scan: one(scans, {
    fields: [consolidations.scanId],
    references: [scans.id],
  }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, {
    fields: [xpTransactions.userId],
    references: [users.id],
  }),
}));

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  user: one(users, {
    fields: [leaderboards.userId],
    references: [users.id],
  }),
}));

export const questsRelations = relations(quests, ({ many }) => ({
  completions: many(questCompletions),
}));

export const questCompletionsRelations = relations(
  questCompletions,
  ({ one }) => ({
    user: one(users, {
      fields: [questCompletions.userId],
      references: [users.id],
    }),
    quest: one(quests, {
      fields: [questCompletions.questId],
      references: [quests.id],
    }),
  })
);

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ============================================
// JSON TYPES
// ============================================

export interface ScanResultJson {
  tokens: Array<{
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    valueUsd: number;
    logo?: string;
  }>;
  scannedAt: string;
  durationMs: number;
}

export interface QuestConditionJson {
  type: 'scan_count' | 'consolidate_count' | 'share_count' | 'streak_days';
  target: number;
  period?: 'daily' | 'weekly';
}

// ============================================
// TYPES
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type DustToken = typeof dustTokens.$inferSelect;
export type Consolidation = typeof consolidations.$inferSelect;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type QuestCompletion = typeof questCompletions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type AuthNonce = typeof authNonces.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
