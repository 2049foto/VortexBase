/**
 * VORTEX PROTOCOL - DATABASE SCHEMA
 * Drizzle ORM Schema Definitions
 * PostgreSQL via Neon Serverless
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  decimal,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const scanStatusEnum = pgEnum('scan_status', [
  'pending',
  'scanning',
  'completed',
  'failed',
]);

export const consolidationStatusEnum = pgEnum('consolidation_status', [
  'pending',
  'simulating',
  'submitted',
  'confirmed',
  'failed',
]);

export const questTypeEnum = pgEnum('quest_type', [
  'scan',
  'consolidate',
  'refer',
  'streak',
  'volume',
  'social',
]);

export const questDifficultyEnum = pgEnum('quest_difficulty', [
  'easy',
  'medium',
  'hard',
]);

export const questStatusEnum = pgEnum('quest_status', [
  'available',
  'in_progress',
  'completed',
  'expired',
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'safe',
  'low',
  'medium',
  'high',
  'critical',
]);

// ============================================
// USERS TABLE
// ============================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletAddress: text('wallet_address').notNull().unique(),
    farcasterFid: integer('farcaster_fid').unique(),
    farcasterUsername: text('farcaster_username'),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),

    // Gamification
    totalXp: integer('total_xp').default(0).notNull(),
    weeklyXp: integer('weekly_xp').default(0).notNull(),
    monthlyXp: integer('monthly_xp').default(0).notNull(),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    lastStreakDate: timestamp('last_streak_date', { withTimezone: true }),

    // Activity Stats
    totalScans: integer('total_scans').default(0).notNull(),
    totalConsolidations: integer('total_consolidations').default(0).notNull(),
    totalTokensConsolidated: integer('total_tokens_consolidated').default(0).notNull(),
    totalValueConsolidatedUsd: decimal('total_value_consolidated_usd', {
      precision: 18,
      scale: 6,
    }).default('0'),
    totalGasSavedUsd: decimal('total_gas_saved_usd', {
      precision: 18,
      scale: 6,
    }).default('0'),

    // Referrals
    referralCode: text('referral_code').notNull().unique(),
    referredBy: uuid('referred_by'),
    referralCount: integer('referral_count').default(0).notNull(),
    referralEarningsUsd: decimal('referral_earnings_usd', {
      precision: 18,
      scale: 6,
    }).default('0'),

    // Preferences
    preferredChainId: integer('preferred_chain_id').default(8453),
    preferredOutputToken: text('preferred_output_token').default(
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
    ),
    slippageTolerance: decimal('slippage_tolerance', {
      precision: 5,
      scale: 2,
    }).default('0.5'),
    autoShareFarcaster: boolean('auto_share_farcaster').default(false),

    // Session
    nonce: text('nonce'),
    nonceExpiresAt: timestamp('nonce_expires_at', { withTimezone: true }),

    // Metadata
    isActive: boolean('is_active').default(true).notNull(),
    isBanned: boolean('is_banned').default(false).notNull(),
    banReason: text('ban_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  },
  (table) => ({
    walletIdx: uniqueIndex('users_wallet_idx').on(table.walletAddress),
    farcasterFidIdx: uniqueIndex('users_farcaster_fid_idx').on(table.farcasterFid),
    referralCodeIdx: uniqueIndex('users_referral_code_idx').on(table.referralCode),
    referredByIdx: index('users_referred_by_idx').on(table.referredBy),
    totalXpIdx: index('users_total_xp_idx').on(table.totalXp.desc()),
    weeklyXpIdx: index('users_weekly_xp_idx').on(table.weeklyXp.desc()),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt.desc()),
    lastActiveIdx: index('users_last_active_idx').on(table.lastActiveAt.desc()),
  })
);

// ============================================
// SCANS TABLE
// ============================================

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletAddress: text('wallet_address').notNull(),
    chainId: integer('chain_id').notNull(),

    // Results
    status: scanStatusEnum('status').default('pending').notNull(),
    totalTokens: integer('total_tokens').default(0).notNull(),
    dustTokens: integer('dust_tokens').default(0).notNull(),
    totalValueUsd: decimal('total_value_usd', { precision: 18, scale: 6 }),
    dustValueUsd: decimal('dust_value_usd', { precision: 18, scale: 6 }),
    consolidatableValueUsd: decimal('consolidatable_value_usd', {
      precision: 18,
      scale: 6,
    }),

    // Token data (JSONB for flexibility)
    tokensData: jsonb('tokens_data').$type<{
      tokens: Array<{
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        balance: string;
        valueUsd: number;
        priceUsd: number;
        isDust: boolean;
        riskScore?: number;
        riskLevel?: string;
      }>;
    }>(),

    // Performance metrics
    scanDurationMs: integer('scan_duration_ms'),
    rpcProvider: text('rpc_provider'),
    rpcCallCount: integer('rpc_call_count'),

    // Error handling
    errorMessage: text('error_message'),
    errorCode: text('error_code'),
    retryCount: integer('retry_count').default(0),

    // XP awarded
    xpAwarded: integer('xp_awarded').default(0),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('scans_user_id_idx').on(table.userId),
    userCreatedIdx: index('scans_user_created_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
    walletChainIdx: index('scans_wallet_chain_idx').on(
      table.walletAddress,
      table.chainId
    ),
    statusIdx: index('scans_status_idx').on(table.status),
    chainIdx: index('scans_chain_idx').on(table.chainId),
    createdAtIdx: index('scans_created_at_idx').on(table.createdAt.desc()),
  })
);

// ============================================
// CONSOLIDATIONS TABLE
// ============================================

export const consolidations = pgTable(
  'consolidations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scanId: uuid('scan_id').references(() => scans.id, { onDelete: 'set null' }),

    // Chain & Wallet
    chainId: integer('chain_id').notNull(),
    walletAddress: text('wallet_address').notNull(),
    smartAccountAddress: text('smart_account_address'),

    // Input tokens
    tokensIn: text('tokens_in').array().notNull(),
    tokensInSymbols: text('tokens_in_symbols').array(),
    amountsIn: text('amounts_in').array().notNull(),
    valuesInUsd: decimal('values_in_usd', { precision: 18, scale: 6 }).array(),
    totalValueInUsd: decimal('total_value_in_usd', { precision: 18, scale: 6 }),

    // Output token
    tokenOut: text('token_out').notNull(),
    tokenOutSymbol: text('token_out_symbol'),
    amountOut: text('amount_out'),
    amountOutUsd: decimal('amount_out_usd', { precision: 18, scale: 6 }),

    // Swap details
    slippage: decimal('slippage', { precision: 5, scale: 2 }).default('0.5'),
    priceImpact: decimal('price_impact', { precision: 5, scale: 2 }),
    route: jsonb('route').$type<{
      steps: Array<{
        protocol: string;
        fromToken: string;
        toToken: string;
        portion: number;
      }>;
    }>(),

    // Gas & Fees
    gasEstimateWei: text('gas_estimate_wei'),
    gasUsedWei: text('gas_used_wei'),
    gasPriceWei: text('gas_price_wei'),
    gasEstimateUsd: decimal('gas_estimate_usd', { precision: 18, scale: 6 }),
    gasActualUsd: decimal('gas_actual_usd', { precision: 18, scale: 6 }),
    gasSavedUsd: decimal('gas_saved_usd', { precision: 18, scale: 6 }),
    protocolFeeUsd: decimal('protocol_fee_usd', { precision: 18, scale: 6 }),
    protocolFeePercent: decimal('protocol_fee_percent', {
      precision: 5,
      scale: 2,
    }).default('0.8'),

    // Referral
    referrerId: uuid('referrer_id').references(() => users.id),
    referralFeeUsd: decimal('referral_fee_usd', { precision: 18, scale: 6 }),

    // Blockchain references
    userOpHash: text('user_op_hash').unique(),
    txHash: text('tx_hash').unique(),
    blockNumber: bigint('block_number', { mode: 'bigint' }),
    blockTimestamp: timestamp('block_timestamp', { withTimezone: true }),

    // Status
    status: consolidationStatusEnum('status').default('pending').notNull(),
    errorMessage: text('error_message'),
    errorCode: text('error_code'),
    retryCount: integer('retry_count').default(0),

    // Simulation
    simulationPassed: boolean('simulation_passed'),
    simulationError: text('simulation_error'),

    // XP awarded
    xpAwarded: integer('xp_awarded').default(0),

    // Timing
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    simulatedAt: timestamp('simulated_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('consolidations_user_id_idx').on(table.userId),
    userCreatedIdx: index('consolidations_user_created_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
    scanIdIdx: index('consolidations_scan_id_idx').on(table.scanId),
    userOpHashIdx: uniqueIndex('consolidations_user_op_hash_idx').on(table.userOpHash),
    txHashIdx: uniqueIndex('consolidations_tx_hash_idx').on(table.txHash),
    statusIdx: index('consolidations_status_idx').on(table.status),
    chainIdx: index('consolidations_chain_idx').on(table.chainId),
    createdAtIdx: index('consolidations_created_at_idx').on(table.createdAt.desc()),
  })
);

// ============================================
// TOKEN RISK CACHE TABLE
// ============================================

export const tokenRiskCache = pgTable(
  'token_risk_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenAddress: text('token_address').notNull(),
    chainId: integer('chain_id').notNull(),

    // Risk scores
    overallScore: integer('overall_score').notNull(),
    riskLevel: riskLevelEnum('risk_level').notNull(),
    confidence: decimal('confidence', { precision: 5, scale: 2 }),

    // Layer scores (JSONB for flexibility)
    layerScores: jsonb('layer_scores').$type<{
      contractSafety: number;
      honeypotRisk: number;
      holderConcentration: number;
      liquidityScore: number;
      communityScore: number;
      auditStatus: number;
      volatility: number;
      volumeTrend: number;
      exchangeListings: number;
      mevProtection: number;
      gasEfficiency: number;
      carbonImpact: number;
    }>(),

    // Detailed indicators (JSONB)
    indicators: jsonb('indicators').$type<Record<string, unknown>>(),

    // Data sources used
    dataSources: text('data_sources').array(),

    // Cache metadata
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isStale: boolean('is_stale').default(false),
  },
  (table) => ({
    tokenChainIdx: uniqueIndex('token_risk_token_chain_idx').on(
      table.tokenAddress,
      table.chainId
    ),
    riskLevelIdx: index('token_risk_level_idx').on(table.riskLevel),
    expiresAtIdx: index('token_risk_expires_idx').on(table.expiresAt),
  })
);

// ============================================
// QUESTS TABLE
// ============================================

export const quests = pgTable(
  'quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    type: questTypeEnum('type').notNull(),
    difficulty: questDifficultyEnum('difficulty').notNull(),
    xpReward: integer('xp_reward').notNull(),

    // Requirements
    targetValue: integer('target_value').notNull(),
    requirementType: text('requirement_type').notNull(), // 'count', 'volume', 'streak'

    // Availability
    isActive: boolean('is_active').default(true).notNull(),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    recurringPeriod: text('recurring_period'), // 'daily', 'weekly', 'monthly'
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // Metadata
    iconUrl: text('icon_url'),
    badgeUrl: text('badge_url'),
    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    typeIdx: index('quests_type_idx').on(table.type),
    difficultyIdx: index('quests_difficulty_idx').on(table.difficulty),
    activeIdx: index('quests_active_idx').on(table.isActive),
    sortIdx: index('quests_sort_idx').on(table.sortOrder),
  })
);

// ============================================
// USER QUESTS (Progress Tracking)
// ============================================

export const userQuests = pgTable(
  'user_quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questId: uuid('quest_id')
      .notNull()
      .references(() => quests.id, { onDelete: 'cascade' }),

    // Progress
    status: questStatusEnum('status').default('available').notNull(),
    currentProgress: integer('current_progress').default(0).notNull(),
    targetProgress: integer('target_progress').notNull(),

    // Completion
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    xpAwarded: integer('xp_awarded').default(0),

    // For recurring quests
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userQuestIdx: uniqueIndex('user_quests_user_quest_idx').on(
      table.userId,
      table.questId,
      table.periodStart
    ),
    userIdIdx: index('user_quests_user_id_idx').on(table.userId),
    questIdIdx: index('user_quests_quest_id_idx').on(table.questId),
    statusIdx: index('user_quests_status_idx').on(table.status),
  })
);

// ============================================
// ACHIEVEMENTS TABLE
// ============================================

export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(), // 'scan', 'consolidate', 'streak', 'referral', 'special'
    tier: text('tier').notNull(), // 'bronze', 'silver', 'gold', 'platinum', 'diamond'

    // Requirements
    requirementType: text('requirement_type').notNull(),
    requirementValue: integer('requirement_value').notNull(),

    // Rewards
    xpReward: integer('xp_reward').notNull(),
    badgeUrl: text('badge_url'),

    // Metadata
    isSecret: boolean('is_secret').default(false),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('achievements_category_idx').on(table.category),
    tierIdx: index('achievements_tier_idx').on(table.tier),
  })
);

// ============================================
// USER ACHIEVEMENTS
// ============================================

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),

    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
    xpAwarded: integer('xp_awarded').default(0),
    sharedOnFarcaster: boolean('shared_on_farcaster').default(false),
  },
  (table) => ({
    userAchievementIdx: uniqueIndex('user_achievements_user_achievement_idx').on(
      table.userId,
      table.achievementId
    ),
    userIdIdx: index('user_achievements_user_id_idx').on(table.userId),
    unlockedAtIdx: index('user_achievements_unlocked_idx').on(table.unlockedAt.desc()),
  })
);

// ============================================
// LEADERBOARD SNAPSHOTS
// ============================================

export const leaderboardSnapshots = pgTable(
  'leaderboard_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    period: text('period').notNull(), // 'weekly', 'monthly', 'all_time'
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

    // Top users data (JSONB)
    rankings: jsonb('rankings').$type<
      Array<{
        rank: number;
        userId: string;
        walletAddress: string;
        displayName?: string;
        avatarUrl?: string;
        farcasterFid?: number;
        totalXp: number;
        periodXp: number;
        totalConsolidations: number;
        totalGasSavedUsd: number;
      }>
    >(),

    // Stats
    totalParticipants: integer('total_participants').default(0),
    totalXpAwarded: integer('total_xp_awarded').default(0),
    prizePoolEth: decimal('prize_pool_eth', { precision: 18, scale: 8 }),
    prizesDistributed: boolean('prizes_distributed').default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    periodIdx: index('leaderboard_period_idx').on(table.period),
    periodStartIdx: index('leaderboard_period_start_idx').on(table.periodStart.desc()),
  })
);

// ============================================
// API USAGE TRACKING
// ============================================

export const apiUsage = pgTable(
  'api_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    statusCode: integer('status_code'),
    responseTimeMs: integer('response_time_ms'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),
    errorCode: text('error_code'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('api_usage_user_id_idx').on(table.userId),
    endpointIdx: index('api_usage_endpoint_idx').on(table.endpoint),
    createdAtIdx: index('api_usage_created_at_idx').on(table.createdAt.desc()),
  })
);

// ============================================
// PROTOCOL STATS (Aggregate)
// ============================================

export const protocolStats = pgTable('protocol_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date', { withTimezone: true }).notNull().unique(),

  // User stats
  totalUsers: integer('total_users').default(0),
  newUsers: integer('new_users').default(0),
  activeUsers: integer('active_users').default(0),

  // Activity stats
  totalScans: integer('total_scans').default(0),
  totalConsolidations: integer('total_consolidations').default(0),
  totalTokensConsolidated: integer('total_tokens_consolidated').default(0),

  // Value stats
  totalValueConsolidatedUsd: decimal('total_value_consolidated_usd', {
    precision: 18,
    scale: 6,
  }).default('0'),
  totalGasSavedUsd: decimal('total_gas_saved_usd', {
    precision: 18,
    scale: 6,
  }).default('0'),
  totalProtocolFeesUsd: decimal('total_protocol_fees_usd', {
    precision: 18,
    scale: 6,
  }).default('0'),

  // Chain breakdown (JSONB)
  chainStats: jsonb('chain_stats').$type<
    Record<
      number,
      {
        scans: number;
        consolidations: number;
        valueUsd: number;
      }
    >
  >(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: 'referrals',
  }),
  referrals: many(users, { relationName: 'referrals' }),
  scans: many(scans),
  consolidations: many(consolidations),
  userQuests: many(userQuests),
  userAchievements: many(userAchievements),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  user: one(users, {
    fields: [scans.userId],
    references: [users.id],
  }),
  consolidations: many(consolidations),
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
  referrer: one(users, {
    fields: [consolidations.referrerId],
    references: [users.id],
  }),
}));

export const questsRelations = relations(quests, ({ many }) => ({
  userQuests: many(userQuests),
}));

export const userQuestsRelations = relations(userQuests, ({ one }) => ({
  user: one(users, {
    fields: [userQuests.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [userQuests.questId],
    references: [quests.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;

export type Consolidation = typeof consolidations.$inferSelect;
export type NewConsolidation = typeof consolidations.$inferInsert;

export type TokenRiskCache = typeof tokenRiskCache.$inferSelect;
export type NewTokenRiskCache = typeof tokenRiskCache.$inferInsert;

export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;

export type UserQuest = typeof userQuests.$inferSelect;
export type NewUserQuest = typeof userQuests.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export type LeaderboardSnapshot = typeof leaderboardSnapshots.$inferSelect;
export type NewLeaderboardSnapshot = typeof leaderboardSnapshots.$inferInsert;

export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;

export type ProtocolStats = typeof protocolStats.$inferSelect;
export type NewProtocolStats = typeof protocolStats.$inferInsert;
