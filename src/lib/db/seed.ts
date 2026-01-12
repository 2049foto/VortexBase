/**
 * VORTEX PROTOCOL - DATABASE SEED
 * Initial data for quests and achievements
 * Run with: bun run db:seed
 */

import { db } from './index';
import { quests, achievements } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // ============================================
  // SEED QUESTS
  // ============================================

  const questsData = [
    // Daily Quests
    {
      title: 'Daily Scanner',
      description: 'Scan your wallet once today',
      type: 'scan' as const,
      difficulty: 'easy' as const,
      xpReward: 50,
      targetValue: 1,
      requirementType: 'count',
      isRecurring: true,
      recurringPeriod: 'daily',
      sortOrder: 1,
    },
    {
      title: 'Dust Buster',
      description: 'Consolidate 3 dust tokens today',
      type: 'consolidate' as const,
      difficulty: 'medium' as const,
      xpReward: 150,
      targetValue: 3,
      requirementType: 'count',
      isRecurring: true,
      recurringPeriod: 'daily',
      sortOrder: 2,
    },

    // Weekly Quests
    {
      title: 'Weekly Warrior',
      description: 'Scan your wallet 5 times this week',
      type: 'scan' as const,
      difficulty: 'medium' as const,
      xpReward: 200,
      targetValue: 5,
      requirementType: 'count',
      isRecurring: true,
      recurringPeriod: 'weekly',
      sortOrder: 10,
    },
    {
      title: 'Clean Machine',
      description: 'Consolidate 10 tokens this week',
      type: 'consolidate' as const,
      difficulty: 'hard' as const,
      xpReward: 500,
      targetValue: 10,
      requirementType: 'count',
      isRecurring: true,
      recurringPeriod: 'weekly',
      sortOrder: 11,
    },
    {
      title: 'Social Butterfly',
      description: 'Share your consolidation on Farcaster',
      type: 'social' as const,
      difficulty: 'easy' as const,
      xpReward: 75,
      targetValue: 1,
      requirementType: 'count',
      isRecurring: true,
      recurringPeriod: 'weekly',
      sortOrder: 12,
    },

    // Streak Quests
    {
      title: 'Streak Starter',
      description: 'Maintain a 3-day streak',
      type: 'streak' as const,
      difficulty: 'easy' as const,
      xpReward: 100,
      targetValue: 3,
      requirementType: 'streak',
      isRecurring: false,
      sortOrder: 20,
    },
    {
      title: 'Consistency King',
      description: 'Maintain a 7-day streak',
      type: 'streak' as const,
      difficulty: 'medium' as const,
      xpReward: 300,
      targetValue: 7,
      requirementType: 'streak',
      isRecurring: false,
      sortOrder: 21,
    },
    {
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      type: 'streak' as const,
      difficulty: 'hard' as const,
      xpReward: 1000,
      targetValue: 30,
      requirementType: 'streak',
      isRecurring: false,
      sortOrder: 22,
    },

    // Referral Quests
    {
      title: 'Friend Finder',
      description: 'Refer 1 friend to Vortex',
      type: 'refer' as const,
      difficulty: 'easy' as const,
      xpReward: 200,
      targetValue: 1,
      requirementType: 'count',
      isRecurring: false,
      sortOrder: 30,
    },
    {
      title: 'Team Builder',
      description: 'Refer 5 friends to Vortex',
      type: 'refer' as const,
      difficulty: 'medium' as const,
      xpReward: 750,
      targetValue: 5,
      requirementType: 'count',
      isRecurring: false,
      sortOrder: 31,
    },
    {
      title: 'Network Effect',
      description: 'Refer 25 friends to Vortex',
      type: 'refer' as const,
      difficulty: 'hard' as const,
      xpReward: 2500,
      targetValue: 25,
      requirementType: 'count',
      isRecurring: false,
      sortOrder: 32,
    },

    // Volume Quests
    {
      title: 'First $10',
      description: 'Consolidate $10 worth of dust tokens',
      type: 'volume' as const,
      difficulty: 'easy' as const,
      xpReward: 100,
      targetValue: 10,
      requirementType: 'volume',
      isRecurring: false,
      sortOrder: 40,
    },
    {
      title: 'Century Club',
      description: 'Consolidate $100 worth of dust tokens',
      type: 'volume' as const,
      difficulty: 'medium' as const,
      xpReward: 500,
      targetValue: 100,
      requirementType: 'volume',
      isRecurring: false,
      sortOrder: 41,
    },
    {
      title: 'Whale Watcher',
      description: 'Consolidate $1000 worth of dust tokens',
      type: 'volume' as const,
      difficulty: 'hard' as const,
      xpReward: 2000,
      targetValue: 1000,
      requirementType: 'volume',
      isRecurring: false,
      sortOrder: 42,
    },
  ];

  console.log(`  → Inserting ${questsData.length} quests...`);
  await db.insert(quests).values(questsData).onConflictDoNothing();

  // ============================================
  // SEED ACHIEVEMENTS
  // ============================================

  const achievementsData = [
    // Scan achievements
    {
      name: 'first_scan',
      title: 'First Scan',
      description: 'Complete your first wallet scan',
      category: 'scan',
      tier: 'bronze',
      requirementType: 'total_scans',
      requirementValue: 1,
      xpReward: 50,
    },
    {
      name: 'scanner_10',
      title: 'Keen Observer',
      description: 'Complete 10 wallet scans',
      category: 'scan',
      tier: 'silver',
      requirementType: 'total_scans',
      requirementValue: 10,
      xpReward: 150,
    },
    {
      name: 'scanner_50',
      title: 'Dust Detective',
      description: 'Complete 50 wallet scans',
      category: 'scan',
      tier: 'gold',
      requirementType: 'total_scans',
      requirementValue: 50,
      xpReward: 500,
    },
    {
      name: 'scanner_100',
      title: 'Master Scanner',
      description: 'Complete 100 wallet scans',
      category: 'scan',
      tier: 'platinum',
      requirementType: 'total_scans',
      requirementValue: 100,
      xpReward: 1000,
    },

    // Consolidation achievements
    {
      name: 'first_consolidation',
      title: 'First Clean',
      description: 'Complete your first consolidation',
      category: 'consolidate',
      tier: 'bronze',
      requirementType: 'total_consolidations',
      requirementValue: 1,
      xpReward: 100,
    },
    {
      name: 'consolidator_10',
      title: 'Dust Collector',
      description: 'Complete 10 consolidations',
      category: 'consolidate',
      tier: 'silver',
      requirementType: 'total_consolidations',
      requirementValue: 10,
      xpReward: 300,
    },
    {
      name: 'consolidator_50',
      title: 'Clean Sweep',
      description: 'Complete 50 consolidations',
      category: 'consolidate',
      tier: 'gold',
      requirementType: 'total_consolidations',
      requirementValue: 50,
      xpReward: 1000,
    },
    {
      name: 'tokens_100',
      title: 'Century Cleaner',
      description: 'Consolidate 100 tokens total',
      category: 'consolidate',
      tier: 'platinum',
      requirementType: 'total_tokens_consolidated',
      requirementValue: 100,
      xpReward: 1500,
    },

    // Streak achievements
    {
      name: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      category: 'streak',
      tier: 'silver',
      requirementType: 'longest_streak',
      requirementValue: 7,
      xpReward: 250,
    },
    {
      name: 'streak_30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      category: 'streak',
      tier: 'gold',
      requirementType: 'longest_streak',
      requirementValue: 30,
      xpReward: 750,
    },
    {
      name: 'streak_100',
      title: 'Legendary Dedication',
      description: 'Maintain a 100-day streak',
      category: 'streak',
      tier: 'diamond',
      requirementType: 'longest_streak',
      requirementValue: 100,
      xpReward: 2500,
    },

    // Referral achievements
    {
      name: 'first_referral',
      title: 'Friend Finder',
      description: 'Refer your first friend',
      category: 'referral',
      tier: 'bronze',
      requirementType: 'referral_count',
      requirementValue: 1,
      xpReward: 200,
    },
    {
      name: 'referral_10',
      title: 'Network Builder',
      description: 'Refer 10 friends',
      category: 'referral',
      tier: 'gold',
      requirementType: 'referral_count',
      requirementValue: 10,
      xpReward: 1000,
    },
    {
      name: 'referral_50',
      title: 'Community Champion',
      description: 'Refer 50 friends',
      category: 'referral',
      tier: 'diamond',
      requirementType: 'referral_count',
      requirementValue: 50,
      xpReward: 5000,
    },

    // Volume achievements
    {
      name: 'volume_100',
      title: 'Hundred Dollar Hero',
      description: 'Consolidate $100 worth of tokens',
      category: 'volume',
      tier: 'silver',
      requirementType: 'total_value_consolidated_usd',
      requirementValue: 100,
      xpReward: 300,
    },
    {
      name: 'volume_1000',
      title: 'Thousand Dollar Club',
      description: 'Consolidate $1,000 worth of tokens',
      category: 'volume',
      tier: 'gold',
      requirementType: 'total_value_consolidated_usd',
      requirementValue: 1000,
      xpReward: 1000,
    },
    {
      name: 'volume_10000',
      title: 'DeFi Whale',
      description: 'Consolidate $10,000 worth of tokens',
      category: 'volume',
      tier: 'diamond',
      requirementType: 'total_value_consolidated_usd',
      requirementValue: 10000,
      xpReward: 5000,
    },

    // Gas savings achievements
    {
      name: 'gas_saved_10',
      title: 'Gas Saver',
      description: 'Save $10 in gas fees',
      category: 'special',
      tier: 'bronze',
      requirementType: 'total_gas_saved_usd',
      requirementValue: 10,
      xpReward: 100,
    },
    {
      name: 'gas_saved_100',
      title: 'Efficiency Expert',
      description: 'Save $100 in gas fees',
      category: 'special',
      tier: 'gold',
      requirementType: 'total_gas_saved_usd',
      requirementValue: 100,
      xpReward: 500,
    },

    // Special achievements
    {
      name: 'early_adopter',
      title: 'Early Adopter',
      description: 'Joined during Phase 1',
      category: 'special',
      tier: 'gold',
      requirementType: 'special',
      requirementValue: 0,
      xpReward: 500,
      isSecret: true,
    },
    {
      name: 'og_vortexer',
      title: 'OG Vortexer',
      description: 'One of the first 100 users',
      category: 'special',
      tier: 'diamond',
      requirementType: 'special',
      requirementValue: 0,
      xpReward: 2000,
      isSecret: true,
    },
  ];

  console.log(`  → Inserting ${achievementsData.length} achievements...`);
  await db.insert(achievements).values(achievementsData).onConflictDoNothing();

  console.log('✅ Database seeded successfully!');
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
